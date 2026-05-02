# thesuepattigroup.ai

The Sue Patti Group | Realty Executives Integrity Lake Country
Built and operated by Dr. Data Decision Intelligence LLC

## What this is

A static, SEO/GEO/AEO-optimized website for The Sue Patti Group with embedded lead capture chatbot and a private intelligence dashboard. Phase 1 of the AgentPulse delivery for Jason Patti.

## Site structure

```
thesuepattigroup.ai/
├── index.html              Home with combined branding, scrolling sales/reviews
├── search.html             Active listings (Realtor.com link-out)
├── neighborhoods.html      6 deep Lake Country guides
├── sold-homes.html         400+ sales track record
├── reviews.html            60+ verified 5-star team testimonials
├── home-valuation.html     Free seller valuation form
├── about.html              Sue + Jason bios, partner cards
├── contact.html            Chatbot + direct contact
├── dashboard.html          Private agent intelligence dashboard
├── sitemap.xml             Google crawler indexing
├── robots.txt              Search engine + AI bot directives
├── llms.txt                AI engine discoverability standard
├── css/style.css           Master brand stylesheet
├── js/chatbot.js           Lead capture with dashboard event stream
└── assets/                 Images and team photos
```

## Brand specifications

**Domain:** thesuepattigroup.ai (Namecheap, 2-year registration)

**Identity:**
- The Sue Patti Group
- Realty Executives Integrity Lake Country
- 810 Cardinal Lane, Hartland, WI 53029
- (262) 370-7990
- info@thesuepattigroup.ai

**Tagline:** Discover Lake Country
**Headline stats:** 41 years. 522 combined homes sold. 60+ verified 5-star reviews.

**Brand colors:**
- Navy `#2D3E50` (primary)
- Teal `#3ABFBF` (action)
- Mint `#C8E8E5` (accent)
- Coral `#E8604A` (alerts)
- Gold `#F5C842` (highlights)
- Cream `#F0EDE8` (backgrounds)

**Typography:**
- Headings: Trebuchet MS
- Body: Calibri
- Metadata: Courier New

## SEO / GEO / AEO infrastructure

This site is built for tomorrow's search. All four discoverability layers are present:

1. **Schema.org JSON-LD** on every page (RealEstateAgent, Place, Review, Service, ContactPage)
2. **llms.txt** at the root (AI engine standard for ChatGPT, Claude, Perplexity, Gemini)
3. **Hyperlocal content depth** in neighborhoods.html (schools, lakes, demographics)
4. **Lead capture event stream** wired to `localStorage` for dashboard intelligence

## Lead capture mechanics

The chatbot collects 6 data points (area, budget, beds, pre-approval status, timeline, contact info) and:

- Calculates a 1-10 lead score
- Categorizes as hot/warm/cold
- Saves to `localStorage` keys:
  - `agentpulse_leads` (lead records)
  - `agentpulse_events` (full event stream)
- Triggers the "all three" promise screen (text + email + 15-min call)
- Routes TJ Milewski intro for non-pre-approved buyers

## Deployment

See `DEPLOYMENT.md` in this repo for the complete GitHub → Netlify → Namecheap DNS walkthrough.

Quick reference:
1. Push to GitHub: `github.com/Zmugha1/thesuepattigroup.ai`
2. Connect to Netlify (build command: none, publish directory: root)
3. Update Namecheap DNS to point to Netlify nameservers
4. SSL provisions automatically via Netlify

## Maintenance

$99/month retainer with Dr. Data Decision Intelligence LLC starting July 2026.

Includes:
- Monthly SEO health check
- Schema markup updates
- New listings/sales/reviews added monthly
- Phase 2 dashboard wire-in (Realtor.com API)
- Phase 3 voicemail capture (when launched)

## Contact

**Builder:** Dr. Zubia Mughal, Ed.D.
**Company:** Dr. Data Decision Intelligence LLC
**Email:** zubiamL4L@gmail.com
**Website:** drdatadecisionintelligence.com
