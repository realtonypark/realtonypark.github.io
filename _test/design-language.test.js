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
    parentNode: null,
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
    querySelector(selector) {
      if (selector === "[data-design-menu]") {
        const found = this.children.find((child) => child.isMenu);
        return found || null;
      }
      return null;
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
  const headerActions = makeEl("div");
  headerActions.appendChild(button);
  headerActions.appendChild(menu);
  button.parentNode = headerActions;

  // A second trigger lives in the post date line, with its own menu.
  const button2 = makeEl("button");
  const menu2 = makeEl("div");
  menu2.isMenu = true;
  menu2.setAttribute("hidden", "");
  const postDesign = makeEl("span");
  postDesign.appendChild(button2);
  postDesign.appendChild(menu2);
  button2.parentNode = postDesign;

  const document = {
    readyState: "loading",
    documentElement: { dataset },
    addEventListener(type, handler) {
      documentEvents[type] = handler;
    },
    querySelectorAll(selector) {
      if (selector === "[data-design-toggle]") return [button, button2];
      return [];
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
  return { button, menu, button2, menu2, documentEvents, dataset, values };
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

test("every Aa trigger opens its own menu and stays in sync", () => {
  const state = bootController();
  const { button, menu, button2, menu2 } = state;

  button2.events.click({});
  assert.equal(button2.getAttribute("aria-expanded"), "true");
  assert.equal(menu2.getAttribute("hidden"), null);
  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.notEqual(menu.getAttribute("hidden"), null);

  menu2.events.click({ target: menuItem(menu2, "modern") });
  assert.equal(state.dataset.design, "modern");
  assert.match(button.getAttribute("aria-label"), /Modern/);
  assert.match(button2.getAttribute("aria-label"), /Modern/);
  assert.equal(menuItem(menu, "modern").getAttribute("aria-checked"), "true");
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
