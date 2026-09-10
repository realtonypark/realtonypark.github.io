// Blog navigation: post table of contents, posts-index rail scroll tracking,
// smooth scrolling and back-to-top. Every block is guarded so this is inert on
// pages that don't carry the markup.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollToEl(el) {
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  }

  // --- Post table of contents -------------------------------------------
  var toc = document.querySelector('.post-toc');
  var content = document.querySelector('.post-content');

  if (toc && content) {
    var headings = content.querySelectorAll('h2, h3');

    if (headings.length) {
      var links = [];

      Array.prototype.forEach.call(headings, function (heading, i) {
        // kramdown supplies ids, but a heading written as raw HTML may not have one.
        if (!heading.id) heading.id = slugify(heading.textContent) || 'section-' + i;

        var link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent;
        link.className = 'post-toc-link lvl-' + heading.tagName.charAt(1);
        toc.appendChild(link);
        links.push(link);
      });

      toc.removeAttribute('hidden');

      toc.addEventListener('click', function (e) {
        var link = e.target.closest('.post-toc-link');
        if (!link) return;
        var target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        e.preventDefault();
        scrollToEl(target);
        history.replaceState(null, '', link.hash);
      });

      // Highlight whichever heading's section the reader is currently in.
      var visible = [];
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var i = visible.indexOf(entry.target);
          if (entry.isIntersecting && i === -1) visible.push(entry.target);
          else if (!entry.isIntersecting && i !== -1) visible.splice(i, 1);
        });

        if (!visible.length) return;

        var top = visible.reduce(function (a, b) {
          return a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b;
        });

        links.forEach(function (link) {
          link.classList.toggle('is-active', link.hash === '#' + top.id);
        });
      }, { rootMargin: '-80px 0px -70% 0px' });

      Array.prototype.forEach.call(headings, function (h) { spy.observe(h); });
    }
  }

  // --- Posts index rail --------------------------------------------------
  var rail = document.querySelector('.post-rail');

  if (rail) {
    var items = document.querySelectorAll('.post-list-item');

    rail.addEventListener('click', function (e) {
      var link = e.target.closest('.post-rail-item');
      if (!link) return;
      var target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      scrollToEl(target);
      history.replaceState(null, '', link.hash);
    });

    if (items.length) {
      var inView = [];
      var railSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var i = inView.indexOf(entry.target);
          if (entry.isIntersecting && i === -1) inView.push(entry.target);
          else if (!entry.isIntersecting && i !== -1) inView.splice(i, 1);
        });

        if (!inView.length) return;

        var top = inView.reduce(function (a, b) {
          return a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b;
        });

        Array.prototype.forEach.call(rail.querySelectorAll('.post-rail-item'), function (link) {
          link.classList.toggle('is-active', decodeURIComponent(link.hash.slice(1)) === top.id);
        });
      }, { rootMargin: '-90px 0px -55% 0px' });

      Array.prototype.forEach.call(items, function (item) { railSpy.observe(item); });
    }
  }

  // --- Footer clock (single-index designs) ----------------------------------------
  var clock = document.querySelector('[data-si-clock]');
  if (clock && window.Intl && Intl.DateTimeFormat) {
    var clockFormat = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago'
    });
    var tick = function () {
      clock.textContent = clockFormat.format(new Date()).replace(' ', '').toLowerCase() + ' in ';
    };
    tick();
    setInterval(tick, 15000);
  }
})();
