(function () {
  var blurb = document.getElementById("new-blurb");
  var main = document.querySelector("main");
  if (!blurb || !main) return;

  // Each linked phrase: preview image, caption, and underline hue.
  // img/size omitted for text-only cards.
  var WORKS = {
    tars:      { title: "Tars Discovery", meta: "Space-native robots", img: "/assets/astronaut.webp", size: [2216, 1660], href: "https://tarsdiscovery.com", src: "Website", h: 220 },
    bitcoin:   { title: "Building a (Mini) Bitcoin", meta: "Rust full node · 2026", img: "/assets/new-theme/bitcoin-960.png", size: [960, 960], href: "{% link _posts/2026-07-17-building-a-mini-bitcoin.md %}", src: "Post", h: 55 },
    nupython:  { title: "Building a Python Interpreter in C", meta: "nuPython · 2026", img: "/assets/new-theme/nupython-960.png", size: [960, 725], href: "{% link _posts/2026-02-02-building-python-interpreter-in-c.md %}", src: "Post", h: 265 },
    ai:        { title: "Steal the Aesthetic of Any Image", meta: "Playing with AI · 2026", img: "/assets/posts/ai-aesthetic/wafer-inspiration.jpg", size: [1600, 1117], href: "{% link _posts/2026-09-07-clone-aesthetic-image-online.md %}", src: "Post", h: 340 },
    moneyball: { title: "Moneyball", meta: "Bennett Miller · 2011", img: "https://upload.wikimedia.org/wikipedia/en/2/2e/Moneyball_Poster.jpg", size: [259, 384], href: "https://en.wikipedia.org/wiki/Moneyball_(film)", src: "Wikipedia", h: 135 },
    vertigo:   { title: "The Transfer of Green in Vertigo", meta: "Film essay · 2024", img: "/assets/posts/vertigo.webp", size: [1024, 576], href: "{% link _posts/2024-11-13-the-transfer-of-green-in-vertigo.md %}", src: "Post", h: 152 },
    social:    { title: "The Social Network", meta: "David Fincher · 2010", img: "https://upload.wikimedia.org/wikipedia/en/8/8c/The_Social_Network_film_poster.png", size: [259, 384], href: "https://en.wikipedia.org/wiki/The_Social_Network", src: "Wikipedia", h: 210 },
    basterds:  { title: "Inglourious Basterds", meta: "Quentin Tarantino · 2009", img: "https://upload.wikimedia.org/wikipedia/en/c/c3/Inglourious_Basterds_poster.jpg", size: [260, 385], href: "https://en.wikipedia.org/wiki/Inglourious_Basterds", src: "Wikipedia", h: 18 },
    season:    { title: "Investment Strategy Memo", meta: "Investing · 2026", href: "{% link _posts/2026-09-24-investment-strategy-memo.md %}", src: "Post", h: 100 }
  };

  // Every linked phrase takes its work's underline hue and describes its
  // preview to screen readers. External links open in a new tab.
  var links = document.querySelectorAll(".new-intro a[data-key]");
  for (var i = 0; i < links.length; i++) {
    (function (a) {
      var w = WORKS[a.getAttribute("data-key")];
      if (!w) return;
      if (/^https?:/.test(a.getAttribute("href"))) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.setAttribute("aria-label", a.textContent + ": " + w.title + ", " + w.meta);
      a.style.setProperty("--h", w.h);
    })(links[i]);
  }

  // Preload previews once idle so the first hover feels instant — but only
  // while this theme is active, so other designs never pay the ~2.6 MB.
  var preloaded = false;
  function useNewTheme() {
    return document.documentElement.dataset.design === "new";
  }
  function preload() {
    if (preloaded || !useNewTheme()) return;
    preloaded = true;
    for (var key in WORKS) {
      if (WORKS[key].img) new Image().src = WORKS[key].img;
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

  var peek = document.getElementById("new-peek");
  var pImg = document.getElementById("new-peek-img");
  var pPic = document.getElementById("new-peek-pic");
  var PEEK_W = 248; // matches .new-peek width in the CSS
  var ARROW = (function () {
    var t = document.createElement("template");
    t.innerHTML = '<svg class="np-ext" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5 7.5 2.5M3.5 2.5h4v4"/></svg>';
    return t.content.firstChild;
  })();
  var pT = document.getElementById("new-peek-t");
  var pM = document.getElementById("new-peek-m");
  var pSrc = document.getElementById("new-peek-src");
  var active = null, lastPointer = "mouse", hideTimer = 0;

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
    var colRight = blurb.getBoundingClientRect().right;
    var wide = colRight + 48 + PEEK_W + m <= vw;
    if (wide) peek.classList.remove("np-compact");
    else peek.classList.add("np-compact");
    var pw = peek.offsetWidth, ph = peek.offsetHeight;
    if (wide) {
      peek.style.left = (colRight + 48) + "px";
      peek.style.top = Math.max(m, Math.min(r.top + r.height / 2 - ph / 2, vh - ph - m)) + "px";
      return;
    }
    // Narrow screens: the compact strip sits just above the word, pointing
    // at it; below it only when there is no room above.
    var cx = r.left + r.width / 2;
    var x = Math.max(m, Math.min(cx - pw / 2, vw - pw - m));
    var y = r.top - ph - 10, below = false;
    if (y < 6) { y = r.bottom + gap; below = true; }
    if (below) peek.classList.add("np-below");
    else peek.classList.remove("np-below");
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
    if (w.href) peek.href = w.href;
    else peek.removeAttribute("href");
    peek.style.setProperty("--h", w.h);
    peek.style.setProperty("--tilt", ((w.h % 5) - 2) * 0.45 + "deg");
    if (w.img) {
      pPic.removeAttribute("hidden");
      pPic.style.aspectRatio = w.size.join(" / ");
    } else {
      pPic.setAttribute("hidden", "");
      pPic.style.aspectRatio = "";
    }
    // Drop the old picture before swapping: otherwise the browser keeps
    // showing it until the new one finishes loading. A remote image that
    // fails degrades the card to text-only instead of showing a hole.
    pImg.onerror = function () {
      if (active === link && w.img) {
        pPic.setAttribute("hidden", "");
        place(link, clientX);
      }
    };
    if (w.img && pImg.getAttribute("src") !== w.img) {
      pImg.removeAttribute("src");
      pImg.src = w.img;
    }
    pT.textContent = w.title;
    pM.textContent = w.meta.replace(/ \u00b7 /g, "\u00a0\u00b7\u00a0");
    pSrc.textContent = "";
    if (w.src) {
      pSrc.appendChild(document.createTextNode(w.src));
      pSrc.appendChild(ARROW.cloneNode(true));
    }
    if (lastPointer === "touch") peek.classList.add("is-touch");
    else peek.classList.remove("is-touch");
    place(link, clientX);
    if (w.img && !pImg.complete) {
      pImg.onload = function () { if (active === link) place(link, clientX); };
    }
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
    return target.closest ? target.closest(".new-intro a[data-key]") : null;
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
    if (a) show(a);
  });
  main.addEventListener("focusout", function () {
    hideTimer = setTimeout(hide, 60);
  });

  // Touch: first tap shows the preview, tapping the card (or the same word
  // again) opens the link.
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
        !keyLink(e.target) && !(e.target.closest && e.target.closest("#new-peek"))) hide();
  });
  window.addEventListener("scroll", function () {
    if (active && lastPointer !== "touch") hide();
    else if (active) place(active);
  }, { passive: true });
  window.addEventListener("resize", function () {
    if (active) place(active);
  });
})();
