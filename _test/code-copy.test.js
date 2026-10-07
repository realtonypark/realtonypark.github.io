const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const scss = fs.readFileSync(
  path.join(root, "assets", "main.scss"),
  "utf8",
).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
// Compile with the site's locked Sass compiler, including its import paths.
const styles = execFileSync(
  "bundle",
  [
    "exec",
    "ruby",
    "-e",
    `require 'sass'
STDIN.set_encoding('UTF-8')
puts Sass::Engine.new(
  STDIN.read,
  syntax: :scss,
  style: :expanded,
  load_paths: [
    File.join(Dir.pwd, '_sass'),
    File.join(Gem::Specification.find_by_name('minima').full_gem_path, '_sass')
  ]
).render`,
  ],
  {
    cwd: root,
    input: scss,
    encoding: "utf8",
    env: { ...process.env, BUNDLE_FROZEN: "true" },
  },
);
const controller = fs.readFileSync(
  path.join(root, "_includes", "code-copy.js"),
  "utf8",
);
const layout = fs.readFileSync(
  path.join(root, "_layouts", "default.html"),
  "utf8",
);

function makeEl(tag) {
  let text = "";
  const el = {
    tagName: tag,
    children: [],
    attributes: {},
    events: {},
    classes: new Set(),
    type: "",
    className: "",
    get textContent() {
      return text + this.children.map((child) => child.textContent).join("");
    },
    set textContent(value) {
      text = String(value);
      this.children.forEach((child) => {
        child.parent = null;
      });
      this.children = [];
    },
    innerHTML: "",
    parent: null,
    style: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    },
    addEventListener(type, handler) {
      this.events[type] = handler;
    },
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter((c) => c !== child);
    },
    querySelector(selector) {
      if (selector === "pre code" || selector === "pre") {
        const found = [];
        const walk = (node) => {
          node.children.forEach((child) => {
            if (
              (selector === "pre code" && child.tagName === "CODE") ||
              (selector === "pre" && child.tagName === "PRE")
            )
              found.push(child);
            walk(child);
          });
        };
        walk(this);
        return found[0] || null;
      }
      return null;
    },
    closest(selector) {
      let current = this;
      while (current) {
        if (
          selector === "div.highlighter-rouge" &&
          current.tagName === "DIV" &&
          current.classes.has("highlighter-rouge")
        )
          return current;
        if (
          selector === ".ai-codefold" &&
          current.classes.has("ai-codefold")
        )
          return current;
        current = current.parent;
      }
      return null;
    },
    select() {},
  };
  el.classList = {
    add(name) {
      el.classes.add(name);
    },
    remove(name) {
      el.classes.delete(name);
    },
  };
  return el;
}

function bootController(blocks, options = {}) {
  const documentEvents = {};
  const created = [];
  const document = {
    readyState: "loading",
    body: makeEl("BODY"),
    addEventListener(type, handler) {
      documentEvents[type] = handler;
    },
    querySelectorAll(selector) {
      assert.equal(selector, "div.highlighter-rouge, pre");
      return blocks;
    },
    createElement(tag) {
      const el = makeEl(tag.toUpperCase());
      created.push(el);
      return el;
    },
    execCommand(cmd) {
      assert.equal(cmd, "copy");
      return options.execResult !== undefined ? options.execResult : true;
    },
  };
  const sandbox = { document, navigator: options.navigator || {} };
  if (options.timers !== false) {
    sandbox.setTimeout = (fn) => 0;
    sandbox.clearTimeout = () => {};
  }
  vm.runInNewContext(controller, sandbox);
  documentEvents.DOMContentLoaded();
  return { document, created };
}

function rougeBlock(text) {
  const div = makeEl("DIV");
  div.classes.add("highlighter-rouge");
  const inner = makeEl("DIV");
  const pre = makeEl("PRE");
  const code = makeEl("CODE");
  code.textContent = text;
  pre.appendChild(code);
  inner.appendChild(pre);
  div.appendChild(inner);
  return { div, pre, code };
}

test("layout loads the copy controller on every page", () => {
  assert.match(layout, /\{%- include code-copy\.js -%\}/);
});

function cssRule(selector, css = styles) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`^${escaped} \\{([^}]*)\\}`, "m"));
  assert.ok(match, `Missing exact compiled CSS rule: ${selector}`);
  return match[1];
}

test("copy button styles are global and theme-independent", () => {
  assert.match(cssRule(".has-code-copy"), /^\s*position: relative;$/m);
  const button = cssRule(".code-copy-btn");
  assert.match(button, /^\s*position: absolute;$/m);
  assert.match(button, /^\s*background: var\(--bg\);$/m);
  assert.match(button, /^\s*color: var\(--muted\);$/m);
  assert.match(button, /^\s*opacity: 0;$/m);
  assert.match(cssRule(".has-code-copy:hover .code-copy-btn"), /^\s*opacity: 1;$/m);
  assert.match(cssRule(".code-copy-btn:hover"), /^\s*color: var\(--text\);$/m);
  const focus = cssRule(".code-copy-btn:focus-visible");
  assert.match(focus, /^\s*opacity: 1;$/m);
  assert.match(focus, /^\s*outline: 2px solid var\(--accent\);$/m);
  assert.match(focus, /^\s*outline-offset: 2px;$/m);
  const copied = cssRule(".code-copy-btn.is-copied");
  assert.match(copied, /^\s*color: var\(--text\);$/m);
  assert.match(copied, /^\s*opacity: 1;$/m);
  // Touch screens have no hover — the button stays visible.
  const touch = styles.match(
    /^@media \(hover: none\) \{\n((?:[^{}]|\{[^{}]*\})*)^\}/m,
  );
  assert.ok(touch, "Missing compiled hover: none media block");
  assert.match(cssRule("  .code-copy-btn", touch[1]), /^\s*opacity: 1;$/m);
});

test("quiet code blocks get their own visible selection fill", () => {
  assert.match(
    cssRule("html[data-design='quiet'] ::selection"),
    /^\s*background: var\(--box-bg\);$/m,
  );
  const selectors = [
    "pre::selection",
    "pre *::selection",
    "code::selection",
    "code *::selection",
  ]
    .map((selector) => `html[data-design='quiet'] ${selector}`)
    .join(", ");
  assert.match(
    cssRule(selectors),
    /^\s*background: color-mix\(in srgb, var\(--text\) 22%, var\(--box-bg\)\);$/m,
  );
});

test("one button per block: rouge wrappers and bare pre blocks", () => {
  const a = rougeBlock("puts 1\n");
  const fold = makeEl("DIV");
  fold.classes.add("ai-codefold");
  const barePre = makeEl("PRE");
  const bareCode = makeEl("CODE");
  bareCode.textContent = "x = 1\n";
  barePre.appendChild(bareCode);
  fold.appendChild(barePre);

  // querySelectorAll returns document order: wrapper divs before their pre.
  const { created } = bootController([a.div, a.pre, barePre]);
  const buttons = created.filter((el) => el.tagName === "BUTTON");

  assert.equal(buttons.length, 2);
  assert.equal(a.div.classes.has("has-code-copy"), true);
  assert.equal(fold.classes.has("has-code-copy"), true);
  assert.equal(barePre.classes.has("has-code-copy"), false);
  for (const button of buttons) {
    assert.equal(button.getAttribute("aria-label"), "Copy code");
    assert.match(button.innerHTML, /<svg/);
  }
});

test("clicking copies the block text and shows Copied feedback", () => {
  const a = rougeBlock("puts 1\n");
  let written = null;
  const { created } = bootController([a.div, a.pre], {
    navigator: {
      clipboard: {
        writeText(text) {
          written = text;
          return Promise.resolve();
        },
      },
    },
  });
  const button = created.find((el) => el.tagName === "BUTTON");
  button.events.click();
  return Promise.resolve().then(() => {
    assert.equal(written, "puts 1");
    assert.equal(button.getAttribute("aria-label"), "Copied!");
    assert.equal(button.classes.has("is-copied"), true);
  });
});

test("falls back to execCommand when the clipboard API is missing", () => {
  const a = rougeBlock("x\n");
  const { document, created } = bootController([a.div, a.pre], {
    navigator: {},
  });
  const button = created.find((el) => el.tagName === "BUTTON");
  button.events.click();
  assert.equal(created.find((el) => el.tagName === "TEXTAREA").value, "x");
  assert.equal(button.getAttribute("aria-label"), "Copied!");
  assert.equal(
    document.body.children.filter((el) => el.tagName === "TEXTAREA").length,
    0,
  );
});

for (const nestedCode of [false, true]) {
  function standalonePre() {
    const pre = makeEl("PRE");
    if (nestedCode) {
      pre.textContent = "  first\n";
      const code = makeEl("CODE");
      code.textContent = "\tsecond\n\n";
      pre.appendChild(code);
    } else {
      pre.textContent = "  first\n\tsecond\n\n";
    }
    return pre;
  }

  const description = nestedCode ? "with nested CODE" : "without nested CODE";
  test(`standalone PRE ${description} copies exact text on repeated clipboard clicks`, async () => {
    const pre = standalonePre();
    const written = [];
    const { created } = bootController([pre], {
      navigator: {
        clipboard: {
          writeText(text) {
            written.push(text);
            return Promise.resolve();
          },
        },
      },
    });
    const buttons = created.filter((el) => el.tagName === "BUTTON");
    assert.equal(buttons.length, 1);
    const button = buttons[0];
    assert.equal(button.parent, pre);
    assert.equal(pre.children.filter((el) => el.tagName === "BUTTON").length, 1);
    button.events.click();
    await Promise.resolve();
    assert.equal(button.getAttribute("aria-label"), "Copied!");
    assert.equal(button.classes.has("is-copied"), true);
    button.events.click();
    await Promise.resolve();
    assert.deepEqual(written, ["  first\n\tsecond\n", "  first\n\tsecond\n"]);
  });

  test(`standalone PRE ${description} copies exact text through execCommand`, () => {
    const pre = standalonePre();
    const { document, created } = bootController([pre]);
    const buttons = created.filter((el) => el.tagName === "BUTTON");
    assert.equal(buttons.length, 1);
    const button = buttons[0];
    assert.equal(button.parent, pre);
    assert.equal(pre.children.filter((el) => el.tagName === "BUTTON").length, 1);
    button.events.click();
    const areas = created.filter((el) => el.tagName === "TEXTAREA");
    assert.equal(areas.length, 1);
    assert.equal(areas[0].value, "  first\n\tsecond\n");
    assert.equal(button.getAttribute("aria-label"), "Copied!");
    assert.equal(document.body.children.length, 0);
  });
}
