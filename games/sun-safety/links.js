/* Links from Sol & the UV Shield Quest to the rest of EpiDetective.
   The game is a React bundle (game.js, built from games-src/ in the project folder). This script leaves the bundle
   alone: whenever the title card or the finish card appears, it adds a bar of links above the card, so a rebuilt
   bundle keeps them. The bar sits outside the card, which scrolls on a small phone and would hide the links.
   Bar: the way back to the games page, the evidence behind the game for adults, and the reading guide.
   English only, like the game. */
(function () {
  'use strict';
  var root = document.getElementById('root');
  if (!root) return;
  var framed = self !== top;                       /* inside the games page's stage */
  var GAMES = '../../games.html';
  var READING = '../../reading.html';
  var EVIDENCE = 'https://tools.epidetective.com/cancer/?lang=en#exposure=Solar%20radiation';

  function link(href, text, cls, leave) {
    var a = document.createElement('a');
    a.href = href; a.textContent = text; a.className = cls;
    if (framed) {                                   /* links leave the frame: the games page replaces the page, the rest opens in a new tab */
      a.target = leave === 'top' ? '_top' : '_blank';
      if (leave !== 'top') a.rel = 'noopener';
    } else if (/^https?:/.test(href)) {
      a.rel = 'noopener';
    }
    return a;
  }
  function bar() {
    var d = document.createElement('div');
    d.className = 'gx-bar';
    d.appendChild(link(GAMES, '← EpiDetective games', 'gx-back', 'top'));
    var g = document.createElement('div');
    g.className = 'gx-adults';
    g.appendChild(link(EVIDENCE, 'For adults: the evidence behind this game →', 'gx-main'));
    g.appendChild(link(READING, 'Reading the evidence', 'gx-more'));
    d.appendChild(g);
    return d;
  }
  function scan() {
    var modals = root.querySelectorAll('.modal.title:not([data-gx]), .modal.victory:not([data-gx])');
    for (var i = 0; i < modals.length; i++) {
      var m = modals[i];
      m.setAttribute('data-gx', '1');
      m.classList.add('gx-modal');
      m.insertBefore(bar(), m.firstChild);
    }
  }
  new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  scan();
})();
