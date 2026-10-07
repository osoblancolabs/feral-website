/* ============================================================
   book.js — /book ads landing page behavior
   - 10s timer gate that reveals the Book-a-call CTA
   - VSL player: HLS, muted autoplay, sound button, pauses Kiera's video
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

  // Timer gate — counts down from 10s. Timestamp-based so it stays
  // accurate (and still finishes) if the tab is backgrounded/throttled.
  (function () {
    var wrap = document.getElementById("book-cta");
    var timerEl = document.getElementById("book-timer");
    var bar = document.getElementById("book-timer-bar");
    if (!wrap || !timerEl) return;
    var TOTAL = 10;
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

  // VSL player ------------------------------------------------
  // The video is an HLS ladder on the Blob store. Browsers with built-in HLS
  // (Safari, iOS, in-app browsers, Android Chrome) play the <source> as-is;
  // the rest load the vendored hls.js. It autoplays muted with a sound button
  // over it; the button restarts from 0:00 with sound and hands over to the
  // native controls. If autoplay is refused, the native controls show at once.
  var HLS_JS = "assets/vendor/hls.light-1.7.3.min.js";
  var vsl = document.getElementById("book-vsl-video");
  var caseVideo = null;             // YT.Player for Kiera's video, once ready

  (function () {
    if (!vsl) return;
    var src = vsl.getAttribute("data-hls");
    var source = vsl.querySelector("source");
    var soundBtn = document.getElementById("book-vsl-sound");
    var hlsStarted = false;

    function handOverToControls() {
      if (soundBtn) soundBtn.hidden = true;
      vsl.controls = true;
    }

    function tryAutoplay() {
      var p = vsl.play();
      if (p && p.catch) p.catch(function (err) {
        if (err && err.name === "NotAllowedError") {
          vsl.muted = false;
          handOverToControls();
        }
      });
    }

    function startHlsJs() {
      if (hlsStarted) return;
      hlsStarted = true;
      var s = document.createElement("script");
      s.src = HLS_JS;
      s.onload = function () {
        var Hls = window.Hls;
        if (!Hls || !Hls.isSupported()) { handOverToControls(); return; }
        var hls = new Hls({ capLevelToPlayerSize: true });
        var recoveries = 0;           // fatal errors survived; give up after 3
        hls.on(Hls.Events.ERROR, function (evt, data) {
          if (!data.fatal) return;
          if (++recoveries > 3) { hls.destroy(); handOverToControls(); return; }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else { hls.destroy(); handOverToControls(); }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, tryAutoplay);
        hls.loadSource(src);
        hls.attachMedia(vsl);
      };
      s.onerror = handOverToControls;
      document.head.appendChild(s);
    }

    vsl.addEventListener("playing", function () {
      if (soundBtn && vsl.muted && !vsl.controls) soundBtn.hidden = false;
    });

    // Playing with sound pauses Kiera's video. "play" misses an unmute of a
    // video that is already playing, so volume changes count too.
    function pauseCaseVideo() {
      if (!vsl.muted && !vsl.paused && caseVideo && caseVideo.pauseVideo) caseVideo.pauseVideo();
    }
    vsl.addEventListener("play", pauseCaseVideo);
    vsl.addEventListener("volumechange", pauseCaseVideo);

    if (soundBtn) soundBtn.addEventListener("click", function () {
      vsl.muted = false;
      try { vsl.currentTime = 0; } catch (e) {}
      handOverToControls();
      var p = vsl.play();
      if (p && p.catch) p.catch(function () {});
    });

    if (vsl.canPlayType("application/vnd.apple.mpegurl")) {
      if (source) source.addEventListener("error", startHlsJs);
      tryAutoplay();
    } else {
      startHlsJs();
    }
  })();

  // Kiera's video (YouTube) pauses the VSL when it starts. The IFrame API
  // loads only when the video comes near the screen.
  (function () {
    var frame = document.getElementById("book-case-yt");
    if (!frame || !vsl) return;
    function attach() {
      window.onYouTubeIframeAPIReady = function () {
        caseVideo = new window.YT.Player(frame, {
          events: {
            onStateChange: function (e) {
              if (e.data === window.YT.PlayerState.PLAYING && !vsl.paused) vsl.pause();
            }
          }
        });
      };
      var s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
    if (!("IntersectionObserver" in window)) { attach(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.disconnect(); attach(); return; }
      }
    }, { rootMargin: "600px 0px" });
    io.observe(frame);
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
