// Before/after gallery. Guarded: inert without .ai-gallery.
// Three (responsive: 2, 1) draggable comparison frames per view; side arrows
// page through all pairs. No free scroll, no counter. Matches blog-nav.js style.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function visibleCount() {
    if (window.matchMedia('(max-width: 600px)').matches) return 1;
    if (window.matchMedia('(max-width: 900px)').matches) return 2;
    return 3;
  }

  // --- Gallery paging ------------------------------------------------------
  Array.prototype.forEach.call(document.querySelectorAll('.ai-gallery'), function (root) {
    var track = root.querySelector('.ai-track');
    var cards = root.querySelectorAll('.ai-card');
    var prev = root.querySelector('[data-ai-prev]');
    var next = root.querySelector('[data-ai-next]');
    if (!track || !cards.length) return;
    var index = 0;

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    }
    function maxIndex() { return Math.max(0, cards.length - visibleCount()); }
    function render() {
      index = Math.max(0, Math.min(maxIndex(), index));
      track.style.transform = 'translateX(' + (-index * step()) + 'px)';
      if (prev) {
        prev.disabled = index <= 0;
        prev.hidden = maxIndex() === 0;
      }
      if (next) {
        next.disabled = index >= maxIndex();
        next.hidden = maxIndex() === 0;
      }
    }
    function go(d) { index += d; render(); }

    if (prev) {
      prev.addEventListener('click', function () { go(-1); });
      prev.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      });
    }
    if (next) {
      next.addEventListener('click', function () { go(1); });
      next.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      });
    }
    window.addEventListener('resize', render);
    render();
  });

  // --- Draggable before/after dividers --------------------------------------
  function setPos(frame, pct) {
    pct = Math.max(2, Math.min(98, pct));
    frame.style.setProperty('--pos', pct + '%');
    frame.setAttribute('aria-valuenow', Math.round(pct));
  }

  Array.prototype.forEach.call(document.querySelectorAll('.ai-compare'), function (frame) {
    var dragging = false;

    function fromClientX(x) {
      var r = frame.getBoundingClientRect();
      if (!r.width) return;
      setPos(frame, ((x - r.left) / r.width) * 100);
    }

    frame.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { frame.setPointerCapture(e.pointerId); } catch (err) { /* older browser */ }
      fromClientX(e.clientX);
    });
    frame.addEventListener('pointermove', function (e) {
      if (dragging) fromClientX(e.clientX);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
      frame.addEventListener(t, function () { dragging = false; });
    });
    frame.addEventListener('keydown', function (e) {
      var cur = parseFloat(getComputedStyle(frame).getPropertyValue('--pos')) || 50;
      if (e.key === 'ArrowLeft') setPos(frame, cur - 4);
      else if (e.key === 'ArrowRight') setPos(frame, cur + 4);
      else if (e.key === 'Home') setPos(frame, 2);
      else if (e.key === 'End') setPos(frame, 98);
      else return;
      e.preventDefault();
    });
  });

  if (reduceMotion) {
    Array.prototype.forEach.call(document.querySelectorAll('.ai-track'), function (t) {
      t.style.transition = 'none';
    });
  }
})();
