/**
 * Art Forum Hair — lightbox
 * =========================
 *
 * Replaces jQuery Magnific Popup, which CodeQL flagged three times under
 * `js/unsafe-jquery-plugin`: it funnels plugin options (`closeMarkup`,
 * `markup`, `prependTo`) straight into `$(...)` / `.prependTo(...)`, so any
 * option reaching it from an untrusted source becomes HTML injection. The
 * library is unmaintained, so the options are removed rather than patched.
 *
 * This implementation never parses HTML strings — every node is built with
 * `createElement` and every piece of text is assigned via `textContent`, so
 * there is no path from page content to markup parsing.
 *
 * Features: grouped galleries, keyboard (Esc / arrows), swipe, neighbour
 * preloading, focus restore, and `prefers-reduced-motion` support.
 */
(function () {
  'use strict';

  var SELECTOR =
    'a.image-popup, a[href$=".jpg"], a[href$=".jpeg"], a[href$=".JPG"], ' +
    'a[href$=".png"], a[href$=".gif"], a[href$=".webp"]';

  var dialog = null;
  var els = {};
  var group = [];
  var index = 0;
  var lastFocused = null;
  var touchStartX = null;

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Build the dialog once, entirely via DOM APIs (no HTML strings). */
  function build() {
    if (dialog) return;

    dialog = document.createElement('dialog');
    dialog.className = 'afh-lightbox';
    dialog.setAttribute('aria-label', document.documentElement.lang === 'bg' ? 'Галерия' : 'Image gallery');

    var figure = document.createElement('figure');
    figure.className = 'afh-lightbox__figure';

    els.img = document.createElement('img');
    els.img.className = 'afh-lightbox__img';
    els.img.decoding = 'async';
    figure.appendChild(els.img);

    els.caption = document.createElement('figcaption');
    els.caption.className = 'afh-lightbox__caption';
    figure.appendChild(els.caption);

    els.close = button('afh-lightbox__btn afh-lightbox__close', '\u00D7', 'Close');
    els.prev = button('afh-lightbox__btn afh-lightbox__prev', '\u2039', 'Previous image');
    els.next = button('afh-lightbox__btn afh-lightbox__next', '\u203A', 'Next image');

    els.counter = document.createElement('p');
    els.counter.className = 'afh-lightbox__counter';

    dialog.append(els.close, els.prev, figure, els.next, els.counter);
    document.body.appendChild(dialog);

    els.close.addEventListener('click', close);
    els.prev.addEventListener('click', function () { step(-1); });
    els.next.addEventListener('click', function () { step(1); });

    // Clicking the backdrop (i.e. the dialog itself, not its children) closes.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close();
    });

    dialog.addEventListener('cancel', function () { restoreFocus(); });
    dialog.addEventListener('keydown', onKeydown);
    dialog.addEventListener('touchstart', onTouchStart, { passive: true });
    dialog.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  function button(className, glyph, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = glyph;         // textContent, never innerHTML
    b.setAttribute('aria-label', label);
    return b;
  }

  function onKeydown(e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  }

  function onTouchStart(e) {
    touchStartX = e.changedTouches && e.changedTouches.length ? e.changedTouches[0].clientX : null;
  }

  function onTouchEnd(e) {
    if (touchStartX === null || !e.changedTouches || !e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }

  /** Best-effort description for the current item, as plain text. */
  function describe(link) {
    var img = link.querySelector('img');
    return link.getAttribute('title') || (img && img.getAttribute('alt')) || '';
  }

  function show(i) {
    if (!group.length) return;
    index = (i + group.length) % group.length;

    var link = group[index];
    var text = describe(link);

    els.img.src = link.href;
    els.img.alt = text;

    els.caption.textContent = text;              // textContent, never innerHTML
    els.caption.hidden = text === '';

    var many = group.length > 1;
    els.prev.hidden = !many;
    els.next.hidden = !many;
    els.counter.hidden = !many;
    if (many) els.counter.textContent = index + 1 + ' / ' + group.length;

    preload(index + 1);
    preload(index - 1);
  }

  function preload(i) {
    if (group.length < 2) return;
    var link = group[(i + group.length) % group.length];
    var img = new Image();
    img.src = link.href;
  }

  function step(delta) {
    show(index + delta);
  }

  function restoreFocus() {
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }

  function close() {
    if (dialog && dialog.open) dialog.close();
    if (els.img) els.img.removeAttribute('src');
    document.documentElement.classList.remove('afh-lightbox-open');
    restoreFocus();
  }

  function open(link) {
    build();

    // Group siblings inside the same figure/gallery so arrows walk that set.
    var scope = link.closest('figure') || link.closest('.page__content') || document;
    group = Array.prototype.filter.call(
      scope.querySelectorAll(SELECTOR),
      function (a) { return a.querySelector('img'); }
    );
    if (group.indexOf(link) === -1) group = [link];

    lastFocused = document.activeElement;
    show(group.indexOf(link));

    document.documentElement.classList.add('afh-lightbox-open');
    if (reducedMotion()) dialog.classList.add('afh-lightbox--instant');

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');     // very old browsers: inline fallback

    els.close.focus();
  }

  function init() {
    // Tag qualifying links so they can be styled, matching the old behaviour.
    document.querySelectorAll(SELECTOR).forEach(function (a) {
      if (a.querySelector('img')) a.classList.add('image-popup');
    });

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var link = e.target.closest ? e.target.closest(SELECTOR) : null;
      if (!link || !link.querySelector('img')) return;
      if (!('showModal' in document.createElement('dialog'))) return; // no <dialog>: follow the link

      e.preventDefault();
      open(link);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

