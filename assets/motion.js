/* Geonergy motion controller.

   Two jobs, both about NOT running animation:

   1. Decide whether this device can afford the ambient pieces - the slow
      drift on the hero photograph and the looping energy diagram. A cheap
      Android with two cores and a gigabyte of RAM is the phone this site is
      built for, and a loop that never stops is exactly what makes one feel
      sluggish and eat battery. Capable devices get the full thing, the rest
      get the still version, which says the same thing.

   2. Run the diagram only while it is actually on screen. An animation
      ticking away in a section nobody is looking at is pure cost.

   Everything here is additive: with the script missing or broken the page
   renders complete and still, because every animation starts from the
   finished state until a class is added.
*/
(function (global) {
  'use strict';

  const doc = global.document;
  const root = doc.documentElement;

  const calm = () => !!(global.matchMedia &&
    global.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // The house heuristic: little memory, or few cores on a browser that will
  // not tell us about memory. Unknown is treated as capable, since most
  // desktops do not report deviceMemory either.
  function lowEnd() {
    const nav = global.navigator;
    if (!nav) return false;
    if (typeof nav.deviceMemory === 'number') return nav.deviceMemory <= 2;
    if (typeof nav.hardwareConcurrency === 'number') return nav.hardwareConcurrency <= 4;
    return false;
  }

  // A phone on a metered 3G connection has better uses for its battery.
  function saving() {
    const c = global.navigator && global.navigator.connection;
    if (!c) return false;
    return !!c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
  }

  const ambient = !calm() && !lowEnd() && !saving();
  if (ambient) root.classList.add('motion-ok');

  function watch(el, onIn, onOut) {
    if (!global.IntersectionObserver) { onIn(); return; }
    const obs = new global.IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? onIn() : onOut && onOut()));
    }, { threshold: 0.2 });
    obs.observe(el);
  }

  // ---------------------------------------------------------------
  // RE-RENDER ENTRANCES
  // A container marked data-motion-enter replays a short entrance each
  // time its contents are replaced. Watching the DOM rather than calling
  // into each page's render function keeps every page's own logic exactly
  // as it was - they gained an attribute, not a dependency.
  // ---------------------------------------------------------------
  function enterOn(el) {
    let queued = false;
    const replay = () => {
      queued = false;
      el.classList.remove('m-in');
      // Reading offsetWidth forces the style change to land, so removing
      // and re-adding the class actually restarts the animation.
      void el.offsetWidth;
      el.classList.add('m-in');
    };
    const obs = new global.MutationObserver(() => {
      // A render can touch the DOM several times; coalesce into one replay.
      if (queued) return;
      queued = true;
      global.requestAnimationFrame(replay);
    });
    obs.observe(el, { childList: true });
    if (el.children.length) el.classList.add('m-in');
  }

  // ---------------------------------------------------------------
  // COUNTING NUMBERS
  // The production calculator's figures change when the weather, the
  // panel count or the town changes. Counting to the new number shows
  // that something was recalculated; a figure that silently swaps is
  // easy to miss, especially the small ones.
  // ---------------------------------------------------------------
  const busy = typeof WeakSet === 'function' ? new WeakSet() : null;

  function countOn(el) {
    const dp = el.getAttribute('data-m-count') === 'int' ? 0 : 1;
    let last = parseFloat(el.textContent);
    if (!isFinite(last)) last = 0;

    const obs = new global.MutationObserver(() => {
      if (busy && busy.has(el)) return;
      const to = parseFloat(el.textContent);
      // Already where we are going - including the write that ends a run,
      // which is what stops this feeding itself.
      if (!isFinite(to) || to === last) return;
      const from = last;
      last = to;
      if (busy) busy.add(el);
      const started = (global.performance || Date).now();
      const span = 650;
      (function tick() {
        const t = Math.min(((global.performance || Date).now() - started) / span, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (from + (to - from) * eased).toFixed(dp);
        if (t < 1) global.requestAnimationFrame(tick);
        else if (busy) global.setTimeout(() => busy.delete(el), 0);
      })();
    });
    obs.observe(el, { childList: true, characterData: true, subtree: true });
  }

  function start() {
    // The diagram. It gets its loop only on a device that can afford one,
    // and only while it is in view; otherwise it draws itself once, still.
    Array.prototype.forEach.call(doc.querySelectorAll('.flow'), fig => {
      if (!ambient) { fig.classList.add('is-still'); return; }
      watch(fig,
        () => fig.classList.add('is-live'),
        () => fig.classList.remove('is-live'));
    });

    // Containers that replay an entrance when their contents change.
    if (global.MutationObserver) {
      Array.prototype.forEach.call(doc.querySelectorAll('[data-motion-enter]'), enterOn);
      // Counting is movement for its own sake when somebody has asked for
      // less of it, so the figure just changes.
      if (!calm()) Array.prototype.forEach.call(doc.querySelectorAll('[data-m-count]'), countOn);
    }

    // The reveal variants this file adds. The page's own observer only knows
    // about .reveal, so these get their own, with the same contract: add
    // .visible once, and never take it away.
    const extra = doc.querySelectorAll('.reveal-left, .reveal-right, .reveal-scale, .reveal-stagger');
    if (!extra.length) return;
    if (!global.IntersectionObserver) {
      Array.prototype.forEach.call(extra, el => el.classList.add('visible'));
      return;
    }
    const obs = new global.IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(extra, el => obs.observe(el));
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

  global.GeonergyMotion = { ambient: ambient, lowEnd: lowEnd, calm: calm };
})(window);
