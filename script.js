(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ——— Hero banner: animate in immediately (no scroll gate) ———
  const heroBanner = document.getElementById('hero-banner');
  if (heroBanner) {
    requestAnimationFrame(() => heroBanner.classList.add('hero-banner-animated'));
  }

  // ——— Hero / About video reveal: fallback art stays until the file can play ———
  const setupVideoReveal = (videoId, targetSelector, liveClass) => {
    const video = document.getElementById(videoId);
    const target = document.querySelector(targetSelector);
    if (!video || !target || prefersReducedMotion) return;
    const reveal = () => {
      target.classList.add(liveClass);
      const played = video.play();
      if (played && typeof played.catch === 'function') played.catch(() => {});
    };
    if (video.readyState >= 3) {
      reveal();
    } else {
      video.addEventListener('canplay', reveal, { once: true });
    }
  };
  setupVideoReveal('hero-reel', '.hero-banner', 'hero-video-live');
  setupVideoReveal('about-reel', '.about-video-wrap', 'about-video-live');

  // ——— Pearlescent overlay: shift gradient with scroll ———
  const pearlOverlay = document.getElementById('pearl-overlay');
  function updatePearlScroll() {
    const pct = Math.min(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) || 0, 1);
    document.documentElement.style.setProperty('--scroll-pct', pct);
  }
  window.addEventListener('scroll', updatePearlScroll, { passive: true });
  window.addEventListener('resize', updatePearlScroll);
  updatePearlScroll();

  // ——— Scroll reveal (CTA containers never scroll-gated) ———
  const revealEls = document.querySelectorAll('.reveal');
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealEls.forEach((el) => {
    if (el.querySelector('.btn, .nav-cta') || el.classList.contains('hero-content')) {
      el.classList.add('revealed');
    } else {
      revealObserver.observe(el);
    }
  });

  // ——— Header scroll state ———
  const header = document.querySelector('.header');
  if (header) {
    const setScrolled = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', setScrolled, { passive: true });
    setScrolled();
  }

  // ——— First scroll: pearlescent animation on header/nav texts (once) ———
  let headerPearlDone = false;
  function onFirstScroll() {
    if (headerPearlDone || window.scrollY < 80) return;
    headerPearlDone = true;
    document.querySelectorAll('.nav-link-pearl').forEach((a) => a.classList.add('header-pearl-revealed'));
    window.removeEventListener('scroll', onFirstScroll);
  }
  window.addEventListener('scroll', onFirstScroll, { passive: true });

  // ——— Section titles: pearlescent animation when they first reveal ———
  const pearlTitleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('header-pearl-revealed');
        pearlTitleObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.2 }
  );
  document.querySelectorAll('.section-title-pearl').forEach((el) => pearlTitleObserver.observe(el));

  // ——— Stat counters: enhancement only — HTML ships final values; count-up runs
  //     on first scroll into view, skipped entirely under reduced motion ———
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const statValues = document.querySelectorAll('.stat-value[data-count]');
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          counterObserver.unobserve(el);
          const isDecimal = el.dataset.decimal === 'true';
          const target = isDecimal ? parseFloat(el.dataset.count) : parseInt(el.dataset.count, 10);
          if (isNaN(target)) return;
          const duration = 900;
          const start = performance.now();
          // Reset to 0 only here, once the animation is definitely starting —
          // if this callback never runs, the final values stay rendered.
          el.textContent = isDecimal ? '0.0' : '0';
          const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = target * eased;
            el.textContent = isDecimal ? value.toFixed(1) : Math.round(value);
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = isDecimal ? target.toFixed(1) : target;
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.25 }
    );
    statValues.forEach((el) => counterObserver.observe(el));
  }

  // ——— First testimonial: auto-scroll text ———
  const testimonialScrollEl = document.querySelector('.testimonial-quote-scroll');
  if (testimonialScrollEl) {
    const scrollDuration = 22000;
    const pauseAtBottom = 3000;
    const startDelay = 3000;
    let scrollStartTime = null;
    let phase = 'delay';

    function autoScroll(now) {
      if (!scrollStartTime) scrollStartTime = now;
      const elapsed = now - scrollStartTime;
      const maxScroll = testimonialScrollEl.scrollHeight - testimonialScrollEl.clientHeight;

      if (maxScroll <= 0) {
        requestAnimationFrame(autoScroll);
        return;
      }

      if (phase === 'delay') {
        if (elapsed >= startDelay) {
          phase = 'scroll';
          scrollStartTime = now;
        }
      } else if (phase === 'scroll') {
        const progress = Math.min(elapsed / scrollDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 1.2);
        testimonialScrollEl.scrollTop = maxScroll * eased;
        if (progress >= 1) {
          phase = 'pause';
          scrollStartTime = now;
        }
      } else if (phase === 'pause') {
        if (elapsed >= pauseAtBottom) {
          phase = 'scroll';
          scrollStartTime = now;
          testimonialScrollEl.scrollTop = 0;
        }
      }

      requestAnimationFrame(autoScroll);
    }

    const testimonialScrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            scrollStartTime = null;
            phase = 'delay';
            requestAnimationFrame(autoScroll);
          }
        });
      },
      { threshold: 0.2 }
    );
    testimonialScrollObserver.observe(testimonialScrollEl);
  }

  // ——— Footer year ———
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ——— Mobile nav toggle (optional enhancement) ———
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    const setNavOpen = (open) => {
      navLinks.classList.toggle('open', open);
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', () => {
      setNavOpen(!navLinks.classList.contains('open'));
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setNavOpen(false));
    });
  }
})();
