/* Sugar Dessert Bar · v2 "Party Mode" */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var EMAIL = "sugarbarorillia@gmail.com";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  function closeMenu() { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { closeMenu(); menuBtn.focus(); } });

  /* ---------- gallery filter + show more ---------- */
  var INITIAL = 12;
  var grid = document.getElementById("cake-grid");
  var items = Array.prototype.slice.call(grid.querySelectorAll(".g"));
  var pills = Array.prototype.slice.call(document.querySelectorAll(".pill"));
  var moreBtn = document.getElementById("show-more");
  var status = document.getElementById("filter-status");
  var current = "all";
  var expanded = false;

  function applyFilter() {
    var shown = 0, matching = 0;
    items.forEach(function (li) {
      var match = current === "all" || li.dataset.cat === current;
      if (match) matching++;
      var visible = match && (current !== "all" || expanded || matching <= INITIAL);
      li.classList.toggle("is-hidden", !visible);
      if (visible) shown++;
    });
    var remaining = matching - shown;
    moreBtn.hidden = remaining <= 0;
    moreBtn.textContent = "Show " + remaining + " more cakes";
    return shown;
  }
  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      current = pill.dataset.filter;
      pills.forEach(function (p) {
        var on = p === pill;
        p.classList.toggle("is-active", on);
        p.setAttribute("aria-pressed", String(on));
      });
      var n = applyFilter();
      status.textContent = "Showing " + n + " " + (current === "all" ? "cakes" : pill.textContent.trim().toLowerCase());
    });
  });
  moreBtn.addEventListener("click", function () {
    var firstNew = items.filter(function (li) { return li.classList.contains("is-hidden"); })[0];
    expanded = true;
    applyFilter();
    if (firstNew) { var b = firstNew.querySelector("button"); if (b) b.focus({ preventScroll: true }); }
  });
  applyFilter();

  /* ---------- lightbox ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.createElement("img");
  lbImg.id = "lb-img";
  var lbSlot = document.getElementById("lb-slot");
  var lbCap = document.getElementById("lb-cap");
  var lbPrev = document.getElementById("lb-prev");
  var lbNext = document.getElementById("lb-next");
  var list = [], idx = 0, opener = null;

  function entryFrom(btn) {
    var img = btn.querySelector("img");
    return {
      src: btn.dataset.full || img.getAttribute("src"),
      alt: img.getAttribute("alt"),
      cap: btn.dataset.cap || (btn.querySelector(".card__cap") || {}).textContent || img.getAttribute("alt")
    };
  }
  function show(i) {
    idx = (i + list.length) % list.length;
    var e = list[idx];
    if (!lbImg.parentNode) lbSlot.appendChild(lbImg);
    lbImg.src = e.src; lbImg.alt = e.alt; lbCap.textContent = e.cap;
    var multi = list.length > 1;
    lbPrev.hidden = !multi; lbNext.hidden = !multi;
  }
  function openLb(btns, i, from) {
    list = btns.map(entryFrom); opener = from;
    show(i);
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    document.body.style.overflow = "hidden";
  }
  function closeLb() { if (lb.open) lb.close(); }
  lb.addEventListener("close", function () { document.body.style.overflow = ""; if (opener) opener.focus(); });

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".card"); if (!btn) return;
    var visible = items.filter(function (li) { return !li.classList.contains("is-hidden"); }).map(function (li) { return li.querySelector(".card"); });
    openLb(visible, visible.indexOf(btn), btn);
  });
  var cert = document.querySelector(".award__cert");
  if (cert) cert.addEventListener("click", function () { openLb([cert], 0, cert); });

  document.getElementById("lb-close").addEventListener("click", closeLb);
  lbPrev.addEventListener("click", function () { show(idx - 1); });
  lbNext.addEventListener("click", function () { show(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  lb.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });

  /* ---------- prefill from "what we make" ---------- */
  var form = document.getElementById("enquiry");
  var field = function (n) { return form.elements.namedItem(n); };
  document.querySelectorAll("[data-prefill]").forEach(function (a) {
    a.addEventListener("click", function () {
      var idea = field("idea");
      var tag = "I'm interested in: " + a.dataset.prefill + ".\n";
      if (idea.value.indexOf(tag) === -1) idea.value = tag + idea.value;
    });
  });

  /* ---------- enquiry builder ---------- */
  var errBox = document.getElementById("form-err");
  var out = document.getElementById("out");
  var outMsg = document.getElementById("out-msg");
  var outMailto = document.getElementById("out-mailto");
  var copyStatus = document.getElementById("copy-status");
  var lastMessage = "", lastSubject = "";

  function niceDate(v) {
    if (!v) return "";
    var d = new Date(v + "T12:00:00");
    if (isNaN(d)) return v;
    return d.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var required = ["name", "contact", "idea"];
    var missing = [];
    required.forEach(function (n) {
      var el = field(n);
      var bad = !el.value.trim();
      el.setAttribute("aria-invalid", String(bad));
      if (bad) missing.push(el);
    });
    if (missing.length) {
      var names = { name: "your name", contact: "a phone number or email", idea: "your cake idea" };
      var labels = missing.map(function (el) { return names[el.name]; });
      errBox.textContent = "Almost! Please add " + labels.join(", ").replace(/, ([^,]*)$/, " and $1") + ".";
      errBox.hidden = false;
      out.hidden = true;
      missing[0].focus();
      return;
    }
    errBox.hidden = true;

    var name = field("name").value.trim();
    var contact = field("contact").value.trim();
    var date = niceDate(field("date").value);
    var occasion = field("occasion").value;
    var servings = field("servings").value.trim();
    var idea = field("idea").value.trim();

    lastSubject = "Cake enquiry" + (occasion ? ": " + occasion : "") + (date ? " (" + date + ")" : "") + " from " + name;
    var lines = [
      "Hi Mark,",
      "",
      "I'd love to order from Sugar Dessert Bar. Here are my details:",
      "",
      "Name: " + name,
      "Phone / email: " + contact,
      "Date needed: " + (date || "Not sure yet"),
      "Occasion: " + (occasion || "Not specified"),
      "Servings: " + (servings || "Not sure yet"),
      "",
      "My idea:",
      idea,
      "",
      "Thanks!",
      name
    ];
    lastMessage = lines.join("\n");
    outMsg.textContent = "To: " + EMAIL + "\nSubject: " + lastSubject + "\n\n" + lastMessage;
    outMailto.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(lastSubject) + "&body=" + encodeURIComponent(lastMessage);
    copyStatus.textContent = "";
    out.hidden = false;
    out.focus({ preventScroll: true });
    out.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  });
  form.addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid") === "true" && e.target.value.trim()) e.target.setAttribute("aria-invalid", "false");
  });

  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      copyStatus.textContent = ok ? okMsg : "Couldn't copy automatically. Select the message above and copy it by hand.";
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { copyStatus.textContent = okMsg; }, fallback);
    } else { fallback(); }
  }
  document.getElementById("copy-msg").addEventListener("click", function () {
    copyText("Subject: " + lastSubject + "\n\n" + lastMessage, "Copied! Paste it into an email to " + EMAIL + " (or a DM).");
  });
  document.getElementById("copy-addr").addEventListener("click", function () {
    copyText(EMAIL, "Email address copied: " + EMAIL);
  });

  /* ---------- gentle reveal ---------- */
  var revealEls = document.querySelectorAll(".sec-head, .make__list, .bubbles, .steps__list, .tickets, .form, .awards__list, .mark__copy");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
