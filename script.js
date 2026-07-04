(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // ——— Splash (first entry per session) + hero entrance ———
  const splash = document.getElementById('splash');
  const heroMedia = document.getElementById('hero-media');
  const enterHero = () => {
    if (heroMedia) heroMedia.classList.add('hero-enter');
  };
  let splashSeen = false;
  try { splashSeen = sessionStorage.getItem('feral_splash') === '1'; } catch (e) {}
  if (splash && !splashSeen && !prefersReducedMotion) {
    document.body.classList.add('splash-lock');
    window.setTimeout(() => {
      splash.classList.add('splash-hide');
      document.body.classList.remove('splash-lock');
      try { sessionStorage.setItem('feral_splash', '1'); } catch (e) {}
      enterHero();
      window.setTimeout(() => splash.remove(), 700);
    }, 1600);
  } else {
    if (splash) splash.remove();
    enterHero();
  }

  // ——— Hero reel: poster paints instantly, playback starts as soon as it can ———
  const heroVideo = document.getElementById('hero-reel');
  if (heroVideo && !prefersReducedMotion) {
    const start = () => {
      const played = heroVideo.play();
      if (played && typeof played.catch === 'function') played.catch(() => {});
    };
    if (heroVideo.readyState >= 3) {
      start();
    } else {
      heroVideo.addEventListener('canplay', start, { once: true });
    }
  }

  // ——— Parallax (desktop only; reduced-motion opts out) ———
  const parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (parallaxEls.length && !prefersReducedMotion && window.matchMedia('(min-width: 769px)').matches) {
    let parallaxPending = false;
    const applyParallax = () => {
      parallaxPending = false;
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -240 || box.top > vh + 240) return;
        const delta = box.top + box.height / 2 - vh / 2;
        const y = delta * parseFloat(el.getAttribute('data-parallax'));
        el.style.transform = 'translate3d(0, ' + y.toFixed(1) + 'px, 0)';
      });
    };
    const queueParallax = () => {
      if (!parallaxPending) {
        parallaxPending = true;
        requestAnimationFrame(applyParallax);
      }
    };
    window.addEventListener('scroll', queueParallax, { passive: true });
    window.addEventListener('resize', queueParallax, { passive: true });
    applyParallax();
  }

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
