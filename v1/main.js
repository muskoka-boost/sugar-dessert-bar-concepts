/* Sugar Dessert Bar — v1 "The Atelier" */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pad = n => String(n).padStart(2, '0');

  /* Masthead state */
  const head = $('.masthead');
  const onScroll = () => head.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile navigation */
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  const setNav = open => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    $('.nav__toggle-label', toggle).textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  $$('.nav__list a').forEach(a => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches) setNav(false); });

  /* Calm reveal on scroll */
  const reveals = $$('.reveal');
  if (reduced.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el, i) => {
      // gentle stagger for siblings revealed together
      const sibs = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [];
      const idx = sibs.indexOf(el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx, 5) * 110 + 'ms';
      io.observe(el);
    });
  }

  /* Smooth scroll helper that honours reduced motion */
  const behavior = () => (reduced.matches ? 'auto' : 'smooth');

  /* Portfolio reel */
  const reel = $('[data-reel]');
  if (reel) {
    const items = $$('.reel__item', reel);
    const cur = $('[data-count-current]');
    $('[data-count-total]').textContent = pad(items.length);
    const step = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : reel.clientWidth);
    const prevBtn = $('[data-scroll="-1"]');
    const nextBtn = $('[data-scroll="1"]');
    const update = () => {
      const i = Math.round(reel.scrollLeft / step());
      cur.textContent = pad(Math.min(items.length, i + 1));
      prevBtn.disabled = reel.scrollLeft < 4;
      nextBtn.disabled = reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 4;
    };
    $$('[data-scroll]').forEach(b => b.addEventListener('click', () => {
      const dir = Number(b.dataset.scroll);
      const n = Math.max(1, Math.floor(reel.clientWidth / step()) - 1);
      reel.scrollBy({ left: dir * step() * n, behavior: behavior() });
    }));
    reel.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Lightbox */
  const lb = $('[data-lightbox]');
  const lbImg = document.createElement('img');
  lbImg.decoding = 'async';
  let lbMounted = false;
  const lbCap = $('[data-lightbox-cap]');
  const triggers = $$('[data-full]');
  let lbIndex = 0, lastFocus = null;
  const captionFor = btn => {
    const cap = btn.closest('.reel__item') ? $('.reel__cap', btn.closest('.reel__item')) : null;
    if (cap) return cap.lastChild.textContent.trim();
    return $('img', btn).alt;
  };
  const show = i => {
    lbIndex = (i + triggers.length) % triggers.length;
    const t = triggers[lbIndex];
    const img = $('img', t);
    lbImg.src = t.dataset.full;
    if (!lbMounted) { $('.lightbox__frame', lb).prepend(lbImg); lbMounted = true; }
    lbImg.alt = img ? img.alt : '';
    lbCap.textContent = captionFor(t) + '  ·  ' + pad(lbIndex + 1) + ' / ' + pad(triggers.length);
  };
  const openLb = i => {
    lastFocus = document.activeElement;
    show(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.body.classList.add('lb-open');
    $('[data-lightbox-close]').focus();
  };
  const closeLb = () => {
    if (lb.open && typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
  };
  lb.addEventListener('close', () => {
    document.body.classList.remove('lb-open');
    if (lastFocus) lastFocus.focus();
  });
  triggers.forEach((t, i) => t.addEventListener('click', () => openLb(i)));
  $('[data-lightbox-close]').addEventListener('click', closeLb);
  $$('[data-lightbox-step]').forEach(b => b.addEventListener('click', () => show(lbIndex + Number(b.dataset.lightboxStep))));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__frame')) closeLb(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(lbIndex + 1);
    if (e.key === 'ArrowLeft') show(lbIndex - 1);
  });

  /* Reviews slider (native scroll-snap, enhanced) */
  const track = $('[data-quotes-track]');
  if (track) {
    const slides = $$('.quote', track);
    const cur = $('[data-quote-current]');
    $('[data-quote-total]').textContent = pad(slides.length);
    const idx = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = i => {
      const n = (i + slides.length) % slides.length;
      track.scrollTo({ left: n * track.clientWidth, behavior: behavior() });
    };
    $$('[data-quote-step]').forEach(b => b.addEventListener('click', () => go(idx() + Number(b.dataset.quoteStep))));
    track.addEventListener('scroll', () => requestAnimationFrame(() => { cur.textContent = pad(idx() + 1); }), { passive: true });
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); }
    });
  }

  /* Enquiry form → mailto builder with copy fallback */
  const form = $('#enquiry-form');
  const EMAIL = 'sugarbarorillia@gmail.com';
  const field = n => form.elements.namedItem(n);

  $$('[data-occasion]').forEach(a => a.addEventListener('click', () => {
    const sel = field('occasion');
    const want = a.dataset.occasion;
    const opt = [...sel.options].find(o => o.value === want || o.text === want);
    if (opt) sel.value = opt.value || opt.text;
  }));

  const fmtDate = v => {
    if (!v) return '';
    const d = new Date(v + 'T12:00:00');
    return isNaN(d) ? v : d.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const buildMessage = () => {
    const v = n => (field(n).value || '').trim();
    const occasion = v('occasion');
    const subject = 'Cake enquiry' + (occasion ? ' — ' + occasion : '') + (v('date') ? ' — ' + fmtDate(v('date')) : '');
    const lines = [
      'Hello Mark,',
      '',
      "I'd love to talk about a custom order.",
      '',
      'Name: ' + v('name'),
      'Phone or email: ' + v('contact'),
      'Date needed: ' + (fmtDate(v('date')) || 'Not sure yet'),
      'Occasion: ' + (occasion || 'Not specified'),
      'Servings (approx.): ' + (v('servings') || 'Not sure yet'),
      '',
      'My idea:',
      v('idea'),
      '',
      'Thank you!',
      v('name')
    ];
    return { subject, body: lines.join('\n') };
  };

  const errorEl = $('[data-form-error]');
  const out = $('[data-output]');
  const outText = $('#f-output');
  const outStatus = $('[data-output-status]');
  const mailLink = $('[data-mailto]');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const required = ['name', 'contact', 'idea'];
    const missing = required.filter(n => !field(n).value.trim());
    required.forEach(n => field(n).setAttribute('aria-invalid', String(missing.includes(n))));
    if (missing.length) {
      const labels = { name: 'your name', contact: 'a phone number or email', idea: 'a few words about your idea' };
      errorEl.textContent = 'Please add ' + missing.map(n => labels[n]).join(', ') + '.';
      errorEl.hidden = false;
      field(missing[0]).focus();
      return;
    }
    errorEl.hidden = true;
    const { subject, body } = buildMessage();
    const href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body.replace(/\n/g, '\r\n'));
    mailLink.href = href;
    outText.value = 'To: ' + EMAIL + '\nSubject: ' + subject + '\n\n' + body;
    outStatus.textContent = 'Your message is ready. We’re opening your email app — if nothing appears, copy the message below and send it to ' + EMAIL + '.';
    out.hidden = false;
    try { window.location.href = href; } catch (_) { /* fallback stays visible */ }
    out.scrollIntoView({ behavior: behavior(), block: 'nearest' });
  });

  const copy = async (text, btn, done) => {
    const original = btn.textContent;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (__) { ok = false; }
      ta.remove();
    }
    btn.textContent = ok ? done : 'Select & copy manually';
    if (!ok) { outText.focus(); outText.select(); }
    setTimeout(() => { btn.textContent = original; }, 2400);
  };
  $('[data-copy]').addEventListener('click', e => copy(outText.value, e.currentTarget, 'Message copied'));
  $('[data-copy-address]').addEventListener('click', e => copy(EMAIL, e.currentTarget, 'Address copied'));
})();
