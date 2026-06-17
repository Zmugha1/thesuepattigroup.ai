/**
 * The Sue Patti Group | Unified analytics and attribution (Phase A).
 * Raw signals only. Server-side categorization lives in AgentPulse.
 */
(function analyticsModule() {
  'use strict';

  var GA_ID = 'G-WBWHJYPG12';
  var SESSION_KEY = 'agentpulse_session_id';

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  var gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(gtagScript);

  gtag('js', new Date());
  gtag('config', GA_ID);

  function safeString(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  function extractReferrerDomain(referrer) {
    if (!referrer) {
      return '';
    }
    try {
      return new URL(referrer).hostname.replace(/^www\./i, '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function readUtmParam(name) {
    try {
      return safeString(new URLSearchParams(window.location.search).get(name));
    } catch (e) {
      return '';
    }
  }

  function getOrCreateSessionId() {
    try {
      var existing = sessionStorage.getItem(SESSION_KEY);
      if (existing) {
        return existing;
      }
      var id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(SESSION_KEY, id);
      return id;
    } catch (e) {
      return 'sess-unavailable';
    }
  }

  window.getAttributionData = function getAttributionData() {
    var referrer = '';
    try {
      referrer = document.referrer || '';
    } catch (e) {
      referrer = '';
    }

    return {
      referrer: referrer || 'direct',
      referrer_domain: extractReferrerDomain(referrer),
      utm_source: readUtmParam('utm_source'),
      utm_medium: readUtmParam('utm_medium'),
      utm_campaign: readUtmParam('utm_campaign'),
      landing_page: window.location.pathname || '/',
      session_id: getOrCreateSessionId(),
    };
  };

  window.buildLeadAttribution = function buildLeadAttribution(extraFields) {
    var result = window.getAttributionData();
    var key;

    if (extraFields && typeof extraFields === 'object') {
      for (key in extraFields) {
        if (Object.prototype.hasOwnProperty.call(extraFields, key)) {
          result[key] = extraFields[key];
        }
      }
    }

    return result;
  };

  window.trackLeadEvent = function trackLeadEvent(eventName, params) {
    var merged = window.buildLeadAttribution(params || {});
    gtag('event', eventName, merged);
  };

  function fireAttributionCapture() {
    var data = window.getAttributionData();
    gtag('event', 'attribution_capture', {
      referrer_domain: data.referrer_domain,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      landing_page: data.landing_page,
      session_id: data.session_id,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fireAttributionCapture);
  } else {
    fireAttributionCapture();
  }
})();
