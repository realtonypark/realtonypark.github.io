const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("new theme is second under quiet and ships hidden intro markup", () => {
  const controller = read("_includes/design-language.js");
  assert.match(
    controller,
    /var designs = \["quiet", "new", "", "classic", "modern"\];/,
  );
  assert.match(
    controller,
    /var labels = \["Quiet", "New", "Soft Classic", "Classic", "Modern"\];/,
  );

  const index = read("index.md");
  assert.match(index, /\{% include new-intro\.html %\}/);

  const intro = read("_includes/new-intro.html");
  assert.match(intro, /<section class="new-intro" hidden>/);
  for (const key of [
    "tars",
    "bitcoin",
    "nupython",
    "ai",
    "moneyball",
    "vertigo",
    "social",
    "basterds",
    "season",
  ]) {
    assert.match(intro, new RegExp(`data-key="${key}"`));
  }
  assert.match(
    intro,
    /<a class="new-peek" id="new-peek"[^>]*aria-hidden="true"[^>]*hidden>/,
  );
  assert.match(intro, /\{%- include new-theme\.js -%\}/);
});

test("new theme styles paper, serif, cards, and fog", () => {
  const styles = read("assets/main.scss");
  assert.match(styles, /html\[data-design='new'\] \{\s*--bg: #ebf0eb;/);
  assert.match(styles, /color-scheme: light;/);
  assert.match(styles, /font-family: 'Newsreader', 'Iowan Old Style'/);
  assert.match(styles, /\.new-peek \{[\s\S]*?position: fixed;/);
  assert.match(styles, /\.new-peek\.np-compact \{[\s\S]*?width: max-content;/);
  assert.match(
    styles,
    /body::after \{[\s\S]*?url\('\/assets\/new-theme\/fog-1800\.jpg'\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\) \{\s*html\[data-design='new'\]/,
  );

  const fonts = read("assets/fonts/fonts.css");
  assert.match(fonts, /font-family: 'Newsreader';/);
  assert.match(fonts, /font-family: 'IBM Plex Sans Condensed';/);

  for (const asset of [
    "assets/new-theme/fog-1800.jpg",
    "assets/new-theme/bitcoin-960.png",
    "assets/new-theme/nupython-960.png",
    "assets/posts/ai-aesthetic/wafer-inspiration.jpg",
    "assets/posts/vertigo.webp",
    "assets/astronaut.webp",
  ]) {
    assert.ok(
      fs.existsSync(path.join(root, asset)),
      `${asset} ships with the theme`,
    );
  }
});
