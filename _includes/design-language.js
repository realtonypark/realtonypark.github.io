(function () {
  var storageKey = "tony-design-language";
  var root = document.documentElement;

  function readPreference() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  var designs = ["", "quiet", "paper", "classic", "modern"];
  var labels = ["Thinking Machines", "Quiet", "Paper", "Classic", "Modern"];

  // Fonts only one design uses load only when that design is active.
  var fonts = {
    paper:
      "https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;0,500;1,400&family=Caveat:wght@600&family=Instrument+Serif:ital@1&display=swap",
  };

  function loadFonts(design) {
    var href = fonts[design];
    if (!href || document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function writePreference(design) {
    try {
      if (design) localStorage.setItem(storageKey, design);
      else localStorage.removeItem(storageKey);
    } catch (error) {
      // The switch still works for this page when storage is unavailable.
    }
  }

  function applyDesign(design) {
    if (designs.indexOf(design) < 0) design = "";
    if (design) root.dataset.design = design;
    else delete root.dataset.design;
    loadFonts(design);
  }

  applyDesign(readPreference());

  function initializeToggle() {
    var toggle = document.querySelector("[data-design-toggle]");
    if (!toggle) return;

    function syncToggle() {
      var index = designs.indexOf(root.dataset.design || "");
      var next = (index + 1) % designs.length;
      var label =
        "Design style: " + labels[index] + ". Switch to " + labels[next];
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute(
        "aria-pressed",
        index === 0 ? "false" : index === designs.length - 1 ? "true" : "mixed",
      );
      toggle.setAttribute("title", label);
    }

    syncToggle();
    toggle.addEventListener("click", function () {
      var index = designs.indexOf(root.dataset.design || "");
      var design = designs[(index + 1) % designs.length];
      applyDesign(design);
      writePreference(design);
      syncToggle();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeToggle);
  } else {
    initializeToggle();
  }
})();
