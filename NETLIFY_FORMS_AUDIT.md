# Netlify Forms Registration & Lead Capture Wiring Audit

**Site:** thesuepattigroup.ai  
**Repo:** `C:\Users\zumah\OneDrive\Desktop\JAson\thesuepattigroup_ai_updated`  
**Branch:** `main`  
**Audit date:** 2026-05-18  
**Scope:** READ-ONLY diagnostic — no source files modified except this report.

---

## Step 0 — Working state

| Check | Result |
|-------|--------|
| **pwd** | `C:\Users\zumah\OneDrive\Desktop\JAson\thesuepattigroup_ai_updated` |
| **git branch** | `main` |
| **git status** | On branch main, up to date with `origin/main`, **working tree clean** |

---

## Step 1 — Site-wide `<form>` inventory

**Command:** `grep -rn "<form" --include="*.html" .`

**13 matches — all identical newsletter footer forms:**

| File | Line | Opening tag (verbatim) |
|------|------|------------------------|
| `index.html` | 542 | `<form class="newsletter-form" onsubmit="return false;">` |
| `about.html` | 220 | `<form class="newsletter-form" onsubmit="return false;">` |
| `contact.html` | 170 | `<form class="newsletter-form" onsubmit="return false;">` |
| `home-valuation.html` | 222 | `<form class="newsletter-form" onsubmit="return false;">` |
| `sold-homes.html` | 422 | `<form class="newsletter-form" onsubmit="return false;">` |
| `reviews.html` | 258 | `<form class="newsletter-form" onsubmit="return false;">` |
| `search.html` | 186 | `<form class="newsletter-form" onsubmit="return false;">` |
| `neighborhoods.html` | 406 | `<form class="newsletter-form" onsubmit="return false;">` |
| `how-to-choose-a-realtor.html` | 415 | `<form class="newsletter-form" onsubmit="return false;">` |
| `team-vs-solo-agent.html` | 232 | `<form class="newsletter-form" onsubmit="return false;">` |
| `dousman.html` | 278 | `<form class="newsletter-form" onsubmit="return false;">` |
| `ixonia.html` | 276 | `<form class="newsletter-form" onsubmit="return false;">` |
| `oconomowoc.html` | 283 | `<form class="newsletter-form" onsubmit="return false;">` |

### Per-form attribute audit (all 13 forms — same pattern)

| Attribute | Present? | Value |
|-----------|----------|-------|
| `data-netlify="true"` | **No** | — |
| `name="..."` | **No** | — |
| `netlify-honeypot="..."` | **No** | — |
| `action="..."` | **No** | — |
| `method="..."` | **No** | — |
| Other notable attrs | Yes | `class="newsletter-form"`, `onsubmit="return false;"` |

**Inner fields (typical footer form):**

```html
<input type="email" placeholder="you@email.com" required />
<button type="submit">Subscribe</button>
<div class="newsletter-status"></div>
```

No `name` attributes on inputs. Submission is handled by `js/newsletter.js` click handler, not native form POST.

### Non-`<form>` lead UIs (also relevant)

| Mechanism | Container | HTML form? |
|-----------|-----------|------------|
| Chatbot | `#chatbot-body` on `index.html`, `contact.html` | **No** — dynamically injected inputs/buttons |
| Home valuation | `.valuation-form` on `home-valuation.html` | **No** — `<div>` + `#hv_*` fields + `#hv_submit` button |

---

## Step 2 — Netlify Forms hidden-field patterns

**Commands:**

```text
grep -rn "form-name" --include="*.html" .     → 0 matches
grep -rn "data-netlify" --include="*.html" .  → 0 matches
grep -rn "netlify-honeypot" --include="*.html" . → 0 matches
```

### Classification

| Form instance | Netlify registration status |
|---------------|----------------------------|
| All 13 × `.newsletter-form` | **NOT REGISTERED** — no `data-netlify`, no `name`, no hidden `form-name` |
| Chatbot (JS-rendered) | **NOT REGISTERED** — not an HTML form |
| Home valuation (`.valuation-form`) | **NOT REGISTERED** — not an HTML form |

**Site-wide:** Zero Netlify Forms wiring detected in HTML.

---

## Step 3 — `js/chatbot.js` submission audit

**Loaded on:** all 13 HTML pages that include `chatbot.js`  
**UI visible on:** `index.html`, `contact.html` only (`#chatbot-body` present). Other pages still run attribution + page-view tracking.

### A) Where leads are written after capture

**Primary storage — `localStorage` key `agentpulse_leads`:**

```javascript
// lines 220-223
const existing = JSON.parse(localStorage.getItem('agentpulse_leads') || '[]');
existing.unshift(lead);
localStorage.setItem('agentpulse_leads', JSON.stringify(existing));
```

**Secondary storage — `localStorage` key `agentpulse_events`:**

```javascript
// lines 276-289 (emitEvent)
const events = JSON.parse(localStorage.getItem('agentpulse_events') || '[]');
events.unshift({ type, data, sessionId, source, timestamp, page });
localStorage.setItem('agentpulse_events', JSON.stringify(events));
```

**Session attribution — `localStorage` key `agentpulse_session`:**

```javascript
// lines 63, 69 (initAttribution)
localStorage.setItem('agentpulse_session', JSON.stringify(session));
```

**Not found:**

- No `fetch()` calls
- No `form.submit()`
- No POST to `/.netlify/functions/*`
- No external API endpoints

### B) GA4 via `window.trackLeadEvent`

```javascript
// lines 227-236
if (typeof window.trackLeadEvent === 'function') {
  window.trackLeadEvent('generate_lead', {
    lead_type: 'buyer',
    capture_source: 'chatbot',
    score: score,
    status: status,
    budget: budgetMap[answers.budget] || 400000,
    area: answers.area,
    timeline: answers.timeline
  });
}
```

Guard: only fires if `trackLeadEvent` is defined (defined inline in page `<head>` on GA4-enabled pages).

### C) Netlify form name reference

**None.** No references to `chatbot-lead`, `data-netlify`, or Netlify form names anywhere in `chatbot.js`.

### Lead object schema (chatbot)

Fields written at lines 191-217: `id`, `sessionId`, `lead_type: 'buyer'`, `capture_source: 'chatbot'`, `name`, `email`, `phone`, `area`, `budget`, `beds`, `pa`, `timeline`, `days`, `score`, `status`, `source`, `sourceDetail`, `referrer`, `utmSource`, `utmMedium`, `utmCampaign`, `landingPage`, `pageViewsBeforeCapture`, `property`, `note`, `timestamp`.

---

## Step 4 — `js/newsletter.js` submission audit

**Loaded on:** same 13 pages as chatbot (footer newsletter on each).

### A) Where email is written

**`localStorage` key `agentpulse_leads`:**

```javascript
// lines 68-71
var existing = JSON.parse(localStorage.getItem('agentpulse_leads') || '[]');
existing.unshift(lead);
localStorage.setItem('agentpulse_leads', JSON.stringify(existing));
```

**Not found:**

- No `fetch()`
- No Netlify Functions
- No native HTML form POST (click handler calls `e.preventDefault()` at line 47)

### B) GA4 event

```javascript
// lines 75-80
if (typeof window.trackLeadEvent === 'function') {
  window.trackLeadEvent('newsletter_signup', {
    lead_type: 'newsletter',
    capture_source: 'footer_newsletter',
    page: window.location.pathname
  });
}
```

### C) Netlify form name

**None.** No `newsletter-signup` or other Netlify form name.

### Lead object schema (newsletter)

Lines 58-66: `id`, `lead_type: 'newsletter'`, `capture_source: 'footer_newsletter'`, `email`, `timestamp`, `page`, `attribution` (nested object with `source`, UTM fields, `landing_page`, `referrer`).

---

## Step 5 — `home-valuation.html` submission audit

### A) Fields collected

No `<form>` tag. Fields are standalone inputs/selects by `id`:

| Field | Element | `name` attr | ID |
|-------|---------|-------------|-----|
| Property Address | `<input type="text">` | none | `hv_address` |
| City | `<select>` | none | `hv_city` |
| Zip Code | `<input type="text">` | none | `hv_zip` |
| Bedrooms | `<select>` | none | `hv_beds` |
| Square Feet | `<input type="text">` | none | `hv_sqft` |
| Selling timeline | `<select>` | none | `hv_timeline` |
| Your Name | `<input type="text">` | none | `hv_name` |
| Phone | `<input type="tel">` | none | `hv_phone` |
| Email | `<input type="email">` | none | `hv_email` |

Submit control: `<button class="chatbot-submit" id="hv_submit" type="button">` (line 207).

### B) Netlify Forms wiring

**None.** No `data-netlify`, no form `name`, no honeypot, no hidden `form-name` input.

### C) Submission routing (inline script, lines 237-341)

Click handler on `#hv_submit`:

1. Validates `name`, `phone`, `email`, `address`
2. Builds lead object with nested `data` and `attribution`
3. **`localStorage.setItem('agentpulse_leads', ...)`** via `existing.push(lead)` (lines 309-312)
4. Replaces `.valuation-form` innerHTML with thank-you message (lines 327-338)

No network submission. No Netlify POST.

### D) GA4 event

**Event fired:** `generate_lead` (not `seller_valuation_request`)

```javascript
// lines 316-323
if (typeof window.trackLeadEvent === 'function') {
  window.trackLeadEvent('generate_lead', {
    lead_type: 'seller',
    capture_source: 'home_valuation_form',
    city: val('hv_city'),
    zip: val('hv_zip'),
    timeline: val('hv_timeline')
  });
}
```

**`seller_valuation_request`:** **not found** anywhere in the repo.

---

## Step 6 — `netlify.toml`

**File exists:** **No** (`Test-Path netlify.toml` → `False`)

No form-related Netlify configuration in repo. Deploy is static HTML publish (per `DEPLOYMENT.md`: empty build command, publish root).

---

## Step 7 — Netlify Functions directories

**Commands:**

```text
find . -type d -name "functions"   → no matches (excluding node_modules)
find . -type d -name "netlify"     → no matches
```

**No `netlify/functions/` or serverless handlers in this repo.** Lead capture pattern is **browser localStorage only**.

---

## Step 8 — GA4 event firing site-wide

**Command:** `grep -rn "trackLeadEvent\|gtag('event'" --include="*.html" --include="*.js" .`

### `trackLeadEvent` definition (13 HTML pages)

Each GA4-enabled page defines in `<head>`:

```javascript
window.trackLeadEvent = function(eventName, params) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params || {});
  }
};
```

Guard inside helper: only fires if `gtag` is a function.

### Conversion events actually fired

| File | Line | Event name | Guard | When |
|------|------|------------|-------|------|
| `js/chatbot.js` | 228 | `generate_lead` | `typeof trackLeadEvent === 'function'` | After chatbot lead saved |
| `js/newsletter.js` | 76 | `newsletter_signup` | same | After newsletter email saved |
| `home-valuation.html` | 317 | `generate_lead` | same | After seller valuation saved |

**No other `trackLeadEvent(...)` call sites.** No direct `gtag('event', ...)` calls outside the helper definition.

**Note:** Chatbot and home valuation both use **`generate_lead`**; differentiated only by `lead_type` param (`buyer` vs `seller`).

---

## Step 9 — Final wiring report

| Mechanism | File(s) | Fields captured | Netlify Form name | Netlify status | GA4 event | Persistent storage today |
|-----------|---------|-----------------|-------------------|----------------|-----------|--------------------------|
| **Chatbot (buyer)** | `js/chatbot.js`, `index.html`, `contact.html` (`#chatbot-body`) | area, budget, beds, preApproved, timeline, name, email, phone (+ scored metadata) | none | **NOT REGISTERED** | `generate_lead` (`lead_type: buyer`, `capture_source: chatbot`) | `localStorage`: `agentpulse_leads`, `agentpulse_events`, `agentpulse_session` |
| **Home valuation (seller)** | `home-valuation.html` (inline script) | address, city, zip, beds, sqft, timeline, name, phone, email | none | **NOT REGISTERED** | `generate_lead` (`lead_type: seller`, `capture_source: home_valuation_form`) — **not** `seller_valuation_request` | `localStorage`: `agentpulse_leads` only |
| **Newsletter** | `js/newsletter.js`, footer on 13 HTML pages | email (+ page path, attribution) | none | **NOT REGISTERED** | `newsletter_signup` | `localStorage`: `agentpulse_leads` |
| **Page attribution** | `js/chatbot.js` (all pages loading script) | referrer, UTM, sessionId, page views | none | N/A (not a form) | none (uses `emitEvent('page_view')` internally) | `localStorage`: `agentpulse_session`, `agentpulse_events` |

### Gaps identified

1. **Zero Netlify Forms registration** — No `data-netlify="true"`, no form `name`, no hidden `form-name` inputs anywhere. Netlify Forms dashboard will show **no forms** and **no submissions** from production traffic.

2. **All leads are browser-local only** — `agentpulse_leads` in `localStorage` is per-device, per-browser, cleared if user clears site data, invisible to Jason/AgentPulse server-side polling.

3. **GA4 fires without server-side persistence** — All three mechanisms send conversion events to GA4 when `trackLeadEvent` exists, but **none** POST to Netlify or any backend. Analytics ≠ lead CRM.

4. **Inconsistent lead JSON schemas** across mechanisms:
   - Chatbot: flat object, `unshift`, has `id`, rich buyer fields
   - Newsletter: flat + nested `attribution`, `unshift`, has `id`
   - Seller form: nested `data` object, `push` (not unshift), **no top-level `id`**, uses `session_id` not `sessionId`

5. **Newsletter HTML forms lack `name` attributes** — Even if Netlify wiring were added, fields need `name` for Netlify to store field values.

6. **Home valuation is not a `<form>`** — Would need structural change or JS `fetch` POST to Netlify endpoint for server capture.

7. **Chatbot has no HTML form at build time** — Netlify detects forms at deploy from static HTML; dynamically rendered chatbot fields are **not** auto-discovered unless a hidden static form is added for registration.

8. **Phase 6 Netlify Forms API pull blocked** — Without registered forms + POST submissions, AgentPulse cannot poll Netlify Submissions API for leads from this site as currently built.

9. **Documentation mismatch** — `DEPLOYMENT.md` instructs verifying `agentpulse_leads` in localStorage (lines 82-84, 211), confirming localStorage-first design — not Netlify Forms.

10. **Expected event name mismatch** — Task spec referenced `seller_valuation_request`; implementation uses `generate_lead` for seller leads.

---

## Step 10 — Recommendations (no code changes)

Minimum work to route all three mechanisms through Netlify Forms for Phase 6 API polling:

### 1. Add three static Netlify-registered forms (hidden or dedicated pages)

| Form | Suggested `name` | File to edit | Change | Risk |
|------|------------------|--------------|--------|------|
| Newsletter | `newsletter-signup` | Each footer form **or** one hidden form in `index.html` | Add `name="newsletter-signup"`, `method="POST"`, `data-netlify="true"`, `data-netlify-honeypot="bot-field"`, hidden `<input type="hidden" name="form-name" value="newsletter-signup">`, `name="email"` on input | **LOW** if JS also POSTs via fetch; **MEDIUM** if switching from localStorage-only |
| Chatbot buyer | `chatbot-lead` | `index.html` + `contact.html` (or shared partial) | Hidden static form with all field names Netlify expects; JS submits via `fetch('/', { method: 'POST', body: FormData })` on completion | **MEDIUM** — must mirror chatbot field set |
| Seller valuation | `home-valuation` | `home-valuation.html` | Wrap fields in `<form name="home-valuation" data-netlify="true" ...>` OR POST FormData from existing click handler | **MEDIUM** — changes success UX flow slightly |

### 2. Update JS to POST to Netlify (keep localStorage as optional cache)

| File | Change | Risk |
|------|--------|------|
| `js/chatbot.js` | After `localStorage` save, build `FormData` and `fetch('/')` with encoded form fields + `form-name` | **MEDIUM** — test CORS/Netlify 200 response |
| `js/newsletter.js` | Same pattern on subscribe click | **LOW** |
| `home-valuation.html` inline script | Same pattern on `#hv_submit` | **MEDIUM** |

### 3. Standardize lead schema before AgentPulse ingest

| File | Change | Risk |
|------|--------|------|
| All three capture paths | Align on common fields: `id`, `lead_type`, `capture_source`, `email`, `timestamp`, flat attribution keys | **LOW** additive; **HIGH** if replacing localStorage contract AgentPulse demo already reads |

### 4. Add `netlify.toml` (optional but recommended)

| File | Change | Risk |
|------|--------|------|
| `netlify.toml` (new) | `[build] publish = "."` — documents deploy; forms still HTML-driven | **LOW** |

### 5. GA4 event naming (optional)

| File | Change | Risk |
|------|--------|------|
| `home-valuation.html` | Rename event to `seller_valuation_request` if GA4 reports depend on that name | **LOW** — reporting continuity only |

### 6. Verify in Netlify UI after deploy

- Deploy with forms in static HTML
- Netlify dashboard → **Forms** should list 3 forms
- Submit test on production URL
- Confirm submissions appear before wiring AgentPulse Phase 6 poller

---

## Summary

**Current architecture:** Static site on Netlify with **localStorage-based lead capture** and **GA4 conversion events**. **Netlify Forms is not wired at all.**

**Production impact today:** Jason receives no server-side lead notifications from form submissions. Leads exist only in each visitor's browser until/unless AgentPulse or another integration reads localStorage (demo pattern) or manual export is done.

**Phase 6 prerequisite:** Register forms in HTML, POST submissions to Netlify, then poll Netlify Submissions API — none of which is implemented yet.

---

*End of audit. No source code modified. No git commit.*
