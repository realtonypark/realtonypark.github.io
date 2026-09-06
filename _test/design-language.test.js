const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const controllerPath = path.join(
  __dirname,
  "..",
  "_includes",
  "design-language.js",
);

function bootController(initialValue, options = {}) {
  const documentEvents = {};
  const buttonEvents = {};
  const attributes = {};
  const dataset = {};
  const values = new Map();

  if (initialValue !== undefined)
    values.set("tony-design-language", initialValue);

  const button = {
    addEventListener(type, handler) {
      buttonEvents[type] = handler;
    },
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
  };
  const document = {
    readyState: "loading",
    documentElement: { dataset },
    addEventListener(type, handler) {
      documentEvents[type] = handler;
    },
    querySelector(selector) {
      return selector === "[data-design-toggle]" ? button : null;
    },
  };
  const localStorage = {
    getItem(key) {
      if (options.storageThrows) throw new Error("storage unavailable");
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (options.storageThrows) throw new Error("storage unavailable");
      values.set(key, String(value));
    },
    removeItem(key) {
      if (options.storageThrows) throw new Error("storage unavailable");
      values.delete(key);
    },
  };

  vm.runInNewContext(fs.readFileSync(controllerPath, "utf8"), {
    document,
    localStorage,
  });
  if (documentEvents.DOMContentLoaded) documentEvents.DOMContentLoaded();
  return { attributes, buttonEvents, dataset, values };
}

test("restores either persisted legacy design", () => {
  assert.equal(bootController("classic").dataset.design, "classic");
  assert.equal(bootController("modern").dataset.design, "modern");
  assert.equal(bootController("unknown").dataset.design, undefined);
});

test("cycles default, classic, and modern while persisting non-default modes", () => {
  const state = bootController();

  assert.equal(state.dataset.design, undefined);
  assert.match(state.attributes["aria-label"], /Thinking Machines/);
  assert.equal(state.attributes["aria-pressed"], "false");

  state.buttonEvents.click();
  assert.equal(state.dataset.design, "classic");
  assert.equal(state.attributes["aria-pressed"], "mixed");
  assert.equal(state.values.get("tony-design-language"), "classic");

  state.buttonEvents.click();
  assert.equal(state.dataset.design, "modern");
  assert.equal(state.values.get("tony-design-language"), "modern");
  assert.equal(state.attributes["aria-pressed"], "true");

  state.buttonEvents.click();
  assert.equal(state.dataset.design, undefined);
  assert.equal(state.attributes["aria-pressed"], "false");
  assert.equal(state.values.has("tony-design-language"), false);
});

test("still cycles when browser storage is unavailable", () => {
  const state = bootController(undefined, { storageThrows: true });
  assert.doesNotThrow(() => state.buttonEvents.click());
  assert.equal(state.dataset.design, "classic");
});
