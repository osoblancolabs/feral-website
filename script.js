(function () {
  'use strict';

  // ——— Hero banner: first-time 3-part animation ———
  const heroBanner = document.getElementById('hero-banner');
  let heroBannerAnimated = false;
  if (heroBanner) {
    const bannerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (heroBannerAnimated || !entry.isIntersecting) return;
          heroBannerAnimated = true;
          entry.target.classList.add('hero-banner-animated');
        });
      },
      { threshold: 0.15 }
    );
    bannerObserver.observe(heroBanner);
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

  // ——— Scroll reveal ———
  const revealEls = document.querySelectorAll('.reveal');
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, observerOptions);

  revealEls.forEach((el) => revealObserver.observe(el));

  // ——— Header scroll state ———
  const header = document.querySelector('.header');
  if (header) {
    const scrollObserver = new IntersectionObserver(
      ([e]) => {
        header.classList.toggle('scrolled', e.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    scrollObserver.observe(document.body);
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

  // ——— Stat counters: rapid count from 0 to final value on first scroll into view ———
  const statValues = document.querySelectorAll('.stat-value[data-count]');
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const isDecimal = el.dataset.decimal === 'true';
        const target = isDecimal ? parseFloat(el.dataset.count) : parseInt(el.dataset.count, 10);
        const duration = 1400;
        const start = performance.now();
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
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.25 }
  );
  statValues.forEach((el) => counterObserver.observe(el));

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

  // ——— Contact form ———
  const form = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');
  if (form && formMessage) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formMessage.textContent = '';
      formMessage.classList.remove('success', 'error');
      formMessage.textContent = 'Thank you. We\'ll be in touch soon.';
      formMessage.classList.add('success');
      form.reset();
    });
  }

  // ——— Footer year ———
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ——— Mobile nav toggle (optional enhancement) ———
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
  }
})();
