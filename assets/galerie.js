/* ==========================================================================
   STUDIO ITTA — lightbox fotogalerie (jen pro galerie.html)
   Ovládání: klik / Enter / mezerník na fotce, šipky, Esc, klik mimo fotku.
   ========================================================================== */
(function () {
  'use strict';

  var lb = document.getElementById('lightbox');
  if (!lb) return;

  var shots = [].slice.call(document.querySelectorAll('.shot'));
  if (!shots.length) return;

  var img    = document.getElementById('lbImg');
  var cap    = document.getElementById('lbCap');
  var pos    = document.getElementById('lbPos');
  var btnPrev= document.getElementById('lbPrev');
  var btnNext= document.getElementById('lbNext');
  var btnClose = document.getElementById('lbClose');

  var index = 0;
  var lastFocused = null;

  /* seznam fotek: zdroj, popisek a alternativní text bereme přímo z dlaždic */
  var items = shots.map(function (fig) {
    var i = fig.querySelector('img');
    var c = fig.querySelector('figcaption');
    return { src: i.getAttribute('src'), alt: i.getAttribute('alt') || '', cap: c ? c.textContent.trim() : '' };
  });

  function show(i) {
    index = (i + items.length) % items.length;
    var it = items[index];
    img.setAttribute('src', it.src);
    img.setAttribute('alt', it.alt);
    cap.textContent = it.cap;
    pos.textContent = '· ' + (index + 1) + ' / ' + items.length;
  }

  function open(i) {
    lastFocused = document.activeElement;
    show(i);
    lb.hidden = false;
    /* jeden snímek navíc, aby proběhl přechod na .open */
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    var done = function () { lb.hidden = true; lb.removeEventListener('transitionend', done); };
    lb.addEventListener('transitionend', done);
    /* pojistka, kdyby přechod neproběhl (reduced motion) */
    setTimeout(function () { if (!lb.classList.contains('open')) lb.hidden = true; }, 450);
    if (lastFocused) lastFocused.focus();
  }

  /* --- otevření z dlaždice --- */
  shots.forEach(function (fig, i) {
    fig.addEventListener('click', function () { open(i); });
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); open(i); }
    });
  });

  /* --- ovládací prvky --- */
  btnPrev.addEventListener('click', function (e) { e.stopPropagation(); show(index - 1); });
  btnNext.addEventListener('click', function (e) { e.stopPropagation(); show(index + 1); });
  btnClose.addEventListener('click', close);

  /* klik na pozadí (ne na fotku ani na tlačítka) zavírá */
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-stage')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape')     { close(); }
    else if (e.key === 'ArrowLeft')  { show(index - 1); }
    else if (e.key === 'ArrowRight') { show(index + 1); }
    else if (e.key === 'Tab') {
      /* fokus držíme uvnitř dialogu */
      var f = [btnClose, btnPrev, btnNext];
      var at = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
})();
