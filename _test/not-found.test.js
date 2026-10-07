const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const page = fs.readFileSync(path.join(root, "404.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "main.scss"), "utf8");
const carousel = fs.readFileSync(
  path.join(root, "_includes", "ai-carousel.js"),
  "utf8",
);

test("404 headline links an underlined Home to the index", () => {
  assert.match(page, /You're drunk! Go <a class="not-found-home" href="\{\{ '\/' \| relative_url \}\}">Home<\/a>/);
  assert.match(
    styles,
    /\.not-found-home \{[\s\S]*?text-decoration: underline;/,
  );
});

test("404 drops the browse-all-posts and find-a-topic links", () => {
  assert.doesNotMatch(page, /Browse all posts/);
  assert.doesNotMatch(page, /find a topic/);
  assert.doesNotMatch(page, /posts-by-tag/);
});

test("404 compare frame ships both red-panda pairs with drag affordance", () => {
  assert.match(page, /<figure class="ai-compare ai-compare-wide ai-compare-flat not-found-photo"[^>]*data-ai-pairs/);
  assert.match(page, /data-before-1="\{\{ '\/assets\/404-image-1\.webp' \| relative_url \}\}"/);
  assert.match(page, /data-after-1="\{\{ '\/assets\/404-image-1-ai\.webp' \| relative_url \}\}"/);
  assert.match(page, /data-before-2="\{\{ '\/assets\/404-image-2\.webp' \| relative_url \}\}"/);
  assert.match(page, /data-after-2="\{\{ '\/assets\/404-image-2-ai\.webp' \| relative_url \}\}"/);
  assert.match(page, /<span class="ai-knob" aria-hidden="true">‹ ›<\/span>/);
});

test("404 compare frame defaults to pair 1 without JS", () => {
  assert.match(page, /<img class="ai-after" src="\{\{ '\/assets\/404-image-1-ai\.webp' \| relative_url \}\}"/);
  assert.match(page, /<img class="ai-before" src="\{\{ '\/assets\/404-image-1\.webp' \| relative_url \}\}"/);
});

test("404 picks pair 1 on even minutes and pair 2 on odd minutes", () => {
  assert.match(
    carousel,
    /querySelectorAll\('\.ai-compare\[data-ai-pairs\]'\)/,
  );
  assert.match(carousel, /new Date\(\)\.getMinutes\(\) % 2 === 0 \? '1' : '2'/);
});

test("404 caption links AI-tuned to the steal-the-aesthetic post", () => {
  assert.match(
    page,
    /<p class="not-found-caption">Napping red panda · <a href="\{% link _posts\/2026-09-07-clone-aesthetic-image-online\.md %\}">AI-tuned<\/a><\/p>/,
  );
});

function webpSize(file) {
  const buf = fs.readFileSync(file);
  assert.equal(buf.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buf.subarray(8, 12).toString("ascii"), "WEBP");
  let off = 12;
  while (off + 8 <= buf.length) {
    const fourcc = buf.subarray(off, off + 4).toString("ascii");
    const size = buf.readUInt32LE(off + 4);
    if (fourcc === "VP8 ") {
      const data = off + 8;
      assert.deepEqual(
        [buf[data + 3], buf[data + 4], buf[data + 5]],
        [0x9d, 0x01, 0x2a],
      );
      return {
        width: buf.readUInt16LE(data + 6) & 0x3fff,
        height: buf.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error(`${file}: no lossy VP8 chunk (extend webpSize for VP8L/VP8X)`);
}

test("404 pair 1 before/after share dimensions so the wipe aligns", () => {
  const before = webpSize(path.join(root, "assets", "404-image-1.webp"));
  const after = webpSize(path.join(root, "assets", "404-image-1-ai.webp"));
  assert.deepEqual(after, before);
});

test("404 assets are real WebP pairs", () => {
  for (const name of [
    "404-image-1.webp",
    "404-image-1-ai.webp",
    "404-image-2.webp",
    "404-image-2-ai.webp",
  ]) {
    const buf = fs.readFileSync(path.join(root, "assets", name));
    assert.equal(buf.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(buf.subarray(8, 12).toString("ascii"), "WEBP");
  }
});
