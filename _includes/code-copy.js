// Code copy buttons: adds a copy button to every code block. Rouge renders
// div.highlighter-rouge > div.highlight > pre > code; raw posts may carry
// bare <pre> blocks (e.g. the ai-codefold block). Inert on pages without
// code; readers without JS simply get no button.
(function () {
  var COPY_SVG = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="2"/><path d="M10.5 5.5v-2a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2"/></svg>';
  var CHECK_SVG = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 4.5"/></svg>';

  function blockText(block) {
    var code = block.tagName === "PRE"
      ? block
      : block.querySelector
        ? block.querySelector("pre code") || block.querySelector("pre")
        : null;
    var text = code ? code.textContent || code.innerText || "" : "";
    return text.replace(/\n$/, "");
  }

  function copyText(text, done) {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard.writeText(text).then(
        function () {
          done(true);
        },
        function () {
          done(false);
        },
      );
      return;
    }
    // Fallback for non-secure contexts (plain http): a temporary textarea
    // plus execCommand.
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "absolute";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    document.body.removeChild(area);
    done(ok);
  }

  function addButton(block) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy-btn";
    button.setAttribute("aria-label", "Copy code");
    button.innerHTML = COPY_SVG;
    var timer = null;

    button.addEventListener("click", function () {
      copyText(blockText(block), function (ok) {
        if (!ok) return;
        button.innerHTML = CHECK_SVG;
        button.setAttribute("aria-label", "Copied!");
        if (button.classList) button.classList.add("is-copied");
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
          button.innerHTML = COPY_SVG;
          button.setAttribute("aria-label", "Copy code");
          if (button.classList) button.classList.remove("is-copied");
        }, 1600);
      });
    });

    // The button anchors to the non-scrolling wrapper so it stays pinned
    // top-right even when a long line scrolls horizontally.
    if (block.classList) block.classList.add("has-code-copy");
    block.appendChild(button);
  }

  function initialize() {
    if (!document.querySelectorAll || !document.createElement) return;
    var seen = [];
    Array.prototype.forEach.call(
      document.querySelectorAll("div.highlighter-rouge, pre"),
      function (el) {
        var block = el;
        // Bare <pre> inside a Rouge wrapper or a fold gets the wrapper, not
        // its own button.
        if (block.tagName === "PRE" && block.closest) {
          var wrap =
            block.closest("div.highlighter-rouge") ||
            block.closest(".ai-codefold");
          if (wrap) {
            if (seen.indexOf(wrap) >= 0) return;
            block = wrap;
          }
        }
        if (seen.indexOf(block) >= 0) return;
        seen.push(block);
        addButton(block);
      },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
