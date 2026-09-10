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

  var designs = ["", "quiet", "classic", "modern"];
  var labels = ["Thinking Machines", "Quiet", "Classic", "Modern"];

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
