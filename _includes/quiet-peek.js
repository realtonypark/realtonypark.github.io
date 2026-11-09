(function () {
  var blurb = document.getElementById("qi-lead");
  var main = document.querySelector("main");
  if (!blurb || !main) return;

  // Each linked phrase: one preview panel, or two side by side.
  // img/size omitted for text-only panels.
  var WORKS = {
    tars: { h: 220, panels: [
      { title: "Tars Discovery", meta: "Space-native robots", img: "/assets/astronaut.webp", size: [2216, 1660], href: "https://tarsdiscovery.com", src: "Website" }
    ] }
  };

  // Every linked phrase takes its work's underline hue and describes its
  // preview to screen readers. External links open in a new tab.
  var links = document.querySelectorAll(".single-index a[data-key]");
  for (var i = 0; i < links.length; i++) {
    (function (a) {
      var w = WORKS[a.getAttribute("data-key")];
      if (!w) return;
      if (/^https?:/.test(a.getAttribute("href"))) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      var caption = w.panels.map(function (p) {
        return p.title + ", " + p.meta;
      }).join(" / ");
      // Text nodes only: the link may embed an icon whose title is not
      // part of its name.
      var name = "";
      for (var n = a.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) name += n.textContent;
      }
      a.setAttribute("aria-label", name.trim() + ": " + caption);
      a.style.setProperty("--h", w.h);
    })(links[i]);
  }

  // Preload previews once idle so the first hover feels instant — but only
  // while Quiet is active, so other designs never pay for the preview.
  var preloaded = false;
  function useQuiet() {
    return document.documentElement.dataset.design === "quiet";
  }
  function preload() {
    if (preloaded || !useQuiet()) return;
    preloaded = true;
    for (var key in WORKS) {
      var panels = WORKS[key].panels;
      for (var j = 0; j < panels.length; j++) {
        if (panels[j].img) new Image().src = panels[j].img;
      }
    }
  }
  if ("requestIdleCallback" in window) requestIdleCallback(preload, { timeout: 4000 });
  else setTimeout(preload, 2000);
  main.addEventListener("pointerover", preload, { once: true });
  // A visitor can switch to this theme without reloading; preload then.
  if ("MutationObserver" in window) {
    new MutationObserver(preload).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-design"]
    });
  }

  var peek = document.getElementById("qpeek");
  var PEEK_1 = 248, PEEK_2 = 340; // matches .qpeek widths in the CSS
  var active = null, lastPointer = "mouse", hideTimer = 0;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildPanels(panels) {
    if (panels.length > 1) peek.classList.add("qp-pair");
    else peek.classList.remove("qp-pair");
    while (peek.firstChild) peek.removeChild(peek.firstChild);
    panels.forEach(function (p) {
      var a = el("a", "qp-panel");
      a.href = p.href;
      if (/^https?:/.test(p.href)) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      if (p.img) {
        var pic = el("span", "qp-pic");
        pic.style.aspectRatio = p.size.join(" / ");
        var img = el("img");
        img.alt = "";
        img.onerror = function () {
          pic.setAttribute("hidden", "");
          if (active) place(active);
        };
        img.src = p.img;
        pic.appendChild(img);
        a.appendChild(pic);
      }
      a.appendChild(el("span", "qp-t", p.title));
      var m = el("span", "qp-m");
      m.appendChild(el("span", null, p.meta.replace(/ \u00b7 /g, "\u00a0\u00b7\u00a0")));
      if (p.src) {
        var src = el("span", "qp-src", p.src + " ");
        var arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        arrow.setAttribute("viewBox", "0 0 10 10");
        arrow.setAttribute("aria-hidden", "true");
        arrow.setAttribute("class", "qp-ext");
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M2.5 7.5 7.5 2.5M3.5 2.5h4v4");
        arrow.appendChild(path);
        src.appendChild(arrow);
        m.appendChild(src);
      }
      a.appendChild(m);
      peek.appendChild(a);
    });
  }

  function place(link, clientX) {
    var rects = link.getClientRects();
    var r = rects[0];
    if (clientX != null && rects.length > 1) {
      for (var i = 0; i < rects.length; i++) {
        if (clientX >= rects[i].left && clientX <= rects[i].right) r = rects[i];
      }
    }
    var m = 14, gap = 12;
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    // Wide screens: hold the full card in the right margin, level with the
    // word, so it never covers the text.
    var w = WORKS[link.getAttribute("data-key")];
    var wide = blurb.getBoundingClientRect().right + 48 +
      (w.panels.length > 1 ? PEEK_2 : PEEK_1) + m <= vw;
    if (wide) peek.classList.remove("qp-compact");
    else peek.classList.add("qp-compact");
    var pw = peek.offsetWidth, ph = peek.offsetHeight;
    if (wide) {
      peek.style.left = (blurb.getBoundingClientRect().right + 48) + "px";
      peek.style.top = Math.max(m, Math.min(r.top + r.height / 2 - ph / 2, vh - ph - m)) + "px";
      return;
    }
    // Narrow screens: the compact strip sits just above the word, pointing
    // at it; below it only when there is no room above.
    var cx = r.left + r.width / 2;
    var x = Math.max(m, Math.min(cx - pw / 2, vw - pw - m));
    var y = r.top - ph - 10, below = false;
    if (y < 6) { y = r.bottom + gap; below = true; }
    if (below) peek.classList.add("qp-below");
    else peek.classList.remove("qp-below");
    peek.style.setProperty("--ax", Math.max(14, Math.min(cx - x, pw - 14)) + "px");
    peek.style.left = x + "px";
    peek.style.top = y + "px";
  }

  function show(link, clientX) {
    clearTimeout(hideTimer);
    var w = WORKS[link.getAttribute("data-key")];
    if (!w) return;
    if (active && active !== link) active.classList.remove("is-active");
    active = link;
    link.classList.add("is-active");
    buildPanels(w.panels);
    peek.style.setProperty("--h", w.h);
    peek.style.setProperty("--tilt", ((w.h % 5) - 2) * 0.45 + "deg");
    if (lastPointer === "touch") peek.classList.add("is-touch");
    else peek.classList.remove("is-touch");
    place(link, clientX);
    requestAnimationFrame(function () { peek.classList.add("is-open"); });
  }

  function hide() {
    if (active) active.classList.remove("is-active");
    active = null;
    peek.classList.remove("is-open", "is-touch");
  }

  document.addEventListener("pointerdown", function (e) {
    lastPointer = e.pointerType || "mouse";
  }, true);

  function keyLink(target) {
    return target.closest ? target.closest(".single-index a[data-key]") : null;
  }

  main.addEventListener("pointerover", function (e) {
    var a = keyLink(e.target);
    if (!a || e.pointerType === "touch") return;
    show(a, e.clientX);
  });
  main.addEventListener("pointerout", function (e) {
    var a = keyLink(e.target);
    if (!a || e.pointerType === "touch") return;
    if (e.relatedTarget && a.contains(e.relatedTarget)) return;
    hideTimer = setTimeout(hide, 60);
  });
  main.addEventListener("focusin", function (e) {
    var a = keyLink(e.target);
    if (!a) return;
    show(a);
    if (lastPointer === "touch") {
      // A touch tap focuses before it clicks; leave the claim for the
      // click handler so the first tap previews instead of navigating.
      a.classList.remove("is-active");
      active = null;
    }
  });
  main.addEventListener("focusout", function () {
    hideTimer = setTimeout(hide, 60);
  });

  // Touch: first tap shows the preview, tapping a panel (or the same word
  // again for its primary link) follows the link.
  main.addEventListener("click", function (e) {
    var a = keyLink(e.target);
    if (!a) return;
    if (lastPointer === "touch" && active !== a) {
      e.preventDefault();
      show(a, e.clientX);
    }
  });
  document.addEventListener("click", function (e) {
    if (lastPointer === "touch" && active &&
        !keyLink(e.target) && !(e.target.closest && e.target.closest("#qpeek"))) hide();
  });
  window.addEventListener("scroll", function () {
    if (active && lastPointer !== "touch") hide();
    else if (active) place(active);
  }, { passive: true });
  window.addEventListener("resize", function () {
    if (active) place(active);
  });
})();
