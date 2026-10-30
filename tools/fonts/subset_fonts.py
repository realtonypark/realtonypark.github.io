#!/usr/bin/env python3
"""Subset and split this site's webfonts into preloaded core + unicode-range extended files.

Usage:
    python3 tools/fonts/subset_fonts.py

Reads pinned sources from tools/fonts/sources/, writes 16 .woff2 files plus
fonts.css into assets/fonts/. Commit the outputs.

Rerun when any of these change:
  - site content gains characters outside the current coverage (the script
    rescans _posts, _data, _drafts, _includes, _layouts, top-level
    pages, _config.yml, and assets/main.scss on every run, so just
    rerun it after content changes and commit whatever changed);
  - the Google Fonts request in _includes/head.html changes (families,
    weights, styles);
  - font-family / font-weight / font-style rules in assets/main.scss change
    (in particular which weights each family needs -- see FACES below).

What it does per face:
  1. Build a full-coverage base font: Spectral merges Google's latin and
     latin-ext slices; Inter/Fraunces start from the pinned upstream
     variable fonts (fontTools cannot merge variable fonts, and the
     upstream files were verified outline-identical to what Google serves).
  2. Pin variable axes Google doesn't serve at their defaults
     (Inter opsz at 14, Fraunces SOFT at 0 and WONK at 1) and keep the
     full wght and opsz ranges. Narrowing wght was measured: it saves
     roughly 10KB per Inter file and 7KB per Fraunces file, but the
     instancer's delta re-normalization shifts interpolated
     instances a few units and its avar restriction renders wrong
     weights, so the range stays full to keep rendering identical.
  3. Keep used characters + Latin-1 + Latin Extended-A, intersected with
     what Google actually serves today, so characters that currently
     render in fallback fonts (arrows, check mark, emoji, CJK, ...) keep
     doing exactly that.
  4. Split into core (ASCII + the punctuation most pages use, preloaded)
     and extended (the rest, fetched only when a page needs it).
  5. Emit fonts.css with one @font-face per weight and split. Every
     unicode-range is derived from the actual output file's cmap, so a
     range never claims a character the file lacks.
  6. Self-check every output: reopen it, compare its cmap against the
     intent, confirm gasp survived, confirm the layout-feature allowlist,
     and confirm instances at every used weight render the same outlines
     as the pre-subset source.

Requires: fonttools + brotli (pip install fonttools brotli) and the
woff2_compress binary (brew install woff2).
"""

import hashlib
import html
import io
import json
import re
import sys
from pathlib import Path

from fontTools.merge import Merger
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent.parent
SRC = ROOT / "tools" / "fonts" / "sources"
OUT = ROOT / "assets" / "fonts"

# Always-on or default-on layout features. Everything else (frac, dnom,
# numr, pnum, ...) is off by default, unused by author stylesheets and
# by browser UA stylesheets, and dropped. Exception: tnum is required
# for Inter because Chromium's UA stylesheet sets
# font-variant-numeric: tabular-nums on ::marker, which substitutes the
# .tf figure variants for list numbers. (Spectral's tnum only maps
# unused .LP variants back to defaults, so dropping it there is a
# no-op; Fraunces has no tnum upstream.)
KEEP_FEATURES = ["calt", "ccmp", "liga", "locl", "rvrn", "kern", "mark", "mkmk"]
KEEP_FEATURES_INTER = KEEP_FEATURES + ["tnum"]

# Core = printable ASCII + space + the punctuation most pages use.
CORE_EXTRA = [0x2018, 0x2019, 0x201C, 0x201D,  # curly quotes
              0x2013, 0x2014,                  # en/em dash
              0x2026,                          # ellipsis
              0x2022]                          # bullet (quiet-mode TOC marker)
CORE = set(range(0x20, 0x7F)) | set(CORE_EXTRA)
LATIN1 = set(range(0xA0, 0x100))
EXT_A = set(range(0x100, 0x180))

# (key, family, style, weights, out_stem, build, check_instances)
# build is ("merge", [files]) or ("variable", file, axis_limits).
# check_instances lists (axes, label) used by the outline self-check.
FACES = [
    ("inter", "Inter", "normal", (400, 500, 600), "inter-var",
     ("variable", "Inter.ttf", {"pin": {"opsz": 14}}),
     [({"wght": w}, "wght=%d" % w) for w in (400, 500, 600)]),
    ("fraunces", "Fraunces", "normal", (300, 400), "fraunces-var",
     ("variable", "Fraunces.ttf", {"pin": {"SOFT": 0, "WONK": 1}}),
     [({"wght": w, "opsz": o}, "wght=%d opsz=%d" % (w, o))
      for w in (300, 400) for o in (9, 36)]),
    ("spectral-400", "Spectral", "normal", (400,), "spectral-400",
     ("merge", ["spectral-400-latin.woff2", "spectral-400-latinext.woff2"]),
     [({}, "static")]),
    ("spectral-500", "Spectral", "normal", (500,), "spectral-500",
     ("merge", ["spectral-500-latin.woff2", "spectral-500-latinext.woff2"]),
     [({}, "static")]),
    ("spectral-600", "Spectral", "normal", (600,), "spectral-600",
     ("merge", ["spectral-600-latin.woff2", "spectral-600-latinext.woff2"]),
     [({}, "static")]),
    ("spectral-700", "Spectral", "normal", (700,), "spectral-700",
     ("merge", ["spectral-700-latin.woff2", "spectral-700-latinext.woff2"]),
     [({}, "static")]),
    ("spectral-italic400", "Spectral", "italic", (400,), "spectral-italic400",
     ("merge", ["spectral-italic400-latin.woff2",
                "spectral-italic400-latinext.woff2"]),
     [({}, "static")]),
    ("spectral-italic500", "Spectral", "italic", (500,), "spectral-italic500",
     ("merge", ["spectral-italic500-latin.woff2",
                "spectral-italic500-latinext.woff2"]),
     [({}, "static")]),
]

# Directories and files whose text can reach rendered pages. Jekyll input
# directories only -- never _site (gitignored build output: stale and
# machine-local, so scanning it makes the charset unreproducible).
# _data matters: holdings.md renders values from _data/portfolio.yml.
# _drafts is rendered by local `jekyll --drafts` previews against these
# same committed fonts, so it counts despite never publishing.
# _research/_syllabi are deliberately NOT scanned: _config.yml excludes
# them from the build, so Jekyll never publishes their content and
# their characters must not leak into font payloads.
# Missing dirs are skipped, not an error (not every checkout has all).
SCAN_DIRS = ["_posts", "_data", "_drafts", "_includes", "_layouts"]
# Jekyll _data formats (.yml/.yaml/.json/.csv/.tsv) plus page/template
# formats. New data files in any supported format are picked up.
SCAN_SUFFIXES = (".md", ".html", ".js", ".scss",
                 ".yml", ".yaml", ".json", ".csv", ".tsv")
SCAN_GLOBS = ["*.md", "*.html", "_config.yml", "assets/main.scss"]
# Top-level docs mirrored from _config.yml `exclude:`: never published,
# so their characters must not enter the subsets either.
SKIP_TOP = {"AGENTS.md", "CLAUDE.md", "README.md", "SEO-AUDIT.md"}


def scan_content():
    """Collect every character that can appear in rendered pages."""
    texts = []
    for d in SCAN_DIRS:
        root = ROOT / d
        if not root.is_dir():
            continue
        for p in root.rglob("*"):
            if p.is_file() and p.suffix in SCAN_SUFFIXES:
                texts.append(p.read_text(encoding="utf-8", errors="replace"))
    for g in SCAN_GLOBS:
        for p in ROOT.glob(g):
            if p.is_file() and p.name not in SKIP_TOP:
                texts.append(p.read_text(encoding="utf-8", errors="replace"))
    chars = set()
    for t in texts:
        chars |= set(html.unescape(t))
    chars = {c for c in chars if c == " " or not c.isspace()}
    return chars


def load_coverage(name):
    return set(ord(c) for c in
               (ROOT / "tools" / "fonts" / ("coverage-%s.txt" % name))
               .read_text(encoding="utf-8"))


def fvar_tuple(font, axis_tag):
    for a in font["fvar"].axes:
        if a.axisTag == axis_tag:
            return (a.minValue, a.defaultValue, a.maxValue)
    raise KeyError(axis_tag)


def norm_axis(u, mini, default, maxi):
    if u >= default:
        return 0.0 if maxi == default else min(1.0, (u - default) / (maxi - default))
    return max(-1.0, (u - default) / (default - mini))


def unnorm_axis(n, mini, default, maxi):
    if n < 0:
        return default + n * (default - mini)
    return default + n * (maxi - default)


def avar_segments(font, axis_tag):
    if "avar" not in font or axis_tag not in font["avar"].segments:
        return {-1.0: -1.0, 0.0: 0.0, 1.0: 1.0}
    return {float(k): float(v) for k, v in
            font["avar"].segments[axis_tag].items()}


def avar_lookup(segments, n):
    keys = sorted(segments)
    if n <= keys[0]:
        return segments[keys[0]]
    for a, b in zip(keys, keys[1:]):
        if n <= b:
            va, vb = segments[a], segments[b]
            return va if b == a else va + (n - a) / (b - a) * (vb - va)
    return segments[keys[-1]]


def build_base(build):
    kind = build[0]
    if kind == "merge":
        font = Merger().merge([str(SRC / f) for f in build[1]])
        served = set(font.getBestCmap())
        return font, served
    # Variable faces: pin axes Google doesn't serve (Inter opsz,
    # Fraunces SOFT/WONK) at their defaults and keep the full wght
    # range. Narrowing wght re-normalizes deltas, which shifts
    # interpolated instances a few units and breaks the instancer's
    # avar handling; keeping the range renders bit-identically to
    # Google's files (verified per glyph against ground truth).
    _, filename, spec = build
    font = TTFont(str(SRC / filename))
    instantiateVariableFont(font, dict(spec["pin"]), inplace=True)
    if "avar" in font:
        live = {a.axisTag for a in font["fvar"].axes}
        for tag in list(font["avar"].segments.keys()):
            if tag not in live:
                del font["avar"].segments[tag]
    served = None  # caller supplies the pinned served coverage
    return font, served


def find_woff2_compress():
    import shutil
    for cand in ("woff2_compress", "/opt/homebrew/bin/woff2_compress",
                 "/usr/local/bin/woff2_compress"):
        if shutil.which(cand):
            return cand
    raise SystemExit(
        "woff2_compress not found (brew install woff2). "
        "Google's encoder applies the glyf/loca transforms; "
        "fontTools' built-in woff2 output is ~3x larger.")


def pin_modified(ttf_path):
    """Zero head.modified in a saved TTF so reruns are byte-identical.

    fontTools stamps the current time on every save; patch the bytes
    afterwards and recompute checkSumAdjustment to match.
    """
    import struct
    data = bytearray(Path(ttf_path).read_bytes())
    num_tables = struct.unpack(">H", data[4:6])[0]
    head_off = None
    for i in range(num_tables):
        rec = 12 + i * 16
        if data[rec:rec + 4] == b"head":
            head_off = struct.unpack(">L", data[rec + 8:rec + 12])[0]
            break
    assert head_off is not None
    # head layout: version(4) revision(4) checkSumAdj(4) magic(4)
    # flags(2) unitsPerEm(2) created(8) modified(8) ...
    data[head_off + 28:head_off + 36] = b"\0" * 8  # modified
    data[head_off + 8:head_off + 12] = b"\0" * 4  # checkSumAdjustment
    n = len(data) // 4 * 4
    s = sum(struct.unpack(">%dL" % (n // 4), data[:n]))
    if len(data) % 4:  # TTFs are 4-padded; guard anyway
        s += int.from_bytes(data[n:].ljust(4, b"\0"), "big")
    data[head_off + 8:head_off + 12] = struct.pack(
        ">L", (0xB1B0AFBA - (s & 0xFFFFFFFF)) & 0xFFFFFFFF)
    Path(ttf_path).write_bytes(bytes(data))


def subset_to(font, unicodes, out_path, features=None):
    import subprocess
    import tempfile
    opts = Options()
    opts.layout_features = list(features or KEEP_FEATURES)
    opts.hinting = False  # drop prep/fpgm/cvt programs; gasp stays
    opts.ignore_missing_unicodes = False
    # Keep glyph names (post 2.0). CoreText rasterizes post-3.0
    # subsets differently at small sizes; Google's files keep names.
    opts.glyph_names = True
    sub = Subsetter(opts)
    sub.populate(unicodes=sorted(unicodes))
    # copy via in-memory buffer so the base font stays reusable
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    f = TTFont(buf)
    sub.subset(f)
    with tempfile.TemporaryDirectory() as tmp:
        ttf = str(Path(tmp) / "out.ttf")
        f.save(ttf)
        pin_modified(ttf)
        r = subprocess.run([find_woff2_compress(), ttf],
                           capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit("woff2_compress failed: %s" % r.stderr)
        data = Path(str(Path(ttf).with_suffix(".woff2"))).read_bytes()
    out_path.write_bytes(data)
    return TTFont(str(out_path))


def to_ranges(cps):
    cps = sorted(cps)
    if not cps:
        return []
    runs = []
    start = prev = cps[0]
    for c in cps[1:]:
        if c == prev + 1:
            prev = c
        else:
            runs.append((start, prev))
            start = prev = c
    runs.append((start, prev))
    return runs


def fmt_range(lo, hi):
    if lo == hi:
        return "U+%X" % lo
    return "U+%X-%X" % (lo, hi)


def css_unicode_range(cps):
    return ", ".join(fmt_range(lo, hi) for lo, hi in to_ranges(cps))


def outlines(font, glyph_name):
    from fontTools.pens.recordingPen import DecomposingRecordingPen
    pen = DecomposingRecordingPen(font.getGlyphSet())
    font.getGlyphSet()[glyph_name].draw(pen)
    flat = []
    for op, vals in pen.value:
        for v in vals:
            if isinstance(v, (int, float)):
                flat.append(round(float(v), 4))
            elif isinstance(v, (tuple, list)):
                for x in v:
                    if isinstance(x, (int, float)):
                        flat.append(round(float(x), 4))
    return (tuple(op for op, _ in pen.value), tuple(flat))


def frozen(font):
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return TTFont(buf)


def outline_delta(o1, o2):
    """Max absolute coordinate difference, or None if structure differs."""
    if o1[0] != o2[0] or len(o1[1]) != len(o2[1]):
        return None
    if not o1[1]:
        return 0.0
    return max(abs(x - y) for x, y in zip(o1[1], o2[1]))


def browser_instance(font, axes):
    """Instantiate the way a browser does: through avar.

    fontTools' instancer maps user values to normalized locations
    linearly and ignores avar, but browsers warp through avar first.
    Map each request to the user value whose linear location equals
    the warped location, then instantiate that.
    """
    warped = {}
    for tag, value in axes.items():
        mini, default, maxi = fvar_tuple(font, tag)
        n = norm_axis(value, mini, default, maxi)
        w = avar_lookup(avar_segments(font, tag), n)
        warped[tag] = unnorm_axis(w, mini, default, maxi)
    instantiateVariableFont(font, warped, inplace=True)
    return warped


def check_instances(out_path, refs, instances, label, tol=2.0):
    """Instances of the output must match the served ground truth.

    refs is a list of (font path, codepoints it covers). Advances and
    side bearings must match within tol units and outlines within tol;
    anything beyond fails. Limiting a variable axis re-normalizes its
    deltas, which introduces up to 2 units of rounding noise at
    interpolated instances (2/2048 em, a few hundredths of a pixel at
    the sizes this site uses -- rasterizers quantize to 1/64 px, and
    the before/after pixel diffs confirm nothing visible changes);
    the check reports the worst case it sees. Real tool corruption
    (dropped outlines, broken interpolation) measures in tens to
    thousands of units, so this still catches it.
    """
    errors = []
    worst = 0.0
    for axes, tag in instances:
        a = TTFont(str(out_path))
        if axes:
            browser_instance(a, dict(axes))
        inst_refs = []
        for path, cps in refs:
            r = TTFont(str(path))
            if axes:
                browser_instance(r, dict(axes))
            inst_refs.append((r, cps))
        ca = a.getBestCmap()
        h1 = a["hmtx"]
        for cp in ca:
            for r, cps in inst_refs:
                if cp in cps:
                    break
            else:
                errors.append((tag, hex(cp), "no-ground-truth"))
                continue
            cb = r.getBestCmap()
            h2 = r["hmtx"]
            h1v, h2v = h1[ca[cp]], h2[cb[cp]]
            da = max(abs(h1v[0] - h2v[0]), abs(h1v[1] - h2v[1]))
            worst = max(worst, da)
            if da > tol:
                errors.append((tag, hex(cp), "advance", h1v, h2v))
                continue
            dd = outline_delta(outlines(a, ca[cp]), outlines(r, cb[cp]))
            if dd is None:
                errors.append((tag, hex(cp), "outline-structure"))
                continue
            worst = max(worst, dd)
            if dd > tol:
                errors.append((tag, hex(cp), "outline", dd))
    if errors:
        print("  MISMATCH %s: %d e.g. %s" % (label, len(errors), errors[:5]))
        return False
    print("  ground-truth ok %s (worst %.2fu)" % (label, worst))
    return True


def feature_tags(font, table):
    if table not in font:
        return []
    return sorted({r.FeatureTag for r in
                   font[table].table.FeatureList.FeatureRecord})


def check_tnum(out_path, refs, label, tol=2.0):
    """Inter core must keep working tnum (list markers need it).

    The tnum substitution targets (.tf glyphs) are unencoded, so the
    cmap-driven ground-truth check skips them; compare them by glyph
    name against the served slices instead.
    """
    out = TTFont(str(out_path))
    if "tnum" not in feature_tags(out, "GSUB"):
        print("  TNUM LOST %s" % label)
        return False
    gsub = out["GSUB"].table
    targets = set()
    for rec in gsub.FeatureList.FeatureRecord:
        if rec.FeatureTag != "tnum":
            continue
        for li in rec.Feature.LookupListIndex:
            for st in gsub.LookupList.Lookup[li].SubTable:
                if hasattr(st, "mapping"):
                    targets.update(st.mapping.values())
    if not targets:
        print("  TNUM EMPTY %s" % label)
        return False
    ref = TTFont(str(refs[0][0]))
    ref_glyphs = ref.getGlyphSet()
    errors = 0
    for name in sorted(targets):
        if name not in ref_glyphs:
            continue  # pruned upstream too; tnum rule was dropped with it
        dd = outline_delta(outlines(out, name), outlines(ref, name))
        if dd is None or dd > tol:
            errors += 1
    if errors:
        print("  TNUM MISMATCH %s: %d glyphs" % (label, errors))
        return False
    print("  tnum ok %s (%d targets)" % (label, len(targets)))
    return True


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    used = scan_content()
    used_cps = {ord(c) for c in used if ord(c) >= 0x20}
    (ROOT / "tools" / "fonts" / "charset-used.txt").write_text(
        "".join(chr(c) for c in sorted(used_cps)), encoding="utf-8")
    print("used chars: %d" % len(used_cps))

    css_blocks = []
    manifest = {}
    ok = True
    import unicodedata
    symbols = {c for c in used_cps
               if unicodedata.category(chr(c))[0] in ("S", "P")}
    print("used symbols in core set: %s" %
          " ".join("U+%04X" % c for c in sorted(symbols)))
    core_base = CORE | symbols

    for key, family, style, weights, stem, build, instances in FACES:
        print("=" * 20, key)
        base, served = build_base(build)
        refs = None
        if served is None:
            served = load_coverage(key)
            refs = []
            for slice_name in ("latin", "latinext"):
                p = SRC / ("gt-%s-%s.woff2" % (key, slice_name))
                refs.append((p, set(TTFont(str(p)).getBestCmap())))
        else:
            refs = [(None, served)]  # resolved to merged base below
        missing_ascii = [c for c in range(0x20, 0x7F) if c not in served]
        assert not missing_ascii, "ASCII missing from %s source" % key
        keep = (used_cps | LATIN1 | EXT_A) & served
        core = core_base & served
        ext = keep - core
        assert not (core & ext)
        dropped = (used_cps | LATIN1 | EXT_A) - served
        cjk = {c for c in dropped if c >= 0x2E00}
        other = sorted(dropped - cjk)
        print("  keep=%d core=%d ext=%d dropped=%d (%d CJK/unassigned)" %
              (len(keep), len(core), len(ext), len(dropped), len(cjk)))
        if other:
            print("   dropped non-CJK: %s" %
                  " ".join("U+%04X" % c for c in other))

        outs = {}
        feats = KEEP_FEATURES_INTER if key == "inter" else KEEP_FEATURES
        for split, cps in (("core", core), ("ext", ext)):
            name = "%s-%s.woff2" % (stem, split)
            out = subset_to(base, cps, OUT / name, feats)
            got = set(out.getBestCmap())
            if got != cps:
                print("  CMAP DRIFT %s: missing=%s extra=%s" % (
                    name,
                    sorted("U+%04X" % c for c in cps - got)[:8],
                    sorted("U+%04X" % c for c in got - cps)[:8]))
                ok = False
            if "gasp" not in out:
                print("  GASP LOST %s" % name)
                ok = False
            if out["post"].formatType != 2.0:
                print("  POST NOT 2.0 %s" % name)
                ok = False
            gs = feature_tags(out, "GSUB")
            gp = feature_tags(out, "GPOS")
            bad = (set(gs) | set(gp)) - set(feats)
            if bad:
                print("  UNEXPECTED FEATURES %s: %s" % (name, sorted(bad)))
                ok = False
            fam = out["name"].getDebugName(1)
            if fam != family and not (
                    family == "Spectral" and fam and
                    fam.startswith("Spectral")):
                print("  FAMILY RENAMED %s: %s" % (name, fam))
                ok = False
            print("  %s: %d bytes, %d glyphs, gsub=%s gpos=%s" % (
                name, (OUT / name).stat().st_size,
                out["maxp"].numGlyphs, gs, gp))
            face_refs = refs
            if face_refs[0][0] is None:
                # Spectral: the merged base is itself built from the
                # served slices, so it is the ground truth.
                tmp = OUT / ("_%s-tmp.ttf" % stem)
                base.save(str(tmp))
                face_refs = [(tmp, served)]
            if not check_instances(OUT / name, face_refs, instances, name):
                ok = False
            if key == "inter" and split == "core":
                if not check_tnum(OUT / name, face_refs, name):
                    ok = False
            for tmp in OUT.glob("_*-tmp.ttf"):
                tmp.unlink()
            outs[split] = css_unicode_range(got)
            manifest[name] = {
                "bytes": (OUT / name).stat().st_size,
                "glyphs": out["maxp"].numGlyphs,
                "gsub": gs,
                "gpos": gp,
                "unicode_range": outs[split],
            }

        for w in weights:
            for split, fname in (("core", "%s-core.woff2" % stem),
                                 ("ext", "%s-ext.woff2" % stem)):
                css_blocks.append(
                    "@font-face {\n"
                    "  font-family: '%s';\n"
                    "  font-style: %s;\n"
                    "  font-weight: %d;\n"
                    "  font-display: swap;\n"
                    "  src: url('/assets/fonts/%s') format('woff2');\n"
                    "  unicode-range: %s;\n"
                    "}" % (family, style, w, fname, outs[split]))

    (OUT / "fonts.css").write_text(
        "/* Generated by tools/fonts/subset_fonts.py -- do not edit. */\n"
        + "\n\n".join(css_blocks) + "\n",
        encoding="utf-8")
    (ROOT / "tools" / "fonts" / "manifest.json").write_text(
        json.dumps(manifest, indent=1), encoding="utf-8")
    total = sum(m["bytes"] for m in manifest.values())
    print("TOTAL: %d bytes in %d files" % (total, len(manifest)))
    if not ok:
        print("SELF-CHECKS FAILED")
        sys.exit(1)
    print("ALL SELF-CHECKS PASSED")


if __name__ == "__main__":
    main()