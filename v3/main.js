/* Sugar Dessert Bar — v3 "Champions" */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro overlay ---------- */
  var overlay = document.querySelector('.intro-overlay');
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    // next frame so the initial (hidden) state is painted first
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('hero-live'); }); });
  }
  function cleanupIntro() {
    if (!overlay) return;
    window.removeEventListener('keydown', skipIntro, true);
    window.removeEventListener('wheel', skipIntro, { passive: true });
    window.removeEventListener('touchstart', skipIntro, { passive: true });
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    root.classList.remove('intro');
    overlay = null;
  }
  function skipIntro() {
    if (!overlay || overlay.classList.contains('skip')) return;
    overlay.classList.add('skip');
    // restart the lift animation immediately
    overlay.style.animation = 'none';
    void overlay.offsetWidth;
    overlay.style.animation = '';
    startHero();
  }
  if (root.classList.contains('intro') && overlay && !reduce) {
    overlay.addEventListener('click', skipIntro);
    window.addEventListener('keydown', skipIntro, true);
    window.addEventListener('wheel', skipIntro, { passive: true });
    window.addEventListener('touchstart', skipIntro, { passive: true });
    overlay.addEventListener('animationstart', function (e) {
      if (e.animationName === 'introLift') startHero();
    });
    overlay.addEventListener('animationend', function (e) {
      if (e.animationName === 'introLift') cleanupIntro();
    });
    // safety nets (e.g. animations throttled in background tabs)
    setTimeout(startHero, 1150);
    setTimeout(cleanupIntro, 1800);
  } else {
    cleanupIntro();
    startHero();
  }

  /* ---------- Header state + mobile menu ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  var bands = document.querySelectorAll('.band');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    bands.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add(en.target.classList.contains('band') ? 'in-view' : 'in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    bands.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbCap = document.getElementById('lb-cap');
  var lbImg = document.createElement('img');
  lbImg.id = 'lb-img';
  lbImg.decoding = 'async';
  var shots = Array.prototype.slice.call(document.querySelectorAll('.tile, .cert-thumb'));
  var current = 0, lastFocus = null;
  function show(i) {
    current = (i + shots.length) % shots.length;
    var b = shots[current];
    var img = b.querySelector('img');
    if (!lbImg.parentNode) lbCap.parentNode.insertBefore(lbImg, lbCap);
    lbImg.src = b.getAttribute('data-full');
    lbImg.alt = img ? img.alt : '';
    lbCap.textContent = b.getAttribute('data-cap') || '';
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    if (lb.open && typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
  }
  lb.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  });
  shots.forEach(function (b, i) { b.addEventListener('click', function () { openLb(i); }); });
  lb.querySelector('.lb-close').addEventListener('click', closeLb);
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') closeLb(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  /* ---------- Review rotator ---------- */
  var quotes = Array.prototype.slice.call(document.querySelectorAll('#quotes .quote'));
  var now = document.getElementById('rc-now');
  var total = document.getElementById('rc-total');
  var pauseBtn = document.querySelector('.ctl-pause');
  var bar = document.querySelector('.rotator-progress span');
  var rotator = document.querySelector('.rotator');
  var qi = 0, timer = null, userPaused = reduce, hoverPaused = false, DUR = 7000;
  total.textContent = String(quotes.length).padStart(2, '0');
  function pad(n) { return String(n).padStart(2, '0'); }
  function setQuote(i) {
    quotes[qi].classList.remove('is-active');
    qi = (i + quotes.length) % quotes.length;
    quotes[qi].classList.add('is-active');
    now.textContent = pad(qi + 1);
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    bar.classList.remove('run');
    if (userPaused || hoverPaused) return;
    void bar.offsetWidth;
    bar.style.setProperty('--dur', DUR + 'ms');
    bar.classList.add('run');
    timer = setTimeout(function () { setQuote(qi + 1); }, DUR);
  }
  function setPaused(p) {
    userPaused = p;
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.setAttribute('aria-label', p ? 'Play rotation' : 'Pause rotation');
    schedule();
  }
  // live region only announces on user-driven changes
  var live = document.getElementById('quotes');
  live.setAttribute('aria-live', 'off');
  document.querySelectorAll('.ctl[data-dir]').forEach(function (b) {
    b.addEventListener('click', function () {
      live.setAttribute('aria-live', 'polite');
      setQuote(qi + Number(b.getAttribute('data-dir')));
    });
  });
  pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });
  rotator.addEventListener('mouseenter', function () { hoverPaused = true; schedule(); });
  rotator.addEventListener('mouseleave', function () { hoverPaused = false; schedule(); });
  rotator.addEventListener('focusin', function () { hoverPaused = true; schedule(); });
  rotator.addEventListener('focusout', function (e) { if (!rotator.contains(e.relatedTarget)) { hoverPaused = false; schedule(); } });
  if (reduce) setPaused(true);
  // only rotate while visible
  if ('IntersectionObserver' in window) {
    var vis = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) schedule(); else { clearTimeout(timer); bar.classList.remove('run'); }
    });
    vis.observe(rotator);
  } else { schedule(); }

  /* ---------- Enquiry form: mailto builder + copy fallback ---------- */
  var EMAIL = 'sugarbarorillia@gmail.com';
  var form = document.getElementById('enquiry-form');
  var err = document.getElementById('form-error');
  var out = document.getElementById('form-out');
  var outText = document.getElementById('out-text');
  var outMail = document.getElementById('out-mail');
  var outCopy = document.getElementById('out-copy');
  var outStatus = document.getElementById('out-status');
  var dateInput = form.elements.namedItem('date');
  try { dateInput.min = new Date().toISOString().slice(0, 10); } catch (e) {}

  function val(name) { var el = form.elements.namedItem(name); return el ? el.value.trim() : ''; }
  function fmtDate(v) {
    if (!v) return '';
    var d = new Date(v + 'T12:00:00');
    return isNaN(d) ? v : d.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var required = ['name', 'contact', 'idea'];
    var missing = [];
    required.forEach(function (n) {
      var el = form.elements.namedItem(n);
      var bad = !el.value.trim();
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) missing.push(el);
    });
    if (missing.length) {
      err.textContent = 'Please add your name, a phone or email, and your idea.';
      err.hidden = false;
      missing[0].focus();
      return;
    }
    err.hidden = true;
    var occasion = val('occasion'), date = fmtDate(val('date'));
    var lines = [
      'Hi Mark,',
      '',
      "I'd like to enquire about an order.",
      '',
      'Name: ' + val('name'),
      'Phone/email: ' + val('contact'),
      'Date needed: ' + (date || 'Flexible / not sure yet'),
      'Occasion: ' + (occasion || '—'),
      'Servings: ' + (val('servings') || '—'),
      '',
      'My idea:',
      val('idea'),
      '',
      'Thanks!',
      val('name')
    ];
    var body = lines.join('\n');
    var subject = 'Cake enquiry' + (occasion ? ' — ' + occasion : '') + (date ? ' — ' + date : '');
    outText.value = 'To: ' + EMAIL + '\nSubject: ' + subject + '\n\n' + body;
    outMail.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    outStatus.textContent = '';
    out.hidden = false;
    document.getElementById('out-title').focus();
  });
  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
  });
  outCopy.addEventListener('click', function () {
    var text = outText.value;
    function fallback() {
      outText.focus(); outText.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      outStatus.textContent = ok ? 'Copied. Paste it into an email to ' + EMAIL + '.' : 'Select the text above and copy it, then email it to ' + EMAIL + '.';
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        outStatus.textContent = 'Copied. Paste it into an email to ' + EMAIL + '.';
      }, fallback);
    } else { fallback(); }
  });
})();
