// Geonergy weather and safety watch.
//
// Watches the forecast over the site where a system is INSTALLED - saved on
// the device once - rather than wherever the person reading the page happens
// to be standing. An owner in Abuja checking on a roof in Owerri is the
// normal case, not the edge case.
//
// It raises an early warning for the four things that put a rooftop system,
// and anyone who might go up to it, at risk: thunderstorms, lightning,
// high wind and heavy rain.
//
// It is an early warning and nothing more. It does not switch anything off,
// it cannot see the sky over one particular roof, and public forecasts miss
// storms. Every string in here is written to say so - please keep it that
// way if you edit them.
//
// Weather comes from Open-Meteo, on Geonergy's commercial plan. The endpoint
// and key live in assets/weather-api.js, which this file needs loaded first;
// the production calculator on this page goes through the same place.
(function (global) {
  'use strict';

  const LEVEL = { NORMAL: 0, WARNING: 1, SEVERE: 2 };
  const LEVEL_NAME = ['Normal', 'Weather warning', 'Severe weather'];
  const LEVEL_CLASS = ['is-normal', 'is-warning', 'is-severe'];

  // Thunderstorm codes in the WMO table Open-Meteo reports:
  // 95 thunderstorm, 96 with slight hail, 99 with heavy hail.
  const STORM_CODES = [95, 96, 99];

  // Thresholds. Panels themselves are rated far above these wind speeds —
  // what these numbers are really about is loose mounting, flying debris,
  // water finding its way in, and nobody having any business on a roof.
  // Deliberately cautious: an early warning that fires a little early is
  // doing its job, one that fires late is not.
  const T = {
    gustSevere: 60,        // km/h
    gustWarn: 40,
    rainSevere: 20,        // mm inside one hour
    rainWarn: 7.5,
    capeWarn: 2000,        // J/kg — unstable enough to build storms,
    popWithCape: 60,       // % — but only counted when rain is likely too
    stormSevereHours: 3,   // a storm this close is "approaching", not "later"
    windowHours: 12        // how far ahead we look
  };

  const REFRESH_MS = 15 * 60 * 1000;
  const STALE_MS = 20 * 60 * 1000;

  const KEY_SITE = 'geonergy.watch.site';
  const KEY_CHANNELS = 'geonergy.watch.channels';

  const $ = id => document.getElementById(id);
  const num = (arr, i) => (Array.isArray(arr) && arr[i] != null ? Number(arr[i]) : 0);
  const fmt1 = n => (Math.round(n * 10) / 10).toString();

  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }
  function recall(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }

  // ---------------------------------------------------------------
  // READING THE FORECAST
  // ---------------------------------------------------------------

  // timezone=auto matters: every time in the response is then local to the
  // SITE, so "4 PM" means 4 PM on that roof, whatever clock the reader is on.
  // The host and the commercial key come from assets/weather-api.js.
  function forecastUrl(lat, lon) {
    return global.GeonergyWeather.forecastUrl({
      latitude: Number(lat).toFixed(4),
      longitude: Number(lon).toFixed(4),
      current: 'weather_code,wind_speed_10m,wind_gusts_10m,precipitation,temperature_2m',
      hourly: 'weather_code,wind_gusts_10m,precipitation,precipitation_probability,cape',
      forecast_days: 2,
      timezone: 'auto'
    });
  }

  async function fetchForecast(lat, lon) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(forecastUrl(lat, lon), { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || !data.hourly || !Array.isArray(data.hourly.time)) {
        throw new Error('unexpected response shape');
      }
      return data;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  function hourLabel(iso, today) {
    const h = Number(iso.slice(11, 13));
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (h < 12 ? ' AM' : ' PM') + (iso.slice(0, 10) === today ? '' : ' tomorrow');
  }

  // ---------------------------------------------------------------
  // THE RISK CALL
  //
  // Kept as one pure function of the API response so it can be exercised
  // against made-up forecasts without a browser or a network.
  // ---------------------------------------------------------------
  function assess(data) {
    const cur = (data && data.current) || {};
    const h = (data && data.hourly) || {};
    const times = h.time || [];
    const nowIso = cur.time || times[0] || '';
    const today = nowIso.slice(0, 10);

    let start = times.findIndex(t => t >= nowIso);
    if (start < 0) start = 0;

    const win = [];
    for (let i = start; i < times.length && win.length < T.windowHours; i++) {
      win.push({
        iso: times[i],
        ahead: win.length,
        code: num(h.weather_code, i),
        gust: num(h.wind_gusts_10m, i),
        rain: num(h.precipitation, i),
        pop: num(h.precipitation_probability, i),
        cape: num(h.cape, i)
      });
    }

    const risks = [];
    lightningRisk(cur, win, today, risks);
    windRisk(cur, win, today, risks);
    rainRisk(cur, win, today, risks);

    const level = risks.reduce((m, r) => Math.max(m, r.level), LEVEL.NORMAL);
    risks.sort((a, b) => b.level - a.level);
    return { level: level, risks: risks, at: nowIso, timezone: (data && data.timezone) || '' };
  }

  function lightningRisk(cur, win, today, out) {
    if (STORM_CODES.indexOf(Number(cur.weather_code)) >= 0) {
      out.push({ kind: 'lightning', level: LEVEL.SEVERE,
                 text: 'Thunderstorm over the site right now. Lightning risk.' });
      return;
    }
    const hit = win.find(r => STORM_CODES.indexOf(r.code) >= 0);
    if (hit) {
      out.push({ kind: 'lightning',
                 level: hit.ahead <= T.stormSevereHours ? LEVEL.SEVERE : LEVEL.WARNING,
                 text: 'Thunderstorm forecast '
                       + (hit.ahead <= 0 ? 'within the hour' : 'around ' + hourLabel(hit.iso, today))
                       + '. Lightning risk.' });
      return;
    }
    // No storm in the forecast itself, but the air is primed for one. This
    // is the case the hourly code misses most often, so it earns a warning
    // of its own rather than a silent "normal".
    const build = win.find(r => r.cape >= T.capeWarn && r.pop >= T.popWithCape);
    if (build) {
      out.push({ kind: 'lightning', level: LEVEL.WARNING,
                 text: 'Air unstable enough for storms to build around '
                       + hourLabel(build.iso, today) + '.' });
    }
  }

  function windRisk(cur, win, today, out) {
    let worst = { gust: Number(cur.wind_gusts_10m) || 0, iso: null, ahead: 0 };
    win.forEach(r => { if (r.gust > worst.gust) worst = { gust: r.gust, iso: r.iso, ahead: r.ahead }; });
    if (worst.gust < T.gustWarn) return;
    const when = !worst.iso ? 'right now'
               : worst.ahead <= 0 ? 'within the hour'
               : 'by ' + hourLabel(worst.iso, today);
    out.push({ kind: 'wind',
               level: worst.gust >= T.gustSevere ? LEVEL.SEVERE : LEVEL.WARNING,
               text: 'Gusts to ' + Math.round(worst.gust) + ' km/h ' + when + '.' });
  }

  function rainRisk(cur, win, today, out) {
    let worst = { mm: Number(cur.precipitation) || 0, iso: null, ahead: 0 };
    win.forEach(r => { if (r.rain > worst.mm) worst = { mm: r.rain, iso: r.iso, ahead: r.ahead }; });
    if (worst.mm < T.rainWarn) return;
    const when = !worst.iso ? 'falling now'
               : worst.ahead <= 0 ? 'in the next hour'
               : 'in the hour to ' + hourLabel(worst.iso, today);
    out.push({ kind: 'rain',
               level: worst.mm >= T.rainSevere ? LEVEL.SEVERE : LEVEL.WARNING,
               text: 'Heavy rain — about ' + fmt1(worst.mm) + ' mm ' + when + '.' });
  }

  // The severe wording is the customer's own words, kept verbatim on purpose:
  // it is the line they will read at 4 PM with a storm coming.
  function summarise(level) {
    if (level === LEVEL.SEVERE) {
      return { headline: 'Severe weather approaching',
               message: 'Severe weather approaching. Follow your system shutdown procedure and contact Geonergy.' };
    }
    if (level === LEVEL.WARNING) {
      return { headline: 'Weather warning',
               message: 'Rough weather is building near your site. Keep an eye on it and be ready to follow your shutdown procedure.' };
    }
    return { headline: 'Normal',
             message: 'Nothing severe in the forecast for this site over the next 12 hours.' };
  }

  // ---------------------------------------------------------------
  // THE WATCH UI
  // ---------------------------------------------------------------
  function init(opts) {
    const cities = (opts && opts.cities) || [];
    const whatsapp = (opts && opts.whatsapp) || '';
    if (!$('wxCard')) return null;

    const state = {
      site: recall(KEY_SITE) || (cities.length
        ? { name: cities[0][0], lat: cities[0][1], lon: cities[0][2], label: '' }
        : null),
      channels: recall(KEY_CHANNELS) || { push: false, whatsapp: false, email: false },
      channelTo: { whatsapp: whatsapp, email: '' },
      level: LEVEL.NORMAL,
      told: LEVEL.NORMAL,          // highest level already announced
      risks: [],
      timezone: '',
      checked: null,
      error: null,
      busy: false
    };
    const saved = recall(KEY_CHANNELS);
    if (saved && saved.to) state.channelTo = Object.assign(state.channelTo, saved.to);

    const siteSel = $('wxSite'), labelIn = $('wxLabel');
    cities.forEach((c, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = c[0];
      siteSel.appendChild(o);
    });
    const pinned = document.createElement('option');
    pinned.value = 'pin';
    pinned.textContent = 'Pinned location';
    pinned.hidden = true;
    siteSel.appendChild(pinned);

    function siteName() {
      if (!state.site) return 'your site';
      return state.site.label ? state.site.label : state.site.name;
    }

    function reflectSite() {
      if (!state.site) return;
      const idx = cities.findIndex(c => c[0] === state.site.name);
      siteSel.value = state.site.pinned ? 'pin' : (idx >= 0 ? String(idx) : '0');
      pinned.hidden = !state.site.pinned;
      labelIn.value = state.site.label || '';
      $('wxWatching').textContent = siteName();
    }

    // ---- alert text shared by every channel ----------------------
    function alertText() {
      const s = summarise(state.level);
      const lines = ['Geonergy weather watch — ' + siteName(),
                     LEVEL_NAME[state.level] + ': ' + s.message];
      state.risks.forEach(r => lines.push('• ' + r.text));
      lines.push('This is an early warning from forecast data, not a guarantee.');
      return lines.join('\n');
    }

    function refreshSendLinks() {
      const body = alertText();
      const wa = (state.channelTo.whatsapp || whatsapp).replace(/[^0-9]/g, '');
      $('wxSendWa').href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(body);
      // Encode the address but leave the @ alone: mail clients accept a
      // percent-encoded local part, but a visible mailto: reads better.
      const to = encodeURIComponent(state.channelTo.email || '').replace(/%40/g, '@');
      $('wxSendMail').href = 'mailto:' + to
        + '?subject=' + encodeURIComponent('Geonergy weather watch — ' + LEVEL_NAME[state.level] + ' at ' + siteName())
        + '&body=' + encodeURIComponent(body);
    }

    // A push alert is only ever raised when the level RISES. Re-checking
    // every 15 minutes through one long storm should not mean 20 buzzes.
    function maybeNotify() {
      if (state.level <= state.told) {
        if (state.level < state.told) state.told = state.level;
        return;
      }
      state.told = state.level;
      if (!state.channels.push) return;
      if (!('Notification' in global) || Notification.permission !== 'granted') return;
      const s = summarise(state.level);
      try {
        new Notification('Geonergy — ' + LEVEL_NAME[state.level] + ' at ' + siteName(), {
          body: s.message,
          tag: 'geonergy-weather-watch'
        });
      } catch (e) { /* some browsers refuse this outside a service worker */ }
    }

    function paint() {
      const card = $('wxCard');
      const s = summarise(state.level);
      LEVEL_CLASS.forEach(c => card.classList.remove(c));
      card.classList.add(LEVEL_CLASS[state.level]);
      $('wxBadge').textContent = LEVEL_NAME[state.level];
      $('wxHeadline').textContent = state.error ? 'Forecast unavailable' : s.headline;
      $('wxMessage').textContent = state.error
        ? 'We could not reach the forecast for this site just now. This section is not watching anything until it loads — try again, and contact Geonergy if weather is already building.'
        : s.message;

      $('wxRisks').innerHTML = state.risks.map(r =>
        '<li class="wx-risk wx-' + r.kind + '">' + riskIcon(r.kind) + '<span>' + escapeHtml(r.text) + '</span></li>'
      ).join('');
      $('wxRisks').hidden = !state.risks.length;

      $('wxClear').hidden = !!state.error || state.risks.length > 0;

      const sendable = state.level > LEVEL.NORMAL && !state.error;
      $('wxSend').hidden = !sendable;
      $('wxSendWa').hidden = !state.channels.whatsapp;
      $('wxSendMail').hidden = !state.channels.email;
      if (sendable) refreshSendLinks();

      let meta;
      if (state.busy) meta = 'Checking the forecast for ' + siteName() + '…';
      else if (state.error) meta = 'Last attempt failed. Checks retry every 15 minutes while this page is open.';
      else if (state.checked) {
        meta = 'Checked ' + state.checked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
             + ' · forecast times are local to the site'
             + (state.timezone ? ' (' + state.timezone + ')' : '');
      } else meta = '';
      $('wxMeta').textContent = meta;
    }

    function riskIcon(kind) {
      const art = {
        lightning: '<path d="M13.4 2.5 4.6 13.8h6.3l-.9 7.7 9.4-11.2h-6.3Z"/>',
        wind: '<path d="M3 8.5h9.5a3 3 0 1 0-3-3M3 12.5h13a3 3 0 1 1-3 3M3 16.5h6.5a2.5 2.5 0 1 1-2.5 2.5"/>',
        rain: '<path d="M7 15.5a4.5 4.5 0 0 1 .6-9 6 6 0 0 1 11.2 1.6A3.9 3.9 0 0 1 18 15.5M8.5 18l-1 3M12 18l-1 3M15.5 18l-1 3"/>'
      };
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
           + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
           + (art[kind] || art.lightning) + '</svg>';
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
    }

    async function check() {
      if (!state.site) return;
      state.busy = true;
      state.error = null;
      paint();
      try {
        const data = await fetchForecast(state.site.lat, state.site.lon);
        const verdict = assess(data);
        state.level = verdict.level;
        state.risks = verdict.risks;
        state.timezone = verdict.timezone;
        state.checked = new Date();
        state.busy = false;
        paint();
        maybeNotify();
      } catch (err) {
        state.busy = false;
        state.error = err;
        state.risks = [];
        state.level = LEVEL.NORMAL;
        paint();
      }
    }

    // ---- wiring --------------------------------------------------
    siteSel.addEventListener('change', e => {
      if (e.target.value === 'pin') return;
      const c = cities[Number(e.target.value)];
      if (!c) return;
      state.site = { name: c[0], lat: c[1], lon: c[2], label: labelIn.value.trim() };
      pinned.hidden = true;
      store(KEY_SITE, state.site);
      reflectSite();
      check();
    });

    labelIn.addEventListener('input', () => {
      if (!state.site) return;
      state.site.label = labelIn.value.trim();
      store(KEY_SITE, state.site);
      $('wxWatching').textContent = siteName();
      paint();
    });

    // Geolocation is used ONCE, to drop a pin on the installation. After
    // that the watch stays on the pin — it never follows the phone around.
    $('wxPin').addEventListener('click', () => {
      const btn = $('wxPin');
      if (!navigator.geolocation) {
        $('wxSiteHint').textContent = 'This browser cannot share a location. Pick the closest town instead.';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Finding…';
      navigator.geolocation.getCurrentPosition(pos => {
        state.site = {
          name: 'Pinned location',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: labelIn.value.trim(),
          pinned: true
        };
        store(KEY_SITE, state.site);
        reflectSite();
        $('wxSiteHint').textContent = 'Pinned. The watch stays on this spot even when you are somewhere else.';
        btn.disabled = false;
        btn.textContent = 'Pin where I am now';
        check();
      }, () => {
        $('wxSiteHint').textContent = 'Could not get a location. Pick the closest town instead.';
        btn.disabled = false;
        btn.textContent = 'Pin where I am now';
      }, { timeout: 10000, maximumAge: 600000 });
    });

    function saveChannels() {
      store(KEY_CHANNELS, { push: state.channels.push, whatsapp: state.channels.whatsapp,
                            email: state.channels.email, to: state.channelTo });
    }

    $('wxPush').addEventListener('change', async e => {
      if (!e.target.checked) {
        state.channels.push = false; saveChannels(); paint(); return;
      }
      if (!('Notification' in global)) {
        e.target.checked = false;
        $('wxPushHint').textContent = 'This browser does not support notifications.';
        return;
      }
      let perm = Notification.permission;
      if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch (x) { perm = 'denied'; } }
      if (perm !== 'granted') {
        e.target.checked = false;
        state.channels.push = false;
        $('wxPushHint').textContent = 'Notifications are blocked for this site in your browser settings.';
      } else {
        state.channels.push = true;
        $('wxPushHint').textContent = 'On. You will get a notification while this page is open.';
      }
      saveChannels();
      paint();
    });

    $('wxWa').addEventListener('change', e => {
      state.channels.whatsapp = e.target.checked; saveChannels(); paint();
    });
    $('wxMail').addEventListener('change', e => {
      state.channels.email = e.target.checked; saveChannels(); paint();
    });
    $('wxWaNum').addEventListener('input', e => {
      state.channelTo.whatsapp = e.target.value.trim(); saveChannels(); paint();
    });
    $('wxMailTo').addEventListener('input', e => {
      state.channelTo.email = e.target.value.trim(); saveChannels(); paint();
    });
    $('wxRecheck').addEventListener('click', check);

    // ---- restore and start ---------------------------------------
    reflectSite();
    $('wxPush').checked = !!state.channels.push
      && ('Notification' in global) && Notification.permission === 'granted';
    state.channels.push = $('wxPush').checked;
    $('wxWa').checked = !!state.channels.whatsapp;
    $('wxMail').checked = !!state.channels.email;
    $('wxWaNum').value = state.channelTo.whatsapp || whatsapp;
    $('wxMailTo').value = state.channelTo.email || '';

    setInterval(check, REFRESH_MS);
    // Coming back to a tab that slept through the afternoon should not show
    // a stale "Normal" from three hours ago.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (!state.checked || Date.now() - state.checked.getTime() > STALE_MS) check();
    });
    check();

    return { check: check, state: state };
  }

  global.GeonergySafety = { init: init, assess: assess, LEVEL: LEVEL, LEVEL_NAME: LEVEL_NAME, THRESHOLDS: T };

})(typeof window !== 'undefined' ? window : globalThis);
