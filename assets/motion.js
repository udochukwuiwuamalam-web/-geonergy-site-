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

  function start() {
    // The diagram. It gets its loop only on a device that can afford one,
    // and only while it is in view; otherwise it draws itself once, still.
    Array.prototype.forEach.call(doc.querySelectorAll('.flow'), fig => {
      if (!ambient) { fig.classList.add('is-still'); return; }
      watch(fig,
        () => fig.classList.add('is-live'),
        () => fig.classList.remove('is-live'));
    });

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
