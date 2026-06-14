# Phase A Analytics Design Spec

**Project:** thesuepattigroup.ai  
**File:** `js/analytics.js` (not yet created)  
**Author:** Design review, Step 2  
**Status:** Approved for implementation pending Dr. Mughal sign-off  
**Working directory:** `C:\Users\zumah\OneDrive\Desktop\JAson\thesuepattigroup_ai_updated`

---

## Purpose

Create a single source of truth for traffic attribution that:

1. Persists session data in `localStorage` (`agentpulse_session`)
2. Exposes a stable read API (`window.getAttributionData()`)
3. Pushes raw attribution signals to GA4 on enriched page views and conversion events
4. Preserves backward-compatible session fields for existing `chatbot.js` consumers
5. Does not implement server-side categorization (AgentPulse Phase C)

**Architecture:** Light website, heavy AgentPulse. Website sends raw inputs. AgentPulse applies its own categorization at GA4 read time.

---

## 1. Module Structure

### Pattern

**Yes:** synchronous IIFE that runs immediately on script load. No ES modules (vanilla site, no bundler).

### Functions exposed on `window`

| Function | Purpose |
| -------- | ------- |
| `window.getAttributionData()` | Returns normalized attribution object (snake_case) for lead capture and debugging |
| `window.trackLeadEvent(eventName, params)` | Replaces the per-page inline helper after deferred init; merges attribution into GA4 events |

**Not exposed:** classifier helpers, storage writers, GA4 queue logic (private inside IIFE).

### `localStorage` keys

| Key | Read | Write | Notes |
| --- | ---- | ----- | ----- |
| `agentpulse_session` | Yes | Yes | Primary session store; extended, backward compatible |
| `agentpulse_leads` | No | No | Owned by chatbot/newsletter/valuation handlers |
| `agentpulse_events` | No | No | Owned by `chatbot.js` `emitEvent()` |

### When the IIFE runs

**Immediately on script load** (synchronous `<script src="js/analytics.js">` in `<head>`).

**Two-phase init inside the IIFE:**

| Phase | Timing | Work |
| ----- | ------ | ---- |
| Phase 1 (sync) | End of `analytics.js` parse | Create or load session, expose `getAttributionData()`, increment `pageViewCount` |
| Phase 2 (deferred) | `setTimeout(fn, 0)` after head inline scripts | Wrap `trackLeadEvent`, fire enriched GA4 page view |

Phase 2 is required because inline gtag config (which defines the current `trackLeadEvent`) is parsed **after** `analytics.js` in the same `<head>`. A zero-delay timeout runs after the inline block executes.

**Does not wait for `DOMContentLoaded`** for session init (must be ready before body scripts). Page view enrichment waits only for `window.gtag` (poll up to 3 seconds, 50ms interval).

---

## 2. `window.getAttributionData()` Return Shape

TypeScript-style interface (public API uses snake_case):

```typescript
interface AttributionData {
  /** Persistent session identifier. Format: sess-{msTimestamp}-{6charAlphanumeric} */
  session_id: string;

  /** ISO 8601 UTC. Set once on first visit in this browser. */
  first_seen_at: string;

  /** ISO 8601 UTC. Updated on every page load where analytics.js runs. */
  last_seen_at: string;

  /** Integer >= 1. Incremented on every page load in session. */
  page_view_count: number;

  /** document.referrer at first visit. Empty string if none. Never updated after first visit. */
  referrer: string;

  /** Hostname parsed from first-visit referrer. Empty string if referrer empty or parse fails. www. stripped. */
  referrer_domain: string;

  /** UTM values captured once on first visit from landing URL. Empty string if absent (not null). */
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;

  /** Legacy classifier label. One of 18 source_category values (see Section 5). */
  source_category: string;

  /** Extra detail when category is Referral (full referrer URL). Empty string otherwise. */
  source_detail: string;

  /** First pathname visited in session, e.g. / or /contact.html */
  landing_page: string;

  /** navigator.userAgent at first visit */
  user_agent: string;

  /** window.screen.width at first visit */
  screen_width: number;

  /** navigator.language at first visit */
  language: string;
}
```

### Mapping from `agentpulse_session` (camelCase storage)

| Storage key (legacy) | API field (snake_case) |
| -------------------- | ---------------------- |
| `sessionId` | `session_id` |
| `firstSeenAt` | `first_seen_at` |
| `lastSeenAt` | `last_seen_at` |
| `pageViewCount` | `page_view_count` |
| `referrer` | `referrer` |
| `referrerDomain` (new) | `referrer_domain` |
| `utmSource` | `utm_source` |
| `utmMedium` | `utm_medium` |
| `utmCampaign` | `utm_campaign` |
| `utmContent` | `utm_content` |
| `utmTerm` | `utm_term` |
| `sourceCategory` | `source_category` |
| `sourceDetail` | `source_detail` |
| `firstLandingPage` | `landing_page` |
| `userAgent` | `user_agent` |
| `screenWidth` | `screen_width` |
| `language` | `language` |

**Null safety:** If session unavailable, return a zeroed object with `session_id: 'sess-unavailable'`, empty strings, `page_view_count: 0`, `screen_width: 0`. Never throw.

---

## 3. `window.trackLeadEvent(eventName, params)` Signature

### Signature

```javascript
window.trackLeadEvent(eventName: string, params?: Record<string, string | number | boolean>): void
```

### Merge rules

1. Call `getAttributionData()` at event time.
2. Build `attributionParams` using the **conversion subset** (Section 3.4, 11 fields).
3. Merge: `{ ...attributionParams, ...params }` (event-specific params win on key collision).
4. Coerce all values to strings or numbers GA4 accepts (no nested objects).
5. Call `window.gtag('event', eventName, merged)` if `gtag` is a function.

### Does it call `gtag` directly?

**Yes**, after merge. The wrapper replaces the inline per-page helper via deferred init (Section 8).

### Fallback if `gtag` not loaded

| Condition | Behavior |
| --------- | -------- |
| `gtag` missing at call time | Push `{ event: eventName, ...merged }` to `window.dataLayer` if array exists; otherwise no-op |
| `gtag` never loads (ad blocker) | Silent no-op after queue attempt; no console errors |
| `getAttributionData()` fails | Send event with `params` only (same silent fallback) |

### 3.4 GA4 parameter shapes sent

#### Conversion attribution subset (included on every `trackLeadEvent` call)

11 parameters (keeps room under GA4 25-param limit with event-specific fields):

| Parameter | Type | Source |
| --------- | ---- | ------ |
| `session_id` | string | session |
| `referrer` | string | session |
| `referrer_domain` | string | session |
| `utm_source` | string | session |
| `utm_medium` | string | session |
| `utm_campaign` | string | session |
| `utm_content` | string | session |
| `utm_term` | string | session |
| `source_category` | string | session |
| `source_detail` | string | session |
| `landing_page` | string | session |

#### Event: `generate_lead` (chatbot, `js/chatbot.js`)

Merged payload (18 parameters, under limit):

```
session_id, referrer, referrer_domain, utm_source, utm_medium, utm_campaign,
utm_content, utm_term, source_category, source_detail, landing_page,
lead_type, capture_source, score, status, budget, area, timeline
```

#### Event: `generate_lead` (seller, `home-valuation.html`)

Merged payload (16 parameters):

```
session_id, referrer, referrer_domain, utm_source, utm_medium, utm_campaign,
utm_content, utm_term, source_category, source_detail, landing_page,
lead_type, capture_source, city, zip, timeline
```

#### Event: `newsletter_signup` (`js/newsletter.js`, `js/chatbot.js`)

Merged payload (14 parameters):

```
session_id, referrer, referrer_domain, utm_source, utm_medium, utm_campaign,
utm_content, utm_term, source_category, source_detail, landing_page,
lead_type, capture_source, page
```

**Excluded from conversion events (page view only):** `first_seen_at`, `last_seen_at`, `page_view_count`, `user_agent`, `screen_width`, `language`. AgentPulse can join these from the enriched page view event by `session_id`.

---

## 4. Automatic Page View Enrichment

### Approach: new GA4 event (not modifying existing gtag config block)

**Out of scope:** changing `gtag('config', ...)` across 13 pages this session.

**In scope:** `analytics.js` fires a **second** event after gtag is available.

| Item | Value |
| ---- | ----- |
| Event name | `page_view_enriched` |
| Call | `gtag('event', 'page_view_enriched', attributionFullParams)` |
| Default page view | Existing `send_page_view: true` in inline config remains unchanged |

### Why not enrich the config block inline?

Inline gtag config runs **after** `analytics.js` in `<head>`, but attribution session init completes **during** `analytics.js` parse (Phase 1). The config block is not being edited in Phase A, so it cannot call `getAttributionData()` without a 13-file gtag refactor (deferred).

### Timing flow

```
1. analytics.js loads (sync)
   -> init session, window.getAttributionData = ...

2. async gtag.js loader starts

3. inline gtag config runs (sync)
   -> gtag('config', ..., { send_page_view: true })  // default GA page_view

4. setTimeout(0) from analytics.js runs
   -> wrap trackLeadEvent
   -> poll for window.gtag (max 3s)
   -> gtag('event', 'page_view_enriched', { ...17 attribution params })
```

### `page_view_enriched` full parameter set (17 params)

```
session_id, first_seen_at, last_seen_at, page_view_count, referrer, referrer_domain,
utm_source, utm_medium, utm_campaign, utm_content, utm_term,
source_category, source_detail, landing_page, user_agent, screen_width, language
```

Also include `page_path: window.location.pathname` and `page_title: document.title` (standard GA4 recommended params, 19 total, still under 25).

---

## 5. Categorization Rules

**Order matters.** First match wins. All matching is case-insensitive substring on `document.referrer` at **first visit only**.

| Match pattern (referrer substring, case-insensitive) | source_category |
| ---------------------------------------------------- | --------------- |
| `chat.openai.com` OR `chatgpt.com` | ChatGPT |
| `perplexity.ai` | Perplexity |
| `claude.ai` | Claude |
| `gemini.google.com` OR `bard.google.com` | Gemini |
| `copilot.microsoft.com` OR `bing.com/chat` | Copilot |
| `google.` (only if Gemini and bard rules did not match) | Google |
| `bing.com` (only if Copilot rule did not match) | Bing |
| `duckduckgo.com` | DuckDuckGo |
| `facebook.com` OR `fb.com` | Facebook |
| `linkedin.com` | LinkedIn |
| `instagram.com` | Instagram |
| `zillow.com` | Zillow |
| `realtor.com` | Realtor.com |
| `redfin.com` | Redfin |
| `trulia.com` | Trulia |
| `homes.com` | Homes.com |
| Referrer non-empty, no rule matched | Referral |
| Referrer empty | Direct |

**Referral row behavior:** set `source_detail` to full referrer URL. All other categories: `source_detail` is empty string.

**UTM note:** UTMs are stored separately. They do **not** override `source_category` (preserves current behavior; raw UTMs go to GA4 for AgentPulse categorization).

**New categories in Phase A:** Copilot, Trulia, Homes.com.

---

## 6. Backward Compatibility

### Extended `agentpulse_session` object (written by `analytics.js`)

**Preserved camelCase keys (unchanged names):**

```
sessionId, firstSeenAt, lastSeenAt, pageViewCount, firstLandingPage,
referrer, sourceCategory, sourceDetail,
utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
userAgent, screenWidth, language
```

**New key:**

```
referrerDomain   // parsed hostname, www stripped
```

### Fields read by `js/chatbot.js` today

| Consumer | Fields read from session via `getAttribution()` |
| -------- | ----------------------------------------------- |
| Lead object (`saveAndShowMatches`) | `sessionId`, `sourceCategory`, `sourceDetail`, `referrer`, `utmSource`, `utmMedium`, `utmCampaign`, `firstLandingPage`, `pageViewCount` |
| `emitEvent()` | `sessionId`, `sourceCategory` |
| Netlify POST (`chatbot-lead`) | `lead.source` (derived from `sourceCategory`) |

**Phase A plan for `chatbot.js`:** Remove duplicate `initAttribution` IIFE (later step). During transition, if both run briefly, `analytics.js` must load first and own session creation; chatbot `initAttribution` becomes a no-op stub until removed.

**Nothing breaks if:** camelCase keys remain populated with same semantics. `sessionId` format unchanged (`sess-{timestamp}-{random}`).

### `js/newsletter.js` today

Does **not** read `agentpulse_session`. Uses local `getAttribution()` at click time with shape:

```
{ source, utm_source, utm_medium, utm_campaign, landing_page, referrer }
```

**Phase A refactor:** Replace local function with mapping from `window.getAttributionData()`:

| Old field | New source |
| --------- | ---------- |
| `source` | `source_category` (or lowercase alias if needed for legacy lead JSON) |
| `utm_source` | `utm_source` |
| `utm_medium` | `utm_medium` |
| `utm_campaign` | `utm_campaign` |
| `landing_page` | `landing_page` |
| `referrer` | `referrer` |

Lead JSON in `agentpulse_leads` may change `source` from hostname strings to classifier labels. Acceptable for Phase A (AgentPulse will use GA4 raw signals as primary).

### `home-valuation.html` inline IIFE today

Same shape as newsletter. Same refactor to `window.getAttributionData()`.

Also generates its own `session_id` on the lead object (line 309). Phase A refactor: use `getAttributionData().session_id` for consistency.

### Transition safety

| Scenario | Result |
| -------- | ------ |
| Old session in localStorage (no `referrerDomain`) | `getAttributionData()` returns `referrer_domain: ''` until user clears storage or new session |
| analytics.js blocked | chatbot still works; no GA4 enrichment; session may not init |
| chatbot.js loads before analytics.js | **Invalid load order.** HTML change requires analytics.js in `<head>` before body scripts |

---

## 7. GA4 Event Parameter Naming and Limits

### snake_case confirmation

All GA4 event parameters in this design use **snake_case**:

`session_id`, `first_seen_at`, `last_seen_at`, `page_view_count`, `referrer`, `referrer_domain`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `source_category`, `source_detail`, `landing_page`, `user_agent`, `screen_width`, `language`, `page_path`, `page_title`, `lead_type`, `capture_source`, `score`, `status`, `budget`, `area`, `timeline`, `city`, `zip`, `page`

**Storage** remains camelCase for backward compatibility. **GA4 and public API** use snake_case.

### 25 custom parameter limit per event

| Event | Param count | Under 25? |
| ----- | ----------- | --------- |
| `page_view_enriched` | 19 | Yes |
| `generate_lead` (chatbot) | 18 | Yes |
| `generate_lead` (seller) | 16 | Yes |
| `newsletter_signup` | 14 | Yes |

Default GA `page_view` from config carries no custom params (unchanged).

---

## 8. Load Order on HTML Pages

### Required `<head>` order (each of 13 pages)

```html
<!-- 1. Attribution module (sync, no async/defer) -->
<script src="js/analytics.js"></script>

<!-- 2. GA4 loader (unchanged) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-WBWHJYPG12"></script>

<!-- 3. Inline gtag config + current trackLeadEvent (unchanged this session) -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-WBWHJYPG12', { ... });
  window.trackLeadEvent = function(eventName, params) { ... };
</script>
```

### Body scripts (unchanged position)

```html
<script src="js/chatbot.js"></script>
<script src="js/newsletter.js"></script>
```

### `async` / `defer` on `analytics.js`

**Neither.** Synchronous blocking script so session exists before inline gtag and before any body interaction.

### Wait for gtag before enrichment?

**Yes.** Phase 2 polls for `typeof window.gtag === 'function'` (50ms interval, 3000ms max). Does not block page render. Does not throw if timeout.

---

## 9. Failure Modes

| Failure | Behavior |
| ------- | -------- |
| `localStorage` disabled or throws | Skip read/write; `getAttributionData()` returns fallback object; no console output |
| `localStorage` quota exceeded | Catch on setItem; session works in memory for current page only (optional in-memory fallback variable); no console output |
| `document.referrer` unavailable | Treat as empty string; `source_category: 'Direct'` |
| `new URL(referrer)` throws | `referrer_domain: ''`; keep raw `referrer` string if available |
| `URLSearchParams` throws | All UTMs empty strings |
| `gtag` never loads | Skip `page_view_enriched`; conversion events queue to `dataLayer` once, else no-op; no console output |
| `trackLeadEvent` called before wrapper runs | Inline helper fires without attribution (race window only during head parse); wrapper replaces helper within same tick as gtag init under normal conditions |
| Ad blocker removes gtag | Site, forms, chatbot, localStorage leads all still function |

**Principle:** Graceful degradation only. No `console.error`, `console.warn`, or thrown exceptions from `analytics.js`.

---

## 10. Out of Scope for Phase A (Confirmed)

| Item | Phase |
| ---- | ----- |
| GA4 Admin custom dimension / metric registration | Phase B |
| Refactoring or consolidating duplicated gtag block across 13 pages | Later session |
| Removing `initAttribution` IIFE from `chatbot.js` (stub/no-op first, delete later) | End of Phase A implementation, not this design step |
| AgentPulse server-side read/display of new GA4 parameters | Phase C |
| Changing Netlify Forms payloads to include attribution fields | Not Phase A |
| `llms.txt` UTM hint | Separate Phase A step (show diff before edit) |

---

## Implementation Sequence (Reference, Post-Design)

1. Create `js/analytics.js` per this spec
2. Add `<script src="js/analytics.js">` to 13 HTML pages (one file per prompt)
3. Refactor `js/chatbot.js` to use `getAttributionData()` / remove duplicate init
4. Refactor `js/newsletter.js`
5. Refactor `home-valuation.html` inline script
6. Update `llms.txt` (diff review before edit)
7. Manual test checklist on Netlify deploy preview
8. Commit and push only on explicit "approve push"

---

## Open Questions for Sign-Off

1. **`page_view_enriched` vs renaming:** Acceptable to use a custom event name (not the reserved `page_view`) to avoid double-counting and avoid gtag block edits?
2. **Newsletter lead JSON `source` field:** OK to switch from hostname strings to `source_category` classifier labels when using shared attribution?
3. **Seller lead `session_id`:** OK to replace locally generated IDs with shared `session_id` from session?

---

*End of Phase A design spec.*
