const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const layout = fs.readFileSync(
  path.join(root, "_layouts", "posts.html"),
  "utf8",
);
const styles = fs.readFileSync(path.join(root, "assets", "main.scss"), "utf8");
const head = fs.readFileSync(
  path.join(root, "_includes", "head.html"),
  "utf8",
);
const about = fs.readFileSync(path.join(root, "about.md"), "utf8");

test("Soft Classic post list is scoped to the default design", () => {
  assert.match(layout, /class="post-meta post-list-date"/);
  assert.match(layout, /class="post-meta post-tags"/);
  assert.match(layout, /class="post-excerpt"/);
  assert.match(
    styles,
    /html:not\(\[data-design\]\)[\s\S]*?\.post-excerpt \{ display: none; \}/,
  );
  assert.match(styles, /\$base-font-family: 'Spectral', Georgia, serif;/);
  assert.match(
    styles,
    /\.post-link \{[\s\S]*?font-size: 17px;[\s\S]*?font-weight: 500;[\s\S]*?html:not\(\[data-design\]\)[\s\S]*?\.post-link \{ font-size: 18\.57px; \}/,
  );
  assert.match(styles, /html\[data-design='classic'\][\s\S]*?--bg: #faf9f5;/);
  assert.match(
    styles,
    /@media \(prefers-color-scheme: dark\) \{\s*:root \{[\s\S]*?\}\s*html\[data-design='classic'\] \{\s*--bg: #181511;/,
  );
  assert.match(styles, /\.post-item \{[\s\S]*?padding: 17\.28px 0;/);
  assert.match(
    styles,
    /\.post-link \{ font-size: 18\.57px; \}[\s\S]*?\.post-list-date \{[\s\S]*?font-size: 17\.64px;/,
  );
  assert.match(styles, /column-gap: 24px;\s*row-gap: 0;/);
  assert.match(
    styles,
    /\.post-tags \{\s*grid-area: 2 \/ 2;\s*margin-top: -4px;/,
  );
  assert.match(
    styles,
    /html\[data-design='classic'\] \.post-link \{[\s\S]*?font-weight: 600;/,
  );
  assert.match(
    styles,
    /html\[data-design='modern'\][\s\S]*?\.post-link \{[\s\S]*?font-size: 26px;[\s\S]*?font-weight: 400;/,
  );
  assert.match(
    styles,
    /html:not\(\[data-design\]\) body\.is-post main\.page-content::before \{\s*display: none;/,
  );
  assert.doesNotMatch(
    styles,
    /html\[data-design='classic'\] body\.is-post main\.page-content::before \{\s*display: none;/,
  );
  // The masthead band uses z-index: -1. body.is-post must stay a stacking
  // context (via isolation, not transform) or the band drops behind the
  // opaque body background once the page-fade animation ends.
  assert.match(styles, /body\.is-post \{\s*[^}]*isolation: isolate;/);
  // Phase 1: modern inherits the default/classic nav wholesale — none of the
  // old modern header overrides (sticky bar, centered nav, underline-bar,
  // mobile nav repositioning) may remain.
  assert.doesNotMatch(styles, /\.site-nav \{\s*position: absolute;\s*left: 50%;/);
  assert.doesNotMatch(styles, /bottom: -34px;/);
  assert.doesNotMatch(styles, /min-height: 88px;/);
  assert.doesNotMatch(styles, /\.curr-page-link::after/);
  assert.doesNotMatch(styles, /\.site-nav label\[for='nav-trigger'\]/);
});

test("modern theme follows the reference design language", () => {
  assert.match(head, /family=Fraunces:/);
  assert.match(styles, /html\[data-design='modern'\] \{\s*--bg: #fcfcfc;/);
  assert.match(
    styles,
    /@media \(prefers-color-scheme: dark\) \{\s*html\[data-design='modern'\] \{\s*--bg: #131313;/,
  );
  assert.match(styles, /\.post-title,[\s\S]*?font-family: 'Fraunces'/);
  assert.match(
    styles,
    /\.site-nav \.page-link,[\s\S]*?\.curr-page-link \{[\s\S]*?font-family: 'Inter'/,
  );
  assert.match(styles, /\.highlight \.k,[\s\S]*?color: #007bb4;/);
  assert.match(
    styles,
    /\.site-nav \.page-link,[\s\S]*?\.curr-page-link \{[\s\S]*?font-size: 17px;/,
  );
  // The 80px title offset exists only for classic's masthead band — default
  // has no band and no gap.
  assert.match(styles, /body\.is-post \{[^}]*--post-offset: 0;/);
  assert.match(
    styles,
    /html\[data-design='classic'\] body\.is-post \{\s*--post-offset: 80px;/,
  );
});

test("about featured posts use build-time links", () => {
  // Raw `_posts/*.md` targets only resolve via jekyll-relative-links (a
  // GitHub Pages default, absent locally), producing /about/_posts/… 404s.
  // {% link %} is Jekyll core and fails the build if a target is missing.
  assert.doesNotMatch(about, /\]\(_posts\//);
  assert.match(about, /\{% link _posts\/2026-02-02-building-python-interpreter-in-c\.md %\}/);
});

test("quiet design shows the single-index markup and nothing else does", () => {
  const index = fs.readFileSync(path.join(root, "index.md"), "utf8");
  const footer = fs.readFileSync(
    path.join(root, "_includes", "footer.html"),
    "utf8",
  );
  const home = fs.readFileSync(
    path.join(root, "_includes", "single-index.html"),
    "utf8",
  );
  const header = fs.readFileSync(
    path.join(root, "_includes", "header.html"),
    "utf8",
  );
  // Single-index markup ships hidden; only the designs that use it display it.
  assert.match(index, /\{% include single-index\.html %\}/);
  assert.match(home, /<section class="single-index" hidden>/);
  assert.match(home, /moneyball-ai\.webp/);
  assert.match(layout, /<span class="si-year" hidden>/);
  assert.match(layout, /data-short="\{\{ post\.date \| date: '%b %-d' \}\}"/);
  // The Evanston clock footer is gone; quiet keeps only the hairline rule.
  assert.doesNotMatch(footer, /si-clock/);
  assert.match(styles, /\.nd-footer \{ display: none; \}/);
  assert.match(styles, /html\[data-design='quiet'\] \{\s*--bg: #fdfdfc;/);
  assert.match(styles, /html\[data-design='quiet'\][\s\S]*?\.single-index \{\s*display: block;/);
  assert.match(styles, /html\[data-design='quiet'\][\s\S]*?\.site-nav \{ display: none; \}/);
  // One "Aa" button opens the theme list everywhere; the active TOC entry
  // carries its dot in a reserved gutter so the text never shifts.
  assert.match(header, /data-design-toggle/);
  assert.match(header, /aria-haspopup="menu"/);
  assert.match(header, /<div class="design-menu" data-design-menu hidden/);
  assert.match(styles, /\.design-menu \{[\s\S]*?position: absolute;/);
  assert.match(styles, /\.design-menu-item\.is-selected \.design-menu-check/);
  assert.doesNotMatch(styles, /design-toggle-thumb/);
  assert.match(styles, /content: '•';[\s\S]*?position: absolute;/);
});
