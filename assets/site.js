/* ==========================================================================
   STUDIO ITTA — interakce (sdílené pro index.html i galerie.html)
   Vše animuje pouze transform / opacity. Respektuje prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- 1. vstupní animace hero + headeru ------------------------------- */
  requestAnimationFrame(function () {
    document.body.classList.add('ready');
    var h = document.getElementById('header');
    if (h) h.classList.add('ready');
  });

  /* --- 2. plynulý marquee: zdvojíme obsah pro bezešvou smyčku ----------- */
  var track = document.getElementById('bandTrack');
  if (track) {
    var clone = track.firstElementChild.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  /* --- 3. odhalování sekcí při scrollu ---------------------------------- */
  var revealables = [].slice.call(document.querySelectorAll('.r, .r-clip'));
  function revealAll() { revealables.forEach(function (el) { el.classList.add('in'); }); }

  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '-8% 0px -4% 0px' });
    revealables.forEach(function (el) { io.observe(el); });

    /* Pojistka: co je po načtení už ve výřezu (nebo nad ním), odhalíme rovnou —
       observer se u rychlého scrollu nebo při návratu zpět nemusí spustit
       a obsah by zůstal neviditelný. */
    var safety = function () {
      var vh = window.innerHeight;
      revealables.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.95) { el.classList.add('in'); io.unobserve(el); }
      });
    };
    safety();
    window.addEventListener('load', safety);
    window.addEventListener('pageshow', safety);
  } else {
    revealAll();
  }

  /* --- 4. header: stav po odscrollování + tlačítko nahoru --------------- */
  var header = document.getElementById('header');
  var toTop = document.getElementById('totop');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (toTop) toTop.classList.toggle('show', y > 900);
    parallax();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* --- 5. jemná parallaxa fotek v galerii (jen transform) --------------- */
  var parItems = [].slice.call(document.querySelectorAll('[data-par]'));
  function parallax() {
    if (reduced || window.innerWidth < 760) return;
    var vh = window.innerHeight;
    parItems.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var progress = (r.top + r.height / 2 - vh / 2) / vh;   // -1 … 1
      var layer = el.querySelector('.gal-media');
      if (layer) layer.style.transform = 'translate3d(0,' + (progress * parseFloat(el.dataset.par) * -100).toFixed(2) + 'px,0) scale(1.06)';
    });
  }
  parallax();

  /* --- 6. aktivní položka navigace podle sekce -------------------------- */
  /* jen kotvy v rámci této stránky — odkazy typu "index.html#sluzby" přeskočíme */
  var navLinks = [].slice.call(document.querySelectorAll('.nav a'))
    .filter(function (a) { return (a.getAttribute('href') || '').charAt(0) === '#'; });
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* --- 7. mobilní menu -------------------------------------------------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
  var drawerNav = [].slice.call(drawer.querySelectorAll(':scope > a'));   // odkazy menu
  var drawerAll = [].slice.call(drawer.querySelectorAll('a'));            // + tlačítka v patičce
  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    document.body.style.overflow = open ? 'hidden' : '';
    drawerNav.forEach(function (a, i) {
      a.style.transitionDelay = open ? (0.12 + i * 0.055) + 's' : '0s';
    });
  }
  burger.addEventListener('click', function () {
    setDrawer(burger.getAttribute('aria-expanded') !== 'true');
  });
  drawerAll.forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) { setDrawer(false); burger.focus(); }
  });
  }

  /* --- 8. záložky ceníku ------------------------------------------------ */
  var tabs = [].slice.call(document.querySelectorAll('.price-nav [role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      if (on) { panel.removeAttribute('hidden'); } else { panel.setAttribute('hidden', ''); }
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
              : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus(); selectTab(next);
    });
  });

  /* --- 9. počítadla ve statistikách ------------------------------------- */
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  if ('IntersectionObserver' in window && !reduced) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, end = parseInt(el.dataset.count, 10), t0 = null, dur = 1100;
        var start = end > 1000 ? end - 90 : 0;
        function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(start + (end - start) * eased);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* --- 10. magnetické tlačítko (jen myš) -------------------------------- */
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    [].slice.call(document.querySelectorAll('.btn')).forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.16;
        var y = (e.clientY - r.top - r.height / 2) * 0.22;
        btn.style.setProperty('--mx', x.toFixed(1) + 'px');
        btn.style.setProperty('--my', y.toFixed(1) + 'px');
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.removeProperty('--mx'); btn.style.removeProperty('--my');
      });
    });
  }

  /* --- 11. rok v patičce ------------------------------------------------ */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
