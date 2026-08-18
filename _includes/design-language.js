(function () {
  var storageKey = 'tony-design-language';
  var root = document.documentElement;

  function readPreference() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function writePreference(isModern) {
    try {
      if (isModern) localStorage.setItem(storageKey, 'modern');
      else localStorage.removeItem(storageKey);
    } catch (error) {
      // The switch still works for this page when storage is unavailable.
    }
  }

  function applyDesign(isModern) {
    if (isModern) root.dataset.design = 'modern';
    else delete root.dataset.design;
  }

  applyDesign(readPreference() === 'modern');

  function initializeToggle() {
    var toggle = document.querySelector('[data-design-toggle]');
    if (!toggle) return;

    function syncToggle() {
      toggle.setAttribute('aria-pressed', root.dataset.design === 'modern' ? 'true' : 'false');
    }

    syncToggle();
    toggle.addEventListener('click', function () {
      var isModern = root.dataset.design !== 'modern';
      applyDesign(isModern);
      writePreference(isModern);
      syncToggle();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeToggle);
  } else {
    initializeToggle();
  }
})();
