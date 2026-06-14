/**
 * The Sue Patti Group | Traffic Attribution Module
 *
 * Purpose: Single source of truth for session attribution, localStorage
 * persistence, and GA4 raw signal delivery for AgentPulse Market Intel.
 *
 * Version: 1.0.0
 * Last updated: 2026-06-09
 * Author: Dr. Data Decision Intelligence LLC
 *
 * Public API:
 *   window.getAttributionData()  -> snake_case attribution object
 *   window.trackLeadEvent(name, params) -> GA4 conversion with merged attribution
 *
 * Debug: set window.__DR_DATA_ANALYTICS_DEBUG = true to enable console logging.
 */
(function analyticsModule() {
  'use strict';

  var STORAGE_KEY = 'agentpulse_session';
  var GTAG_POLL_MS = 50;
  var GTAG_POLL_MAX_MS = 3000;
  var SESSION_ID_PREFIX = 'sess-';

  var GOOGLE_HOST_SUFFIXES = [
    'google.com',
    'google.co.uk',
    'google.ca',
    'google.de',
    'google.fr',
    'google.com.au',
    'google.co.in',
    'google.com.br',
    'google.it',
    'google.es'
  ];

  var memorySession = null;

  function debugLog() {
    if (window.__DR_DATA_ANALYTICS_DEBUG === true) {
      console.log.apply(console, arguments);
    }
  }

  function safeString(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  function randomSuffix(length) {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var out = '';
    var i;
    for (i = 0; i < length; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  function generateSessionId() {
    return SESSION_ID_PREFIX + Date.now() + '-' + randomSuffix(6);
  }

  function parseReferrerParts(referrer) {
    if (!referrer) {
      return { host: '', path: '', raw: '' };
    }
    try {
      var url = new URL(referrer);
      return {
        host: url.hostname.replace(/^www\./i, '').toLowerCase(),
        path: (url.pathname || '').toLowerCase(),
        raw: referrer
      };
    } catch (e) {
      return { host: '', path: '', raw: referrer };
    }
  }

  function parseReferrerDomain(referrer) {
    return parseReferrerParts(referrer).host;
  }

  function hostMatchesSuffix(host, suffix) {
    return host === suffix || host.slice(-1 * (suffix.length + 1)) === '.' + suffix;
  }

  function hostMatchesAnySuffix(host, suffixes) {
    var i;
    for (i = 0; i < suffixes.length; i++) {
      if (hostMatchesSuffix(host, suffixes[i])) {
        return true;
      }
    }
    return false;
  }

  function hostEndsWithDomain(host, domain) {
    return host === domain || host.slice(-1 * (domain.length + 1)) === '.' + domain;
  }

  /**
   * Legacy classifier preserved for backward-compatible sourceCategory in storage.
   * AgentPulse applies its own categorization server-side from raw referrer + UTMs.
   */
  function classifyReferrer(referrer) {
    var parts = parseReferrerParts(referrer);
    var host = parts.host;
    var path = parts.path;
    var raw = parts.raw;
    var category = 'Direct';
    var detail = '';

    if (!raw) {
      return { sourceCategory: category, sourceDetail: detail };
    }

    if (hostEndsWithDomain(host, 'chat.openai.com') || hostEndsWithDomain(host, 'chatgpt.com')) {
      return { sourceCategory: 'ChatGPT', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'perplexity.ai')) {
      return { sourceCategory: 'Perplexity', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'claude.ai')) {
      return { sourceCategory: 'Claude', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'gemini.google.com') || hostEndsWithDomain(host, 'bard.google.com')) {
      return { sourceCategory: 'Gemini', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'copilot.microsoft.com') || (hostEndsWithDomain(host, 'bing.com') && path.indexOf('/chat') === 0)) {
      return { sourceCategory: 'Copilot', sourceDetail: '' };
    }
    if (hostMatchesAnySuffix(host, GOOGLE_HOST_SUFFIXES)) {
      return { sourceCategory: 'Google', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'bing.com')) {
      return { sourceCategory: 'Bing', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'duckduckgo.com')) {
      return { sourceCategory: 'DuckDuckGo', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'facebook.com') || hostEndsWithDomain(host, 'fb.com')) {
      return { sourceCategory: 'Facebook', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'linkedin.com')) {
      return { sourceCategory: 'LinkedIn', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'instagram.com')) {
      return { sourceCategory: 'Instagram', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'zillow.com')) {
      return { sourceCategory: 'Zillow', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'realtor.com')) {
      return { sourceCategory: 'Realtor.com', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'redfin.com')) {
      return { sourceCategory: 'Redfin', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'trulia.com')) {
      return { sourceCategory: 'Trulia', sourceDetail: '' };
    }
    if (hostEndsWithDomain(host, 'homes.com')) {
      return { sourceCategory: 'Homes.com', sourceDetail: '' };
    }

    return { sourceCategory: 'Referral', sourceDetail: raw };
  }

  function readUtmParams() {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return {
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmTerm: '',
        utmContent: ''
      };
    }
    return {
      utmSource: safeString(params.get('utm_source')),
      utmMedium: safeString(params.get('utm_medium')),
      utmCampaign: safeString(params.get('utm_campaign')),
      utmTerm: safeString(params.get('utm_term')),
      utmContent: safeString(params.get('utm_content'))
    };
  }

  function loadSessionFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      debugLog('[analytics] localStorage read failed');
    }
    return null;
  }

  function saveSessionToStorage(session) {
    memorySession = session;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      debugLog('[analytics] localStorage write failed');
    }
  }

  function loadSession() {
    var session = loadSessionFromStorage();
    if (!session && memorySession) {
      session = memorySession;
    }
    return session;
  }

  function createNewSession() {
    var referrer = '';
    try {
      referrer = document.referrer || '';
    } catch (e) {
      referrer = '';
    }

    var classification = classifyReferrer(referrer);
    var utms = readUtmParams();
    var now = new Date().toISOString();

    return {
      sessionId: generateSessionId(),
      firstSeenAt: now,
      lastSeenAt: now,
      pageViewCount: 0,
      firstLandingPage: window.location.pathname || '/',
      referrer: referrer,
      referrerDomain: parseReferrerDomain(referrer),
      sourceCategory: classification.sourceCategory,
      sourceDetail: classification.sourceDetail,
      utmSource: utms.utmSource,
      utmMedium: utms.utmMedium,
      utmCampaign: utms.utmCampaign,
      utmTerm: utms.utmTerm,
      utmContent: utms.utmContent,
      userAgent: safeString(navigator.userAgent),
      screenWidth: typeof window.screen !== 'undefined' ? Number(window.screen.width) || 0 : 0,
      language: safeString(navigator.language)
    };
  }

  function backfillSessionFields(session) {
    if (!session.referrerDomain && session.referrer) {
      session.referrerDomain = parseReferrerDomain(session.referrer);
    }
    if (typeof session.pageViewCount !== 'number') {
      session.pageViewCount = 0;
    }
    return session;
  }

  function initSessionSync() {
    var session = loadSession();

    if (!session) {
      session = createNewSession();
    } else {
      session = backfillSessionFields(session);
    }

    session.pageViewCount = (session.pageViewCount || 0) + 1;
    session.lastSeenAt = new Date().toISOString();
    saveSessionToStorage(session);
    debugLog('[analytics] session ready', session.sessionId);
  }

  function fallbackAttributionData() {
    return {
      session_id: 'sess-unavailable',
      first_seen_at: '',
      last_seen_at: '',
      page_view_count: 0,
      referrer: '',
      referrer_domain: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
      source_category: 'Direct',
      source_detail: '',
      landing_page: window.location.pathname || '/',
      user_agent: '',
      screen_width: 0,
      language: ''
    };
  }

  function mapSessionToPublic(session) {
    if (!session) {
      return fallbackAttributionData();
    }

    return {
      session_id: safeString(session.sessionId),
      first_seen_at: safeString(session.firstSeenAt),
      last_seen_at: safeString(session.lastSeenAt),
      page_view_count: Number(session.pageViewCount) || 0,
      referrer: safeString(session.referrer),
      referrer_domain: safeString(session.referrerDomain),
      utm_source: safeString(session.utmSource),
      utm_medium: safeString(session.utmMedium),
      utm_campaign: safeString(session.utmCampaign),
      utm_content: safeString(session.utmContent),
      utm_term: safeString(session.utmTerm),
      source_category: safeString(session.sourceCategory) || 'Direct',
      source_detail: safeString(session.sourceDetail),
      landing_page: safeString(session.firstLandingPage) || '/',
      user_agent: safeString(session.userAgent),
      screen_width: Number(session.screenWidth) || 0,
      language: safeString(session.language)
    };
  }

  window.getAttributionData = function getAttributionData() {
    try {
      return mapSessionToPublic(loadSession());
    } catch (e) {
      return fallbackAttributionData();
    }
  };

  function buildConversionGA4Params(extraParams) {
    var attribution = window.getAttributionData();
    var merged = {
      session_id: attribution.session_id,
      referrer: attribution.referrer,
      referrer_domain: attribution.referrer_domain,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      source_category: attribution.source_category,
      source_detail: attribution.source_detail,
      landing_page: attribution.landing_page
    };
    var key;
    if (extraParams && typeof extraParams === 'object') {
      for (key in extraParams) {
        if (Object.prototype.hasOwnProperty.call(extraParams, key)) {
          merged[key] = extraParams[key];
        }
      }
    }
    return merged;
  }

  function buildFullGA4Params(attribution) {
    return {
      session_id: attribution.session_id,
      first_seen_at: attribution.first_seen_at,
      last_seen_at: attribution.last_seen_at,
      page_view_count: attribution.page_view_count,
      referrer: attribution.referrer,
      referrer_domain: attribution.referrer_domain,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      source_category: attribution.source_category,
      source_detail: attribution.source_detail,
      landing_page: attribution.landing_page,
      user_agent: attribution.user_agent,
      screen_width: attribution.screen_width,
      language: attribution.language
    };
  }

  function queueDataLayer(eventName, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      var payload = { event: eventName };
      var k;
      if (params && typeof params === 'object') {
        for (k in params) {
          if (Object.prototype.hasOwnProperty.call(params, k)) {
            payload[k] = params[k];
          }
        }
      }
      window.dataLayer.push(payload);
    } catch (e) {
      debugLog('[analytics] dataLayer queue failed');
    }
  }

  function sendGA4Event(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
      return;
    }
    queueDataLayer(eventName, params);
  }

  function pollForGtag(callback) {
    var elapsed = 0;

    function attempt() {
      if (typeof window.gtag === 'function') {
        callback();
        return;
      }
      elapsed += GTAG_POLL_MS;
      if (elapsed >= GTAG_POLL_MAX_MS) {
        debugLog('[analytics] gtag unavailable after timeout');
        return;
      }
      setTimeout(attempt, GTAG_POLL_MS);
    }

    attempt();
  }

  function wrapTrackLeadEvent() {
    window.trackLeadEvent = function trackLeadEvent(eventName, params) {
      var merged;
      try {
        merged = buildConversionGA4Params(params || {});
      } catch (e) {
        merged = params || {};
      }
      sendGA4Event(eventName, merged);
    };
    debugLog('[analytics] trackLeadEvent wrapped');
  }

  function firePageViewEnriched() {
    pollForGtag(function onGtagReady() {
      var attribution = window.getAttributionData();
      var params = buildFullGA4Params(attribution);
      params.page_path = window.location.pathname || '/';
      params.page_title = safeString(document.title);
      sendGA4Event('page_view_enriched', params);
      debugLog('[analytics] page_view_enriched sent');
    });
  }

  function schedulePostHeadInit() {
    setTimeout(function postHeadInit() {
      wrapTrackLeadEvent();
      firePageViewEnriched();
    }, 0);
  }

  initSessionSync();
  schedulePostHeadInit();
})();
