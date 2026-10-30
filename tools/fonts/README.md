# Webfont subsetting

The site self-hosts subsetted Inter, Fraunces, and Spectral instead of
loading the full families from Google Fonts. Nothing here runs during
`jekyll build`; the checked-in files under `assets/fonts/` are the build
input.

## Rerun

```sh
python3 tools/fonts/subset_fonts.py
```

then commit `assets/fonts/` and `tools/fonts/` (the charset record and
manifest change when coverage changes).

Requires: `fonttools`, `brotli` (`pip install fonttools brotli`) and
`woff2_compress` (`brew install woff2`). The script fails loudly if any
self-check fails; do not commit its output in that case.

## When to rerun

- After adding or editing content with characters outside the current
  coverage. The script rescans `_posts`, `_data` (all Jekyll data
  formats: yml, yaml, json, csv, tsv), `_drafts`, `_includes`,
  `_layouts`, top-level pages, `_config.yml`, and `assets/main.scss`
  on every run, so rerunning after a content change is enough;
  `git diff tools/fonts/charset-used.txt` shows what newly appeared.
  Rule of thumb: rerun when a post adds non-ASCII characters (accented
  names, symbols, new punctuation) or when you touch anything that
  renders text (includes, layouts, footer, navigation).
- After changing which font weights or styles the CSS needs. The kept
  faces are fixed in the `FACES` table in `subset_fonts.py` (Inter
  400/500/600, Fraunces 300/400, Spectral 400/500/600/700 + italics
  400/500). For a variable family (Inter, Fraunces), extend the
  weights tuple on its one entry. For a static family (Spectral),
  each weight is a separate entry with its own pinned source
  slices: adding a weight means downloading its latin + latin-ext
  slices into `sources/` (same css2 lineage as the others) and
  adding a new `FACES` entry. Never add a weight to a static
  entry's tuple: that only relabels the existing file, emitting a
  `@font-face` that points the new weight at the old weight's
  outlines.
- After changing font families. That means new sources (see below) plus
  a `FACES` entry.

You do not need to rerun for ASCII-only content changes, CSS changes
that keep the same weights, or new pages using the existing styles.

## Sources

`sources/` holds the pinned inputs so reruns are deterministic:

- `Inter.ttf`, `Fraunces.ttf`: full upstream variable fonts from the
  google/fonts repo. Verified outline-identical to what Google Fonts
  serves (Inter exactly; Fraunces within 0.21 units on `!` and `_`,
  far below rasterizer precision) before subsetting from them.
- `spectral-*.woff2`: Google's latin and latin-ext slices, merged per
  face (fontTools cannot merge variable fonts, which is why Inter and
  Fraunces come from upstream instead).
- `gt-inter-*.woff2`, `gt-fraunces-*.woff2`: the served slices used as
  ground truth. Every generated file is instantiated at every used
  weight and compared glyph-by-glyph against these.
- `coverage-inter.txt`, `coverage-fraunces.txt` (in `tools/fonts/`,
  next to this file): the served character sets. Anything outside
  them (CJK, emoji, arrows, ...) renders in fallback fonts today,
  so the subsets exclude it too.

## What the outputs are

`assets/fonts/` holds 16 `.woff2` files plus `fonts.css` (22
`@font-face` blocks, one per weight and split). Each family ships two
splits sharing the same faces:

- `*-core.woff2`: ASCII plus the punctuation and symbols pages use
  (curly quotes, dashes, ellipsis, bullet, `·×‹›↑₿`). Preloaded for
  Inter (the default body's family); the other cores load from CSS.
- `*-ext.woff2`: Latin-1 and Latin Extended-A plus any other kept
  characters, behind a `unicode-range` so browsers fetch it only when
  a page needs one of its characters. Only 2 of 34 audited pages
  fetch it today (inter-ext on ai-governance in all modes and on
  the home page in quiet mode, for `ħ` U+0127 and `ø` U+00F8);
  every other page loads core files only.

Every `unicode-range` is derived from the actual output file's cmap,
so a range never claims a character the file lacks. `font-display:
swap` and all fallback stacks are unchanged from the Google Fonts
setup. None of the three families declares a Reserved Font Name, so
the internal family names are kept as-is.

## What was dropped, and why rendering is identical

- OpenType features: kept only `calt ccmp kern liga locl mark
  mkmk rvrn` (`KEEP_FEATURES` in the script) plus `tnum` for
  Inter only. Everything else (`frac`, `dnom`, `numr`, `pnum`,
  ...) is off by default and unused by author and browser UA
  stylesheets, so it is dropped. `tnum` matters because the
  browser styles list markers with `font-variant-numeric:
  tabular-nums`; dropping it shifted markers 2px. Spectral's
  `tnum` only affects `.LP` suffixed glyphs the subsets do not
  keep (no-op), and Fraunces has no `tnum`. The per-file
  `manifest.json` records the features each output actually
  kept; the script fails if any output keeps a feature outside
  the allowlist.
- Hinting: dropped (Google's slices ship unhinted TrueType
  outlines; `gasp` is kept identical).
- Variable axes: Inter and Fraunces keep pinned defaults
  (opsz 14, SOFT 0, WONK 1) with `avar` untouched; no weight
  limiting, since re-normalizing the axis warped outlines.
- `post` keeps format 2.0 with glyph names (matching Google),
  because CoreText rasterizes format 3.0 differently.
- Hyphens: the CSS never sets `hyphens: auto`, so nothing
  inserts U+2010 and the subsets exclude it.

## Determinism

Reruns are byte-identical for Inter and Fraunces (the script
pins `head.modified`/`created` to the upstream sources). The
Spectral static merge rewrites table bytes cosmetically on
each run (identical cmap, outlines, and features; verified by
the self-checks, not by md5). If a rerun changes only
Spectral file hashes with no charset change (`git diff
tools/fonts/charset-used.txt` empty), the new bytes render
identically and are safe to commit or discard.

`charset-used.txt` reflects the working tree, including uncommitted
files and `_drafts` (Jekyll renders on-disk files, and local
`--drafts` previews use these same committed fonts). The scan
deliberately excludes everything Jekyll never publishes: `_site`
(gitignored build output; reading it would bake one machine's
stale build into the inputs), `_research`/`_syllabi` and the
top-level AGENTS/CLAUDE/README/SEO-AUDIT docs (all in
`_config.yml`'s build `exclude:` list). If you ever lift one of
those exclusions, add the directory back to `SCAN_DIRS` and rerun.
`feed.xml`/`sitemap.xml` are not scanned either (feed readers use
system fonts, and feed text duplicates `_posts`).
