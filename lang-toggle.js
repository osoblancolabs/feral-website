/* Site-wide language toggle.
   - Auto-injects a fixed-position EN/ES button at top-right of every page.
   - Persists choice in localStorage so it carries across all pages.
   - On load, applies the saved language by toggling <html lang>.
   - CSS does the visible/hidden swap for .t-en / .t-es spans.
   - JS handles attribute-based strings: placeholders and <option> text. */

(function () {
  function init() {
    const root = document.documentElement;
    if (!root) return;

    // Inject the toggle UI if a page hasn't already added one.
    let switcher = document.querySelector('.lang-switch');
    if (!switcher) {
      switcher = document.createElement('div');
      switcher.className = 'lang-switch';
      switcher.setAttribute('role', 'group');
      switcher.setAttribute('aria-label', 'Language');
      switcher.innerHTML =
        '<button type="button" data-lang="en" aria-label="English">EN</button>' +
        '<button type="button" data-lang="es" aria-label="Español">ES</button>';
      document.body.appendChild(switcher);
    }

    const buttons = switcher.querySelectorAll('button[data-lang]');

    function applyLang(lang) {
      if (lang !== 'es') lang = 'en';
      root.setAttribute('lang', lang);
      buttons.forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.lang === lang);
      });
      // Swap input placeholders.
      document.querySelectorAll('[data-en-placeholder], [data-es-placeholder]').forEach(function (el) {
        const p = el.getAttribute('data-' + lang + '-placeholder');
        if (p !== null) el.setAttribute('placeholder', p);
      });
      // Swap <option> labels.
      document.querySelectorAll('option[data-en], option[data-es]').forEach(function (el) {
        const v = el.getAttribute('data-' + lang);
        if (v !== null) el.textContent = v;
      });
      // Swap document title if both langs are provided.
      const titleEl = document.querySelector('title[data-en][data-es]');
      if (titleEl) {
        const v = titleEl.getAttribute('data-' + lang);
        if (v !== null) titleEl.textContent = v;
      }
      // Notify any page-specific code that wants to localize JS-driven strings.
      try {
        document.dispatchEvent(new CustomEvent('feralLangChanged', { detail: { lang: lang } }));
      } catch (e) {}
      try { localStorage.setItem('feral_lang', lang); } catch (e) {}
    }

    let saved = null;
    try { saved = localStorage.getItem('feral_lang'); } catch (e) {}
    applyLang(saved === 'es' ? 'es' : 'en');

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.dataset.lang); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
