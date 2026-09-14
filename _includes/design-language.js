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

  var designs = ["quiet", "", "classic", "modern"];
  var labels = ["Quiet", "Soft Classic", "Noisy Classic", "Modern"];
  var defaultDesign = "quiet";

  function writePreference(design) {
    try {
      if (design === defaultDesign) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, design);
    } catch (error) {
      // The switch still works for this page when storage is unavailable.
    }
  }

  function applyDesign(design) {
    if (designs.indexOf(design) < 0) design = defaultDesign;
    if (design) root.dataset.design = design;
    else delete root.dataset.design;
  }

  applyDesign(readPreference());

  function initializeToggle() {
    var toggle = document.querySelector("[data-design-toggle]");
    var menu = document.querySelector("[data-design-menu]");
    if (!toggle || !menu) return;

    var items = designs.map(function (design, i) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "design-menu-item";
      item.setAttribute("role", "menuitemradio");
      item.setAttribute("data-design-value", design);

      var check = document.createElement("span");
      check.className = "design-menu-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      item.appendChild(check);

      var name = document.createElement("span");
      name.textContent = labels[i];
      item.appendChild(name);

      menu.appendChild(item);
      return item;
    });

    function currentIndex() {
      var index = designs.indexOf(root.dataset.design || "");
      return index < 0 ? 0 : index;
    }

    function syncMenu() {
      var current = currentIndex();
      items.forEach(function (item, i) {
        var selected = i === current;
        item.setAttribute("aria-checked", selected ? "true" : "false");
        if (item.classList) item.classList.toggle("is-selected", selected);
      });
      var label = "Design style: " + labels[current] + ". Open design options";
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
    }

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) menu.removeAttribute("hidden");
      else menu.setAttribute("hidden", "");
    }

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    toggle.addEventListener("click", function (event) {
      if (event.stopPropagation) event.stopPropagation();
      setOpen(!isOpen());
    });

    document.addEventListener("click", function (event) {
      if (!isOpen()) return;
      var target = event.target || {};
      if (target.closest && target.closest("[data-design-menu]")) return;
      setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        if (toggle.focus) toggle.focus();
      }
    });

    menu.addEventListener("click", function (event) {
      var target = event.target || {};
      var item = target.closest
        ? target.closest("[data-design-value]")
        : null;
      if (!item || !menu.contains(item)) return;
      var design = item.getAttribute("data-design-value") || "";
      applyDesign(design);
      writePreference(design);
      syncMenu();
      setOpen(false);
    });

    syncMenu();
    setOpen(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeToggle);
  } else {
    initializeToggle();
  }
})();
