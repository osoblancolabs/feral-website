(function () {
  'use strict';

  var lightbox = document.createElement('div');
  lightbox.className = 'cs-lightbox';
  lightbox.innerHTML = '<button class="cs-lightbox-close" aria-label="Close">&times;</button><img src="" alt="" /><p class="cs-lightbox-caption"></p>';
  document.body.appendChild(lightbox);

  var lbImg = lightbox.querySelector('img');
  var lbCaption = lightbox.querySelector('.cs-lightbox-caption');
  var lbClose = lightbox.querySelector('.cs-lightbox-close');

  function openLightbox(src, alt, caption) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbCaption.textContent = caption || '';
    requestAnimationFrame(function () {
      lightbox.classList.add('cs-lightbox-open');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('cs-lightbox-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.cs-screenshot').forEach(function (fig) {
    fig.addEventListener('click', function () {
      var img = fig.querySelector('img');
      var caption = fig.querySelector('.cs-screenshot-caption');
      if (img) {
        openLightbox(img.src, img.alt, caption ? caption.textContent : '');
      }
    });
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lbImg) return;
    closeLightbox();
  });

  lbClose.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
})();
