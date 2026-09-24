const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const workerPromise = import("../worker/index.mjs").then(({ default: worker }) => worker);

test("redirects www and HTTP requests to the HTTPS apex while preserving paths and queries", async () => {
  const worker = await workerPromise;
  for (const url of [
    "https://www.tonypark.dev/2026/09/24/article/?ref=old",
    "http://tonypark.dev/2026/09/24/article/?ref=old",
  ]) {
    const response = await worker.fetch(new Request(url), { ASSETS: {} });
    assert.equal(response.status, 301);
    assert.equal(
      response.headers.get("location"),
      "https://tonypark.dev/2026/09/24/article/?ref=old",
    );
  }
});

test("serves HTTPS apex requests from static assets", async () => {
  const worker = await workerPromise;
  const request = new Request("https://tonypark.dev/about/");
  const assetResponse = new Response("about page");
  const response = await worker.fetch(request, {
    ASSETS: { fetch: (assetRequest) => {
      assert.equal(assetRequest.url, request.url);
      return assetResponse;
    } },
  });
  assert.equal(response, assetResponse);
});

test("keeps the GitHub Pages alias pointed at matching new-domain URLs", () => {
  const head = readFileSync("_includes/head.html", "utf8");
  assert.match(head, /location\.hostname === 'realtonypark\.github\.io'/);
  assert.match(head, /location\.replace\('https:\/\/tonypark\.dev' \+ location\.pathname \+ location\.search \+ location\.hash\)/);
});
