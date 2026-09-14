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

function makeEl(tag) {
  const el = {
    tagName: tag,
    children: [],
    attributes: {},
    events: {},
    classes: new Set(),
    type: "",
    className: "",
    textContent: "",
    parent: null,
    isMenu: false,
    focused: false,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    addEventListener(type, handler) {
      this.events[type] = handler;
    },
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    },
    contains(node) {
      let current = node;
      while (current) {
        if (current === this) return true;
        current = current.parent;
      }
      return false;
    },
    closest(selector) {
      let current = this;
      while (current) {
        if (
          selector === "[data-design-value]" &&
          current.attributes["data-design-value"] !== undefined
        )
          return current;
        if (selector === "[data-design-menu]" && current.isMenu) return current;
        current = current.parent;
      }
      return null;
    },
    focus() {
      this.focused = true;
    },
  };
  el.classList = {
    toggle(name, force) {
      if (force) el.classes.add(name);
      else el.classes.delete(name);
    },
  };
  return el;
}

function bootController(initialValue, options = {}) {
  const documentEvents = {};
  const dataset = {};
  const values = new Map();

  if (initialValue !== undefined)
    values.set("tony-design-language", initialValue);

  const button = makeEl("button");
  const menu = makeEl("div");
  menu.isMenu = true;
  menu.setAttribute("hidden", "");

  const document = {
    readyState: "loading",
    documentElement: { dataset },
    addEventListener(type, handler) {
      documentEvents[type] = handler;
    },
    querySelector(selector) {
      if (selector === "[data-design-toggle]") return button;
      if (selector === "[data-design-menu]") return menu;
      return null;
    },
    createElement(tag) {
      return makeEl(tag);
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
  return { button, menu, documentEvents, dataset, values };
}

function menuItem(menu, design) {
  return menu.children.find(
    (item) => item.getAttribute("data-design-value") === design,
  );
}

test("restores the persisted design, defaulting to quiet", () => {
  assert.equal(bootController("quiet").dataset.design, "quiet");
  assert.equal(bootController("classic").dataset.design, "classic");
  assert.equal(bootController("modern").dataset.design, "modern");
  assert.equal(bootController("").dataset.design, undefined);
  assert.equal(bootController("unknown").dataset.design, "quiet");
  assert.equal(bootController().dataset.design, "quiet");
});

test("quiet is first; the menu applies the chosen design and persists it", () => {
  const state = bootController();
  const { button, menu } = state;

  assert.equal(state.dataset.design, "quiet");
  assert.match(button.getAttribute("aria-label"), /Quiet/);
  assert.equal(menu.children.length, 4);
  assert.equal(menu.children[0].getAttribute("data-design-value"), "quiet");

  button.events.click({});
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(menu.getAttribute("hidden"), null);

  menu.events.click({ target: menuItem(menu, "classic") });
  assert.equal(state.dataset.design, "classic");
  assert.equal(state.values.get("tony-design-language"), "classic");
  assert.equal(menuItem(menu, "classic").getAttribute("aria-checked"), "true");
  assert.equal(menuItem(menu, "quiet").getAttribute("aria-checked"), "false");
  assert.match(button.getAttribute("aria-label"), /Design style: Classic\./);
  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.notEqual(menu.getAttribute("hidden"), null);

  button.events.click({});
  menu.events.click({ target: menuItem(menu, "") });
  assert.equal(state.dataset.design, undefined);
  assert.equal(state.values.get("tony-design-language"), "");
  assert.match(button.getAttribute("aria-label"), /Soft Classic/);

  button.events.click({});
  menu.events.click({ target: menuItem(menu, "quiet") });
  assert.equal(state.dataset.design, "quiet");
  assert.equal(state.values.has("tony-design-language"), false);
});

test("outside click and Escape dismiss the menu", () => {
  const state = bootController();
  const { button, menu, documentEvents } = state;

  button.events.click({});
  assert.equal(button.getAttribute("aria-expanded"), "true");

  documentEvents.click({ target: makeEl("p") });
  assert.equal(button.getAttribute("aria-expanded"), "false");

  button.events.click({});
  documentEvents.keydown({ key: "Escape" });
  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.equal(button.focused, true);
});

test("still applies the chosen design when browser storage is unavailable", () => {
  const state = bootController(undefined, { storageThrows: true });
  const { button, menu } = state;
  assert.equal(state.dataset.design, "quiet");
  button.events.click({});
  assert.doesNotThrow(() =>
    menu.events.click({ target: menuItem(menu, "modern") }),
  );
  assert.equal(state.dataset.design, "modern");
});
