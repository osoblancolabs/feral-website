/* ============================================================
   book.js — /book ads landing page behavior
   - 30s timer gate that reveals the Book-a-call CTA
   - CTAs navigate to the application form (apply.html?src=book)
   - soft top-of-funnel signal on CTA click (NOT the optimized conversion)
   - on-scroll reveals
   - seamless infinite results marquee
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Signal to the head-script safety timer that JS is alive, so it keeps the
  // reveal gate active instead of un-gating after 4s.
  if (document.body) document.body.classList.add("book-ready");

  // Year stamp ------------------------------------------------
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Soft top-of-funnel signal --------------------------------
  // NOT the optimized conversion. The CTA now navigates to the application
  // form (apply.html?src=book); the qualified-only conversion 'feral_book_call'
  // fires on /book-call after the form gate passes.
  function feralTrackCtaClick(source) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "feral_book_cta_click", source: source || "cta" });
    try {
      document.dispatchEvent(new CustomEvent("feral:book-cta-click", { detail: { source: source || "cta" } }));
    } catch (e) {}
  }

  // CTA clicks: fire the soft signal, then let the link navigate to the form.
  var ctas = document.querySelectorAll("[data-book-cta]");
  for (var i = 0; i < ctas.length; i++) {
    ctas[i].addEventListener("click", function () {
      feralTrackCtaClick("cta_click");
      // no preventDefault — the anchor navigates to apply.html?src=book
    });
  }

  // Timer gate — counts down from 30s. Timestamp-based so it stays
  // accurate (and still finishes) if the tab is backgrounded/throttled.
  (function () {
    var wrap = document.getElementById("book-cta");
    var timerEl = document.getElementById("book-timer");
    var bar = document.getElementById("book-timer-bar");
    if (!wrap || !timerEl) return;
    var TOTAL = 30;
    var start = Date.now();
    var timer;
    function fmt(s) { return "0:" + String(s).padStart(2, "0"); }
    function unlock() {
      wrap.classList.add("is-unlocked");
      document.body.classList.add("cta-unlocked");
    }
    function render() {
      var rem = TOTAL - (Date.now() - start) / 1000;
      if (rem <= 0) {
        timerEl.textContent = fmt(0);
        if (bar) bar.style.transform = "scaleX(0)";
        clearInterval(timer);
        unlock();
        return;
      }
      timerEl.textContent = fmt(Math.ceil(rem));
      if (bar) bar.style.transform = "scaleX(" + rem / TOTAL + ")";
    }
    render();                       // paint accurate value immediately
    timer = setInterval(render, 250);
  })();

  // On-scroll reveals -----------------------------------------
  (function () {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      for (var k = 0; k < items.length; k++) items[k].classList.add("is-in");
      return;
    }
    var revealIO = new IntersectionObserver(function (entries, obs) {
      for (var m = 0; m < entries.length; m++) {
        if (entries[m].isIntersecting) {
          entries[m].target.classList.add("is-in");
          obs.unobserve(entries[m].target);
        }
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    for (var n = 0; n < items.length; n++) revealIO.observe(items[n]);
  })();

  // Results stream: subtle scroll-driven parallax (no auto-scroll).
  // Columns drift by a small, bounded amount at different rates as the section
  // moves through the viewport. The page scrolls normally through all results.
  (function () {
    if (reduceMotion) return;
    var section = document.querySelector(".book-marquee");
    var cols = document.querySelectorAll(".book-marquee-col");
    if (!section || !cols.length) return;
    var ranges = [0, -42, 22, -60]; // px of drift per column (bounded so no gaps show)
    var ticking = false;
    function apply() {
      ticking = false;
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var center = rect.top + rect.height / 2;
      var p = 1 - center / vh;            // 0 ≈ section entering, 1 ≈ leaving (top)
      if (p < 0) p = 0; else if (p > 1) p = 1;
      for (var i = 0; i < cols.length; i++) {
        cols[i].style.transform = "translateY(" + (p * (ranges[i] || 0)).toFixed(1) + "px)";
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();
  })();
})();
