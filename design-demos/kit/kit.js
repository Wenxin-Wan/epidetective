/* EpiDetective design demos: shared toolkit.
   - Adds .js to <html> so reveal styles only apply when this script runs.
   - [data-reveal]            fade / rise / mask / scale in once, when 15% visible. Stagger with style="--d:120ms".
   - [data-split]             splits a heading into words that rise inside a mask, staggered. Keeps inline elements.
   - [data-parallax="0.12"]   translateY proportional to scroll (positive = slower than page).
   - [data-progress]          sets --p (0 to 1) as the element travels through the viewport; use it in CSS.
   - [data-count]             counts up to the number already written in the element when it appears.
   - Demo switcher            injected at the bottom of every demo.
   Everything is visible without JavaScript and with prefers-reduced-motion. */
(function () {
  "use strict";
  var DEMOS = [
    ["01-apothecary","Apothecary"],["02-sanctuary","Sanctuary"],["03-calibre","Calibre"],["04-verde","Verde"],
    ["05-fibre","Fibre"],["06-monochrome","Monochrome"],["07-aluminium","Aluminium"],["08-journal","Journal"],
    ["09-herbarium","Herbarium"],["10-urformen","Urformen"],["11-cyanotype","Cyanotype"],["12-kunstformen","Kunstformen"],
    ["13-fern-print","Fern Print"],["14-terrain","Terrain"],["15-understory","Understory"],["16-tide","Tide"],
    ["17-mineral","Mineral"],["18-ma","Ma"],["19-collection","Collection"],["20-laureate","Laureate"],
    ["21-cabinet","Cabinet"],["22-transactions","Transactions"],["23-observatory","Observatory"],["24-field-guide","Field Guide"],
    ["25-thousand","Thousand"],["26-populations","Populations"],["27-spectrum","Spectrum"],["28-charted","Charted"],
    ["29-index","Index"],["30-living-network","Living Network"]
  ];
  var root = document.documentElement;
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");
  if (still) root.classList.add("still");

  function ready(fn){ if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }

  ready(function () {
    /* word split: wrap every word of every text node, keeping inline elements */
    var wi = 0;
    document.querySelectorAll("[data-split]").forEach(function (el) {
      if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
      var base = parseInt(el.getAttribute("data-split-delay") || "0", 10), i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var w = document.createElement("span"); w.className = "kw"; w.setAttribute("aria-hidden", "true");
              var inner = document.createElement("span"); inner.className = "kwi"; inner.textContent = p;
              inner.style.transitionDelay = (base + i * 55) + "ms"; i++;
              w.appendChild(inner); frag.appendChild(w);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      })(el);
      el.setAttribute("data-reveal", el.getAttribute("data-reveal") || "split");
      wi++;
    });

    /* reveal once */
    var targets = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || still) {
      targets.forEach(function (t) { t.classList.add("is-in"); });
    } else {
      /* mask and wipe clip their element to nothing, which Chromium counts as never visible,
         so those two are observed through their parent and revealed together with it */
      var proxied = [];
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          proxied.forEach(function (p) { if (p[1] === e.target) p[0].classList.add("is-in"); });
          io.unobserve(e.target);
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
      targets.forEach(function (t) {
        var kind = t.getAttribute("data-reveal");
        if ((kind === "mask" || kind === "wipe") && t.parentElement) { proxied.push([t, t.parentElement]); io.observe(t.parentElement); }
        else io.observe(t);
      });
    }

    /* count up */
    var counters = document.querySelectorAll("[data-count]");
    if (counters.length && !still && "IntersectionObserver" in window) {
      var co = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return; co.unobserve(e.target);
          var el = e.target, txt = el.textContent, end = parseFloat(txt.replace(/[^0-9.]/g, "")), t0 = null, dur = 1400;
          if (!isFinite(end)) return;
          var fmt = function (v) { return Math.round(v).toLocaleString("en-GB"); };
          (function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
            el.textContent = txt.replace(/[0-9][0-9,]*/, fmt(end * ease)); if (k < 1) requestAnimationFrame(step); else el.textContent = txt; })(performance.now());
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { co.observe(c); });
    }

    /* scroll-linked: parallax and progress */
    var par = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    var prog = Array.prototype.slice.call(document.querySelectorAll("[data-progress]"));
    if ((par.length || prog.length) && !still) {
      var ticking = false;
      var update = function () {
        ticking = false; var vh = innerHeight;
        par.forEach(function (el) { var r = el.getBoundingClientRect(), k = parseFloat(el.getAttribute("data-parallax")) || 0.1;
          var c = r.top + r.height / 2 - vh / 2; el.style.transform = "translate3d(0," + (-c * k).toFixed(1) + "px,0)"; });
        prog.forEach(function (el) { var r = el.getBoundingClientRect(); var p = (vh - r.top) / (vh + r.height);
          el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4)); });
      };
      addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      addEventListener("resize", update); update();
    }

    /* demo switcher */
    var file = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
    var idx = -1; DEMOS.forEach(function (d, i) { if (d[0] === file) idx = i; });
    if (idx < 0 || document.querySelector(".kit-switch")) return;
    var prev = DEMOS[(idx + DEMOS.length - 1) % DEMOS.length], next = DEMOS[(idx + 1) % DEMOS.length];
    var nav = document.createElement("nav"); nav.className = "kit-switch"; nav.setAttribute("aria-label", "Design directions");
    nav.innerHTML = '<a class="ks-all" href="index.html">All 30 directions</a>' +
      '<a class="ks-arrow" href="' + prev[0] + '.html" aria-label="Previous: ' + prev[1] + '">&#8592;</a>' +
      '<span class="ks-now"><b>' + String(idx + 1).padStart(2, "0") + '</b> ' + DEMOS[idx][1] + '</span>' +
      '<a class="ks-arrow" href="' + next[0] + '.html" aria-label="Next: ' + next[1] + '">&#8594;</a>';
    document.body.appendChild(nav);
  });
})();
