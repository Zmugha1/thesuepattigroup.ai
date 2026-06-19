# Phase A Slice 3 Refactor Design

**Project:** thesuepattigroup.ai  
**Phase:** A, Slice 3 - Deduplicate attribution implementations  
**Author:** Design review, Step 10  
**Status:** Implemented in commit 76db030 (May 30, 2026). Design retained as project documentation.  
**Working directory:** `C:\Users\zumah\OneDrive\Desktop\JAson\thesuepattigroup_ai_updated`

**Prerequisite:** Slices 1 and 2 complete. `analytics.js` live on all 13 HTML pages. `window.getAttributionData()` and wrapped `window.trackLeadEvent` available site-wide.

---

## Purpose

Remove three duplicated attribution implementations and make `analytics.js` the only source of truth for session creation and attribution reads.

| File | Duplicate to remove | Replace with |
| ---- | ------------------- | ------------ |
| `js/chatbot.js` | `initAttribution()` IIFE, local `getAttribution()` | `window.getAttributionData()` + `window.buildLeadAttribution()` |
| `js/newsletter.js` | Local `getAttribution()` IIFE | `window.buildLeadAttribution()` |
| `home-valuation.html` | Inline `getAttribution()` IIFE, local `session_id` generation | `window.buildLeadAttribution()` + shared `session_id` |

**Side effect fixed by this slice:** `pageViewCount` is currently incremented twice per page load (`analytics.js` in head, then `chatbot.js` `initAttribution()` in body). Deleting `initAttribution()` restores single-increment behavior.

---

## 1. `js/chatbot.js`

### 1a) DELETE entirely

| Block | Lines (current) | Reason |
| ----- | --------------- | ------ |
| `initAttribution()` IIFE | 8-73 | Duplicates `analytics.js` `initSessionSync()`; causes double `pageViewCount` increment |
| `getAttribution()` helper | 75-81 | Replaced by `window.getAttributionData()` |

Also remove the block comment at lines 4-7 (`/* === AgentPulse Attribution Layer === */`) since attribution ownership moves to `analytics.js`.

### 1b) REPLACE in `saveAndShowMatches()`

**Current (line 189):**

```javascript
const attribution = getAttribution();
```

**Refactor:**

```javascript
const attribution = window.getAttributionData();
```

Map snake_case API fields to existing camelCase `lead` JSON fields. Output shape of `agentpulse_leads` entries stays backward compatible; new fields are additive only.

| `getAttributionData()` field | `lead` field | Notes |
| ---------------------------- | ------------ | ----- |
| `session_id` | `sessionId` | Use `null` if `session_id === 'sess-unavailable'` |
| `source_category` | `source` | Fallback: `'Website Chatbot'` |
| `source_detail` | `sourceDetail` | |
| `referrer` | `referrer` | |
| `referrer_domain` | `referrerDomain` | **NEW**, additive |
| `utm_source` | `utmSource` | Empty string from API becomes `null` if desired for parity |
| `utm_medium` | `utmMedium` | |
| `utm_campaign` | `utmCampaign` | |
| `utm_term` | `utmTerm` | **NEW**, additive |
| `utm_content` | `utmContent` | **NEW**, additive |
| `landing_page` | `landingPage` | Fallback: `window.location.pathname` |
| `page_view_count` | `pageViewsBeforeCapture` | Fallback: `1` |

**Null-safety:** `getAttributionData()` always returns an object (never `null`). Use field values directly; apply fallbacks only where specified above.

### 1c) REPLACE in `emitEvent()`

**Current (line 308):**

```javascript
const attribution = getAttribution();
```

**Refactor:**

```javascript
const attribution = window.getAttributionData();
```

| `getAttributionData()` field | Event field | Fallback |
| ---------------------------- | ----------- | -------- |
| `session_id` | `sessionId` | `null` if `'sess-unavailable'` |
| `source_category` | `source` | `'Direct'` |

All other `emitEvent()` behavior unchanged (`agentpulse_events` localStorage, 200-event cap, timestamp, page path).

### 1d) DECISION: `handleNewsletterSubmit()` inline attribution (lines 374-385)

**Decision: YES  -  refactor for consistency.**

**Current:** Inline IIFE at submit time reads `document.referrer`, classifies with minimal host check, returns `{ source, landing_page, referrer }` with lowercase `'direct'` or raw hostname.

**Refactor:** Replace inline IIFE with:

```javascript
attribution: window.buildLeadAttribution()
```

Same shared helper as `newsletter.js` (see Section 2b and Section 4). Ensures newsletter leads captured via Enter-key submit path (`event.type === 'submit'`) use the same persisted session attribution as button-click path.

**Scope note:** `handleNewsletterSubmit` lives in `chatbot.js` but serves the newsletter form. Refactoring it is part of slice 3 chatbot.js work even though the primary newsletter handler is in `newsletter.js`.

### 1e) Netlify POST  -  unchanged

`saveAndShowMatches()` Netlify POST (lines 227-251) continues to send only `source` as the attribution field:

```javascript
formData.append('source', lead.source);
```

No changes to Netlify field names or payload shape in slice 3. Full attribution remains in `agentpulse_leads` localStorage only.

GA4 `generate_lead` call unchanged; wrapped `trackLeadEvent` in `analytics.js` already merges attribution server-side.

---

## 2. `js/newsletter.js`

### 2a) DELETE local `getAttribution()` (lines 5-30)

Remove the entire inner function and its referrer/UTM classification logic.

### 2b) REPLACE consumer at line 65

**Current:**

```javascript
attribution: getAttribution()
```

**Refactor:**

```javascript
attribution: window.buildLeadAttribution()
```

`buildLeadAttribution()` is exposed from `analytics.js` (see Section 4). No local copy in `newsletter.js`.

**Return shape** (matches prior contract + additive fields):

| `getAttributionData()` source | `buildLeadAttribution()` output | Notes |
| ----------------------------- | ------------------------------- | ----- |
| `source_category` | `source` | Title-case classifier (`'Direct'`, `'Google'`, etc.) |
| `utm_source` | `utm_source` | |
| `utm_medium` | `utm_medium` | |
| `utm_campaign` | `utm_campaign` | |
| `landing_page` | `landing_page` | |
| `referrer` | `referrer` | |
| `session_id` | `session_id` | **Additive** |
| `referrer_domain` | `referrer_domain` | **Additive** |
| `utm_term` | `utm_term` | **Additive** |
| `utm_content` | `utm_content` | **Additive** |

### 2c) Backward compatibility note

The `source` field in newsletter `agentpulse_leads` entries shifts from:

- **Before:** lowercase `'direct'`, raw hostname (e.g. `chatgpt.com`), or minimal classifier
- **After:** title-case classifier labels from `analytics.js` (`'Direct'`, `'Google'`, `'ChatGPT'`, `'Referral'`, etc.)

**Acceptable.** AgentPulse Phase C will categorize server-side from GA4 raw signals. localStorage values become consistent across chatbot, newsletter, and seller valuation forms.

Netlify POST for newsletter remains email-only (`form-name`, `email`, `bot-field`). No Netlify changes in slice 3.

---

## 3. `home-valuation.html`

### 3a) DELETE inline `getAttribution()` (lines 259-284)

Remove the entire inner function inside the seller lead capture IIFE.

### 3b) REPLACE locally generated `session_id` (line 311)

**Current:**

```javascript
session_id: 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
```

**Refactor:**

```javascript
session_id: getSharedSessionIdOrFallback()
```

**`getSharedSessionIdOrFallback()` behavior:**

1. Call `window.getAttributionData().session_id`
2. If value exists and is not `'sess-unavailable'`, return it
3. Else fall back to locally generated ID: `'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)` (preserves current defensive degradation if `analytics.js` fails)

**Format change (happy path):** Shared session uses `sess-{timestamp}-{random}` (hyphen, from `analytics.js`). Fallback retains legacy `sess_{timestamp}_{random}` (underscore) only when analytics is unavailable.

### 3c) REPLACE `attribution` field

**Current (line 312):**

```javascript
attribution: getAttribution()
```

**Refactor:**

```javascript
attribution: window.buildLeadAttribution()
```

Same field mapping and additive fields as Section 2b.

### 3d) Shared helper vs inline duplication

**Decision: Expose `window.buildLeadAttribution()` from `analytics.js`.**

| Option | Verdict |
| ------ | ------- |
| Duplicate `buildLeadAttribution()` inline in `home-valuation.html` | Rejected  -  three copies defeats single source of truth |
| Expose `window.buildLeadAttribution()` from `analytics.js` | **Adopted**  -  one implementation, all three consumers share it |

`getSharedSessionIdOrFallback()` may remain a small inline function in `home-valuation.html` (valuation-specific, one consumer) OR be folded into `analytics.js` as `window.getSharedSessionIdOrFallback()`. **Recommendation:** keep inline in `home-valuation.html` only; it is 5 lines and valuation-specific. If preferred for symmetry, can expose from `analytics.js` in the same additive change.

---

## 4. Additions to `analytics.js`

Slice 3 includes a small additive change to `analytics.js`. Existing public API (`getAttributionData`, wrapped `trackLeadEvent`) unchanged.

### New public function

```javascript
window.buildLeadAttribution(extraFields)
```

**Purpose:** Thin wrapper around `getAttributionData()` that formats output for `lead.attribution` consumption in `newsletter.js`, `home-valuation.html`, and `handleNewsletterSubmit()`.

**Parameters:**

| Param | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `extraFields` | `object` | No | Shallow-merged into result after base mapping (caller overrides) |

**Returns:**

```javascript
{
  source: string,           // from source_category
  utm_source: string,
  utm_medium: string,
  utm_campaign: string,
  landing_page: string,
  referrer: string,
  session_id: string,       // additive
  referrer_domain: string,  // additive
  utm_term: string,         // additive
  utm_content: string       // additive
}
```

**Implementation sketch (ES5, consistent with existing file):**

1. `var data = window.getAttributionData()` (call internal `mapSessionToPublic(loadSession())` directly inside IIFE to avoid recursion)
2. Build result object with field mapping from Section 2b
3. If `extraFields` provided, shallow-copy recognized keys onto result
4. Return result

**JSDoc header update:** Add `buildLeadAttribution` to Public API list in file header comment.

**Version bump:** `1.0.0` → `1.1.0` (additive public API, no breaking changes).

### Optional addition

```javascript
window.getSharedSessionIdOrFallback()
```

Returns `getAttributionData().session_id` if valid, else generates `sess_{ts}_{rand}` fallback. Only needed if inline helper in `home-valuation.html` is rejected during review.

---

## 5. Out of scope for slice 3

| Item | Defer to |
| ---- | -------- |
| Removing duplicated gtag config block from 12 HTML pages | Future slice |
| Adding attribution fields to Netlify POST payloads | Future slice |
| Changing GA4 event params on conversion calls | Already correct via slice 1 `trackLeadEvent` wrapping |
| `llms.txt` updates | Slice 4 |
| Refactoring `chatbot.js` `saveAndShowMatches()` to use `buildLeadAttribution()` for camelCase lead fields | Optional follow-up; slice 3 uses direct `getAttributionData()` mapping in 1b to preserve exact camelCase lead shape |
| Removing `trackPageView()` / `emitEvent('page_view')` overlap with `page_view_enriched` | Future instrumentation review |

---

## 6. Rollback plan

If slice 3 breaks production after deploy:

1. `git revert <slice-3-commit-hash>`
2. `git push origin main`
3. Netlify auto-deploys reverted state

**What remains after revert:**

- `analytics.js` stays on all 13 pages (slices 1-2 unaffected)
- `chatbot.js` / `newsletter.js` / `home-valuation.html` return to pre-slice-3 duplicate logic
- Site continues working as before slice 3 (with double `pageViewCount` increment restored)

**Rollback does not require** reverting slices 1 or 2.

---

## 7. Test plan after slice 3 deploy

Run in a browser with DevTools open (Network + Application tabs). Use test data only; do not use real client PII.

### a) Baseline page load

1. Open `https://thesuepattigroup.ai` in a fresh tab (or incognito)
2. Network tab: filter `collect`
3. Confirm GA4 requests return **HTTP 204**
4. Console: `window.getAttributionData()` returns object with `session_id`, `source_category`

### b) Chatbot buyer flow

1. Complete chatbot with test name/email (e.g. `Test User`, `test@example.com`)
2. Network tab: confirm `generate_lead` event fires via `trackLeadEvent`
3. Application tab → Local Storage → `agentpulse_leads`
4. Confirm newest chatbot lead has:
   - `sessionId` matching `getAttributionData().session_id`
   - `source` (title-case, from `source_category`)
   - `sourceDetail`, `referrer`, `utmSource`, `landingPage`, `pageViewsBeforeCapture`
   - **NEW:** `referrerDomain`, `utmTerm`, `utmContent` present (may be empty string)

### c) Seller valuation

1. Open `https://thesuepattigroup.ai/home-valuation.html`
2. Submit test seller form
3. Check `agentpulse_leads` newest seller entry:
   - `session_id` matches analytics session (`sess-{ts}-{rand}` hyphen format)
   - **NOT** locally generated `sess_` unless analytics failed
   - `attribution.source` is title-case classifier
   - `attribution.session_id` present (additive)

### d) Newsletter signup

1. Submit footer newsletter with test email
2. Check `agentpulse_leads` newest newsletter entry:
   - `attribution.source` is title-case (`'Direct'`, not `'direct'`)
   - `attribution.session_id` present
3. Repeat via Enter-key submit (not just button click) to verify `handleNewsletterSubmit` refactor

### e) Regression checks

| Check | Expected |
| ----- | -------- |
| `pageViewCount` in `agentpulse_session` | Increments by **1** per page navigation (not 2) |
| Chatbot still renders on `index.html` and `contact.html` | Yes |
| Newsletter success message still appears | Yes |
| Seller valuation success HTML still replaces form | Yes |
| Netlify form submissions still POST (check Network for `/` POST) | Yes |

---

## 8. Implementation order (recommended)

Execute in this sequence to minimize risk:

1. **`analytics.js`**  -  Add `window.buildLeadAttribution()` (+ optional `getSharedSessionIdOrFallback()`)
2. **`js/chatbot.js`**  -  Delete duplicates; update `saveAndShowMatches`, `emitEvent`, `handleNewsletterSubmit`
3. **`js/newsletter.js`**  -  Delete local `getAttribution()`; use `buildLeadAttribution()`
4. **`home-valuation.html`**  -  Delete inline `getAttribution()`; use shared session_id + `buildLeadAttribution()`

**Commit suggestion:** Single commit for all four files, message:  
`phase A slice 3: deduplicate attribution to shared analytics.js helpers`

**Files touched:** 4 (`js/analytics.js`, `js/chatbot.js`, `js/newsletter.js`, `home-valuation.html`)  
**HTML pages touched:** 1 (`home-valuation.html` only)  
**No changes** to the other 12 HTML pages.

---

## 9. Sign-off checklist

Before implementation begins, confirm:

- [ ] `buildLeadAttribution()` exposed from `analytics.js` (not duplicated inline)
- [ ] `initAttribution()` deletion accepted (fixes double pageViewCount)
- [ ] Title-case `source` shift in newsletter/valuation localStorage acceptable
- [ ] Netlify POST payloads unchanged in slice 3
- [ ] Rollback plan understood
- [ ] Test plan approved

**Approver:** Dr. Zubia Mughal  
**Date:** _pending_
