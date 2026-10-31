/* EpiDetective site search: progressive enhancement of [data-search].
   Without this script the form is a GET to the cancer tool (q, lang).
   Index: assets/search/<page language>.json, fetched on the first focus
   (scripts/build_search_index.py). Every string comes from data-* attributes. */
(function () {
  'use strict';
  var LANGS = ['en', 'zh', 'fr', 'es', 'ru'], MAX = 12, QUOTA = [6, 4, 2], CACHE = {};
  var GROUP = {e: 0, c: 0, v: 0, r: 1, d: 1, s: 2}, RANK = 'cevdrs';
  var SEG = {e: 'exposure', c: 'cancer', r: 'risk', d: 'disease'};
  var NS = [0, 10, 40, 50, 60], AS = [0, 8, 25, 30, 55], GS = [0, 0, 12, 14, 18], NEAR = [4, 2, 0];
  var STOP = /^(the|and|for|are|can|does|what|how|why|with|from|that|this|les|des|une|pour|que|qui|los|las|una|por|con|del|sur|dans|avec|sans|est)$/;
  var WORD = /[\p{L}\p{N}]/u, CJK = /[\u2e80-\u9fff\uf900-\ufaff]/;

  function norm(s) {                       /* lower case, no accents, yo as ye, ligatures spelt out, one kind of apostrophe */
    return String(s).toLowerCase().replace(/\u0451/g, '\u0435').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0153/g, 'oe').replace(/\u00e6/g, 'ae').replace(/[\u2019\u2018\u00b4`]/g, "'");
  }
  function enc(s) {
    return encodeURIComponent(s).replace(/[!'()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); });
  }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o.hasOwnProperty(k) ? o[k] : m; }); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  }

  /* 4 equal, 3 starts with, 2 starts a word, 1 inside (4+ characters, or Chinese), 0 none */
  function tier(h, q, cjk) {
    var i = h.indexOf(q);
    if (i < 0) return 0;
    if (!i) return h === q ? 4 : 3;
    for (; i >= 0; i = h.indexOf(q, i + 1)) if (!WORD.test(h.charAt(i - 1))) return 2;
    return q.length > 3 || cjk ? 1 : 0;
  }
  function bag(h, toks) { return toks.every(function (t) { return tier(h, t, 0) > 1; }); }

  function score(o, q, toks, cjk, stem) {              /* o.N: names (full, without brackets); o.a: aliases; o.g: group words */
    var s, g = 0, m = 0, x = false, t, v, j;
    for (j = 0; j < o.N.length; j++) {
      t = tier(o.N[j][0], q, cjk);
      v = Math.max(t > 2 ? NS[t] : 0, NS[tier(o.N[j][1], q, cjk)]);     /* whole name, or the name without brackets */
      if (v > m) m = v;
      if (v === 60) x = true;
    }
    s = m;
    for (j = 0; j < o.a.length; j++) {
      t = tier(o.a[j], q, cjk);
      if (AS[t] > s) s = AS[t];
      if (t === 4) x = true;
    }
    if (!s && toks.length > 1) {                        /* every word of the query starts a word of one name or alias */
      s = o.N.some(function (n) { return bag(n[1], toks); }) ? 28 : o.a.some(function (a) { return bag(a, toks); }) ? 20 : 0;
    }
    if (!s && stem) {                                   /* word endings: the query minus its last two letters starts a word */
      s = o.N.some(function (n) { return tier(n[1], stem, 0) > 1; }) || o.a.some(function (a) { return tier(a, stem, 0) > 1; }) ? 15 : 0;
    }
    if (o.g.length && q.length > (cjk ? 1 : 2)) {       /* group words (a disease's body system): a match below every name and alias */
      for (j = 0; j < o.g.length; j++) { v = GS[tier(o.g[j], q, cjk)]; if (v > g) g = v; }
      if (!g && toks.length > 1 && o.g.some(function (w) { return bag(w, toks); })) g = 10;
      if (!g && stem && o.g.some(function (w) { return tier(w, stem, 0) > 1; })) g = 8;
    }
    return s || g ? {s: s > g ? s : g, d: s > 0, m: m, x: x, o: o} : null;
  }
  function cmp(a, b) {
    return b.s - a.s || b.m - a.m || RANK.indexOf(a.o.t) - RANK.indexOf(b.o.t) || b.o.k - a.o.k || a.o.n.length - b.o.n.length;
  }

  /* groups in order, at most MAX rows: quotas first, then the spare rows by group order */
  function search(idx, q) {
    var cjk = CJK.test(q), toks = q.split(' ').filter(function (t) { return t.length > 2 && !STOP.test(t); }),
        by, lead, n;
    function run(stem) {
      by = [[], [], []];
      lead = n = 0;
      idx.forEach(function (o) {
        var r = score(o, q, toks, cjk, stem);
        if (r) {
          by[GROUP[o.t]].push(r);
          if (r.d) n++;                                  /* a name or an alias matched */
          if (r.x && o.t === 's' && o.k) lead = 1;       /* a page that answers exactly this word */
        }
      });
    }
    if (q.length < (cjk ? 1 : 2)) return null;
    run('');
    if (!n && !cjk && q.length > 5) run(q.slice(0, -2));  /* no name or alias found: try the query without its ending */
    var order, take = [0, 0, 0], left = MAX;
    by.forEach(function (g) { g.sort(cmp); });
    function rank(g) { return (by[g].length ? by[g][0].s : 0) + NEAR[g]; }          /* best hit, nudged to the tools' order */
    order = [0, 1, 2].sort(function (a, b) { return (lead && (b === 2) - (a === 2)) || rank(b) - rank(a) || a - b; });
    order.forEach(function (g) { take[g] = Math.min(by[g].length, QUOTA[g]); left -= take[g]; });
    order.forEach(function (g) { var k = Math.min(by[g].length - take[g], left); take[g] += k; left -= k; });
    return order.filter(function (g) { return take[g]; }).map(function (g) { return {g: g, r: by[g].slice(0, take[g])}; });
  }

  function init(root) {
    var form = root.querySelector('form'), inp = root.querySelector('input[name=q]'),
        list = root.querySelector('[role=listbox]'), msg = root.querySelector('[role=status]'),
        lang = (root.getAttribute('data-lang') || document.documentElement.lang || 'en').slice(0, 2).toLowerCase(),
        tools = root.getAttribute('data-tools') || 'https://tools.epidetective.com',
        base = root.getAttribute('data-index') || '/assets/search/',
        idx, paths, busy, failed, opts = [], on = -1;
    if (!form || !inp || !list || !msg) return;
    if (LANGS.indexOf(lang) < 0) lang = 'en';
    function A(k) { return root.getAttribute('data-' + k) || ''; }

    function href(it) {
      var t = it[0], id = it[1];
      if (t === 's') return id;
      if (t === 'v') return tools + '/cancer/?lang=' + lang + '&q=' + enc(it[2]);
      var tool = t === 'e' || t === 'c' ? 'cancer' : 'chronic';
      return paths ? tools + '/' + tool + '/' + t + '/' + enc(id) + '?lang=' + lang
                   : tools + '/' + tool + '/?lang=' + lang + '#' + SEG[t] + '=' + enc(id);
    }
    function meta(it) {
      var t = it[0], m = [];
      if (t === 'e' || t === 'v') m.push(A('lbl-' + String(it[4]).toLowerCase()));
      else if (it[4]) m.push(it[4]);
      if (t === 'v') m.push(fill(A('lbl-eval'), {vol: it[5][0], year: it[5][1]}));
      else if ((t === 'c' || t === 'r' || t === 'd') && it[5]) m.push(fill(A('lbl-links'), {n: it[5]}));
      return m.filter(Boolean).join(' \u00b7 ');
    }

    function mark(i) {
      if (on >= 0 && opts[on]) { opts[on].classList.remove('is-active'); opts[on].setAttribute('aria-selected', 'false'); }
      on = i;
      if (i < 0) return inp.removeAttribute('aria-activedescendant');
      opts[i].classList.add('is-active');
      opts[i].setAttribute('aria-selected', 'true');
      inp.setAttribute('aria-activedescendant', opts[i].id);
      opts[i].scrollIntoView({block: 'nearest'});
    }
    function setOpen(b) {
      list.hidden = !b;
      inp.setAttribute('aria-expanded', b ? 'true' : 'false');
      if (!b) mark(-1);
    }
    function clear() { list.textContent = ''; opts = []; setOpen(false); }

    function show(res) {
      var n = 0, total = 0;
      res.forEach(function (g) { total += g.r.length; });
      list.textContent = '';
      opts = [];
      on = -1;
      inp.removeAttribute('aria-activedescendant');
      res.forEach(function (g) {
        var box = el('div'), h = el('div', 'search-gh', A(['group-cancer', 'group-chronic', 'group-site'][g.g]));
        h.id = list.id + '-g' + g.g;
        box.setAttribute('role', 'group');
        box.setAttribute('aria-labelledby', h.id);
        box.appendChild(h);
        g.r.forEach(function (r) {
          var it = r.o.it, a = el('a', 'search-opt'), m = meta(it);
          a.id = list.id + '-o' + n;
          a.href = href(it);
          a.tabIndex = -1;
          a.setAttribute('role', 'option');
          a.setAttribute('aria-selected', 'false');
          a.setAttribute('aria-posinset', ++n);
          a.setAttribute('aria-setsize', total);
          a.appendChild(el('span', 'search-n', it[2]));
          if (m) a.appendChild(el('span', 'search-m', m));
          box.appendChild(a);
          opts.push(a);
        });
        list.appendChild(box);
      });
      setOpen(true);
    }

    function update() {
      var q = norm(inp.value).replace(/\s+/g, ' ').trim(), res;
      msg.textContent = '';
      if (!q) return clear();
      if (!idx) { if (!failed) { load(); msg.textContent = A('loading'); } return; }
      res = search(idx, q);
      if (!res) return clear();
      if (!res.length) { clear(); msg.textContent = A('none'); return; }
      show(res);
    }

    function load() {
      var u = base + lang + '.json';
      if (idx || busy) return;
      busy = 1;
      (CACHE[u] = CACHE[u] || fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); })).then(function (d) {
        paths = d.routes === 'path';
        idx = d.items.map(function (it) {
          var a = [], gw = [], N = [];
          function name(t) {                              /* text in brackets is an alias */
            var f = norm(t), c = f.replace(/[(\uff08]([^)\uff09]*)[)\uff09]/g, function (m, g) { a.push(g.trim()); return ' '; });
            N.push([f, c.replace(/\s+/g, ' ').trim() || f]);
          }
          name(it[2]);
          it[3].forEach(function (x) {                    /* "=" marks another name, "~" a group word */
            var c = x.charAt(0);
            if (c === '=') name(x.slice(1)); else if (c === '~') gw.push(norm(x.slice(1))); else a.push(norm(x));
          });
          return {it: it, t: it[0], N: N, n: N[0][1], a: a, g: gw, k: typeof it[5] === 'number' ? it[5] : 0};
        });
        busy = 0;
        update();
      }, function () { delete CACHE[u]; busy = 0; failed = 1; msg.textContent = ''; });
    }

    inp.addEventListener('focus', function () { load(); if (opts.length) setOpen(true); });
    inp.addEventListener('blur', function () { setOpen(false); });
    inp.addEventListener('input', function (e) { if (!e.isComposing) update(); });
    inp.addEventListener('compositionend', update);
    inp.addEventListener('keydown', function (e) {
      var k = e.key, n = opts.length;
      if (e.isComposing) return;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        if (!n) return;
        e.preventDefault();
        if (list.hidden) setOpen(true);
        mark(on < 0 ? (k === 'ArrowDown' ? 0 : n - 1) : (on + (k === 'ArrowDown' ? 1 : n - 1)) % n);
      } else if (k === 'Escape') {
        if (!list.hidden) { setOpen(false); e.preventDefault(); }
        else if (inp.value) { inp.value = ''; update(); e.preventDefault(); }
      }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    list.addEventListener('click', function () { setOpen(false); });
    form.addEventListener('submit', function (e) {
      if (!inp.value.trim()) return e.preventDefault();
      if (opts.length) {                                    /* Enter or the button: the active row, else the first */
        e.preventDefault();
        var go = opts[on < 0 ? 0 : on].href;
        setOpen(false);
        location.assign(go);
      }
    });
    root.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-q]');
      if (c && root.contains(c)) { e.preventDefault(); inp.value = c.getAttribute('data-q'); inp.focus(); update(); }
    });
    document.addEventListener('click', function (e) { if (!root.contains(e.target)) setOpen(false); });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-search]'), init);
})();
