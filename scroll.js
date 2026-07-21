/* Luxy-style inertial page scroll, matching the Cancer Evidence Explorer.
   The document keeps the real scrollbar; #page eases toward it each frame.

   Desktop only, and disabled under prefers-reduced-motion — same gate as the
   explorer. Without JavaScript (as on WordPress.com Simple) nothing here runs
   and the page falls back to CSS scroll-behavior:smooth, which still handles
   anchor links. Nothing below is required for the page to work. */
(function () {
  "use strict";

  var page = document.getElementById("page");
  var header = document.querySelector(".top");
  if (!page) return;

  var media = window.matchMedia(
    "(min-width:768px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)"
  );
  var SPEED = 0.065;
  var active = false, frame = 0, offset = window.scrollY;

  function headerHeight() {
    return header ? header.getBoundingClientRect().height : 0;
  }

  function refresh() {
    if (!active) return;
    // header sits outside the translated wrapper, so make room for it
    page.style.paddingTop = headerHeight() + "px";
    // ceil the fractional box height: scrollHeight rounds down, and losing even
    // a pixel here makes the bottom of the page unreachable
    document.body.style.height =
      Math.ceil(page.getBoundingClientRect().height) + "px";
  }

  var audit = 0;
  function render() {
    if (!active) return;
    var target = window.scrollY;
    offset += (target - offset) * SPEED;
    if (Math.abs(target - offset) < 0.05) offset = target;
    page.style.transform = "translate3d(0," + -offset.toFixed(3) + "px,0)";
    // Late-loading fonts and images can grow the page after the last refresh.
    // ResizeObserver usually catches it; this is the cheap belt-and-braces so
    // the scrollable height can never drift short of the content.
    if (++audit % 30 === 0) {
      var want = Math.ceil(page.getBoundingClientRect().height);
      if (Math.abs(want - parseFloat(document.body.style.height || 0)) > 1) {
        document.body.style.height = want + "px";
      }
    }
    frame = requestAnimationFrame(render);
  }

  function start() {
    if (active || !media.matches) return;
    active = true;
    offset = window.scrollY;
    document.documentElement.classList.add("inertia-scroll");
    refresh();
    render();
  }

  function stop() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(frame);
    document.documentElement.classList.remove("inertia-scroll");
    document.body.style.height = "";
    page.style.transform = "";
    page.style.paddingTop = "";
  }

  function sync() { media.matches ? start() : stop(); }

  if (media.addEventListener) media.addEventListener("change", sync);
  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("load", refresh, { once: true });
  try { new ResizeObserver(refresh).observe(page); } catch (e) {}
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

  /* Anchor links: while the wrapper is translated, getBoundingClientRect is
     relative to the eased position, so add the current offset back. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var hash = href.slice(href.indexOf("#"));
    if (hash.length < 2) return;
    // only intercept links pointing at this same document
    var base = href.slice(0, href.indexOf("#"));
    if (base && base !== location.pathname.split("/").pop()) return;

    var el = document.querySelector(hash);
    if (!el) return;
    e.preventDefault();

    if (active) {
      var top = Math.max(0, el.getBoundingClientRect().top + offset - headerHeight() - 16);
      window.scrollTo({ top: top, behavior: "auto" });
    } else {
      el.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }
    history.replaceState(null, "", hash);
  });

  start();
})();
