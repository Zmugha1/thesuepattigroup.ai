# The Sue Patti Group — Agent Notes (CLAUDE.md)

Last updated: 2026-07-16

## Repo

- Path: `thesuepattigroup_ai_updated`
- Remote: `github.com/Zmugha1/thesuepattigroup.ai`
- Branch: `main`
- Stack: static HTML / CSS / JS on Netlify (no `package.json`, no React build)

## How Jason updates listings

Edit **one file only**:

`src/data/listings.js`

Then commit and push. `js/listings-render.js` reads that file and fills:

- Home Coming Soon (`#listings-coming-soon`)
- Search featured (`#listings-featured`)

Status values: `active` | `under_contract` | `sold`

Sold cards sort below active and show a SOLD overlay.

## Sold homes photos

All sold-home card photos must be **local** under `assets/images/sold/`.

Do not use `photos.zillowstatic.com` on listing cards (browser hotlink protection shows grey blocks).

## Key session commits (2026-07-16)

| Commit | What |
|--------|------|
| `10c47a5` | Centralize listing data in `src/data/listings.js` |
| `e978eb0` | Mark Alberta $795K as sold (closed July 17, 2026) |
| `42b8e37` | Host former Zillow photos locally; add Alberta to sold-homes |

## Do not touch unless asked

- `js/analytics.js`
- AgentPulse / dashboard work
- Em dashes in HTML copy
