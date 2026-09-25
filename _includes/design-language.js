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
  var labels = ["Quiet", "Soft Classic", "Classic", "Modern"];
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
    var toggles = document.querySelectorAll
      ? document.querySelectorAll("[data-design-toggle]")
      : [];
    if (!toggles.length) return;

    function currentIndex() {
      var index = designs.indexOf(root.dataset.design || "");
      return index < 0 ? 0 : index;
    }

    // Each trigger pairs with the menu inside its own parent, so the header
    // Aa and the post date-line Aa each open their own menu.
    var pairs = [];
    Array.prototype.forEach.call(toggles, function (toggle) {
      var parent = toggle.parentNode || toggle.parentElement;
      var menu =
        parent && parent.querySelector
          ? parent.querySelector("[data-design-menu]")
          : null;
      if (!menu) return;

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

      pairs.push({ toggle: toggle, menu: menu, items: items });
    });
    if (!pairs.length) return;

    function isOpen(pair) {
      return pair.toggle.getAttribute("aria-expanded") === "true";
    }

    function setOpen(pair, open) {
      pair.toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        pairs.forEach(function (other) {
          if (other === pair) return;
          other.toggle.setAttribute("aria-expanded", "false");
          other.menu.setAttribute("hidden", "");
        });
        pair.menu.removeAttribute("hidden");
      } else {
        pair.menu.setAttribute("hidden", "");
      }
    }

    function closeAll() {
      pairs.forEach(function (pair) {
        setOpen(pair, false);
      });
    }

    function syncAll() {
      var current = currentIndex();
      var label = "Design style: " + labels[current] + ". Open design options";
      pairs.forEach(function (pair) {
        pair.items.forEach(function (item, i) {
          var selected = i === current;
          item.setAttribute("aria-checked", selected ? "true" : "false");
          if (item.classList) item.classList.toggle("is-selected", selected);
        });
        pair.toggle.setAttribute("aria-label", label);
        pair.toggle.setAttribute("title", label);
      });
    }

    pairs.forEach(function (pair) {
      pair.toggle.addEventListener("click", function (event) {
        if (event.stopPropagation) event.stopPropagation();
        setOpen(pair, !isOpen(pair));
      });

      pair.menu.addEventListener("click", function (event) {
        var target = event.target || {};
        var item = target.closest
          ? target.closest("[data-design-value]")
          : null;
        if (!item || !pair.menu.contains(item)) return;
        var design = item.getAttribute("data-design-value") || "";
        applyDesign(design);
        writePreference(design);
        syncAll();
        setOpen(pair, false);
      });
    });

    document.addEventListener("click", function (event) {
      var target = event.target || {};
      var inMenu = pairs.some(function (pair) {
        return pair.menu.contains(target);
      });
      if (inMenu) return;
      closeAll();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      pairs.forEach(function (pair) {
        if (!isOpen(pair)) return;
        setOpen(pair, false);
        if (pair.toggle.focus) pair.toggle.focus();
      });
    });

    syncAll();
    closeAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeToggle);
  } else {
    initializeToggle();
  }
})();
