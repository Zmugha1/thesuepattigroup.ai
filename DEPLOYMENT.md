# Deployment Guide | thesuepattigroup.ai

Complete step-by-step deployment from local files to live site at https://thesuepattigroup.ai

Total time: 30-45 minutes
Total cost beyond what you've already paid: $0

---

## Step 1. Push to GitHub (10 minutes)

### Prerequisites
- GitHub repo already created at: https://github.com/Zmugha1/thesuepattigroup.ai
- Git installed on your machine
- You have the unzipped folder on your computer

### Commands to run in PowerShell (Windows)

```powershell
# Navigate to the unzipped folder
cd path\to\thesuepattigroup.ai

# Initialize git
git init

# Add all files (specific files, not git add .)
git add index.html
git add search.html
git add neighborhoods.html
git add sold-homes.html
git add reviews.html
git add home-valuation.html
git add about.html
git add contact.html
git add dashboard.html
git add sitemap.xml
git add robots.txt
git add llms.txt
git add README.md
git add DEPLOYMENT.md
git add css/
git add js/
git add assets/

# Commit
git commit -m "init: Sue Patti Group website Phase 1 launch"

# Add remote (the repo URL)
git remote add origin https://github.com/Zmugha1/thesuepattigroup.ai.git

# Push to main branch
git branch -M main
git push -u origin main
```

If you see an authentication prompt, use your GitHub username and a Personal Access Token (not password). Generate a token at: https://github.com/settings/tokens

---

## Step 2. Deploy to Netlify (10 minutes)

### Sign up / log in to Netlify
- Go to https://app.netlify.com
- Sign in with your GitHub account (easiest)

### Connect the repo
1. Click **Add new site** → **Import an existing project**
2. Choose **Deploy with GitHub**
3. Authorize Netlify to access your repos
4. Select **Zmugha1/thesuepattigroup.ai**

### Build settings
- **Branch to deploy:** main
- **Build command:** *(leave empty)* — this is a static site
- **Publish directory:** *(leave empty or use a single dot `.`)*
- Click **Deploy site**

Netlify will deploy in 30-60 seconds. You will get a temporary URL like `wonderful-curie-1a2b3c.netlify.app`. Test the site there first.

### Verify everything works
- Click around all 9 pages
- Test the chatbot (six questions, lead captures to console/localStorage)
- Open the dashboard at `/dashboard.html`
- Open dev tools and confirm `localStorage` has `agentpulse_leads` after a chatbot submission

---

## Step 3. Connect Custom Domain (15 minutes)

### In Netlify

1. Go to your site dashboard
2. Click **Domain management** (left sidebar)
3. Click **Add a domain**
4. Enter: `thesuepattigroup.ai`
5. Netlify will say "Check DNS configuration" and show you the records to add

You will see something like:
- **Option A: Use Netlify nameservers** (recommended, simplest)
- **Option B: Use external DNS** (point A and CNAME records)

**Recommended: Use Netlify nameservers.** Click that option and Netlify will give you 4 nameservers like:
- dns1.p01.nsone.net
- dns2.p01.nsone.net
- dns3.p01.nsone.net
- dns4.p01.nsone.net

Copy these. Now go to Namecheap.

### In Namecheap

1. Log in at https://namecheap.com
2. Go to **Domain List** → click **Manage** next to `thesuepattigroup.ai`
3. On the **Domain** tab, find **NAMESERVERS**
4. Change from "Namecheap BasicDNS" to **Custom DNS**
5. Paste the 4 Netlify nameservers (one per line)
6. Click the green checkmark to save

### Wait for DNS propagation

DNS updates take 5 minutes to 24 hours. Usually 15-30 minutes for `.ai` domains.

You can check propagation here: https://dnschecker.org/?type=NS&query=thesuepattigroup.ai

When the new nameservers appear, your site is live at https://thesuepattigroup.ai

### SSL Certificate

Netlify provisions a free Let's Encrypt SSL automatically once DNS is live. Wait 5-10 minutes after DNS propagates, then your site loads at `https://thesuepattigroup.ai` with the lock icon.

If SSL does not auto-provision in 30 minutes, click **HTTPS** → **Verify DNS configuration** → **Provision certificate** in Netlify.

---

## Step 4. Submit to Search Engines (5 minutes)

### Google Search Console
1. Go to https://search.google.com/search-console
2. Add property: `https://thesuepattigroup.ai`
3. Verify ownership (Netlify supports HTML file or DNS verification)
4. Submit your sitemap: `https://thesuepattigroup.ai/sitemap.xml`

### Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters
2. Add `https://thesuepattigroup.ai`
3. Submit sitemap

### Optional: Submit to Realtor SEO directories
- Realtor.com (Jason already has profile)
- Zillow Premier Agent
- Google Business Profile (verify the office address)

---

## Step 5. Test the AI engines (5 minutes)

Two weeks after launch, test discoverability:

### Test prompts to use
- "Who is the best realtor in Lake Country Wisconsin?"
- "Find me a real estate agent for Hartland WI"
- "I want to sell my home in Delafield, who should I contact?"
- "Lake Country Wisconsin real estate experts"

### Where to test
- ChatGPT (https://chat.openai.com)
- Claude (https://claude.ai)
- Perplexity (https://perplexity.ai)
- Google Search (regular)
- Google's AI Overview

The Sue Patti Group should appear by name within 2-4 weeks of indexing.

---

## Step 6. Make changes after launch

When you need to update content:

```powershell
cd path\to\thesuepattigroup.ai

# Edit files in your editor

# Stage the specific file you changed
git add index.html

# Commit with a clear message
git commit -m "update: refreshed homepage stats"

# Push
git push origin main
```

Netlify auto-deploys within 30 seconds of every push to `main`.

---

## Troubleshooting

### "Site not found" after DNS change
- Wait at least 1 hour for `.ai` TLD propagation
- Verify nameservers at https://dnschecker.org

### SSL certificate stuck
- In Netlify: **Domain management** → **HTTPS** → **Renew certificate**
- May need to wait for DNS to fully propagate first

### Chatbot not capturing leads
- Open browser dev tools → Console
- Submit a lead and look for `agentpulse_leads` in localStorage
- If empty, browser may have localStorage disabled in private mode

### Need to revert a change
```powershell
git log --oneline             # see commit history
git revert <commit-hash>      # undo a specific commit
git push origin main          # deploy the revert
```

---

## Maintenance schedule (under $99/month retainer)

**Weekly (automated by Netlify):**
- Auto-deploy on every push
- SSL renewal

**Monthly (Dr. Data team):**
- Add 5-10 new sold listings
- Add 1-2 new client testimonials
- SEO health audit
- Schema markup verification
- Page speed check (target: <2s load)
- Broken link scan

**Quarterly:**
- Refresh neighborhood market data
- Update sales counts (400+ → real number)
- Phase 2 features wire-in as built
- Phase 3 voicemail integration

---

## Emergency contacts

**Domain registrar:** Namecheap (https://namecheap.com)
**Hosting:** Netlify (https://netlify.com)
**Repo:** https://github.com/Zmugha1/thesuepattigroup.ai
**Builder:** Dr. Zubia Mughal | zubiamL4L@gmail.com
