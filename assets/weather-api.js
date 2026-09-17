// Open-Meteo access for the whole site, in one place.
//
// Geonergy is on Open-Meteo's PAID COMMERCIAL PLAN. Both weather features -
// the production calculator and the safety watch - build their requests
// through here, so the key and the endpoint are set once rather than in two
// files that drift apart.
//
// TO GO LIVE: paste the key from the Open-Meteo subscription into API_KEY
// below. Until it is filled in, requests fall back to the free endpoint so
// the pages keep working - but that endpoint is licensed for non-commercial
// use only, so a blank key is a launch blocker, not a setting.
//
// THE KEY IS PUBLIC. This is a static site with no backend: anything in this
// file can be read by anyone who views source. That is a property of having
// nowhere to hide it, not a bug to fix by obscuring it. Two real answers,
// whenever the bill makes it worth doing:
//   - ask Open-Meteo to lock the key to the geonergy domain, if the plan
//     supports it;
//   - or stand up one small serverless function, keep the key there, and
//     point HOST at it. That is the same piece of work as alerting a
//     customer while the page is closed, so it is worth doing once, together.
(function (global) {
  'use strict';

  // ---- the only two lines to change ----
  const API_KEY = '';
  // Open-Meteo serves paid traffic from a customer- prefixed host and takes
  // the key as &apikey=. Check both against the subscription email before
  // launch: if they read differently, this file is the only place to fix.
  const PAID_HOST = 'https://customer-api.open-meteo.com';
  // --------------------------------------

  const FREE_HOST = 'https://api.open-meteo.com';

  function forecastUrl(params) {
    const qs = Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
    return (API_KEY ? PAID_HOST : FREE_HOST) + '/v1/forecast?' + qs
      + (API_KEY ? '&apikey=' + encodeURIComponent(API_KEY) : '');
  }

  global.GeonergyWeather = {
    forecastUrl: forecastUrl,
    // True once the commercial key is in. Nothing on the site reads this
    // today; it is here so a future page can tell the difference without
    // parsing a URL.
    licensed: function () { return !!API_KEY; }
  };

})(typeof window !== 'undefined' ? window : globalThis);
