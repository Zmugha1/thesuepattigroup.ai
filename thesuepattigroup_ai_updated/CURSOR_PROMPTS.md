# Cursor Prompts for thesuepattigroup.ai

Exact, copy-paste-ready prompts for pushing this site to GitHub and Netlify.
One prompt per task. One file per prompt. Always specific git add commands.

═══════════════════════════════════════════════════════════════
PROMPT 1 — Initial setup and first push to GitHub
═══════════════════════════════════════════════════════════════

Copy everything between the dashes into Cursor:

────────────────────────────────────────────────────────────
I have unzipped the website files into this folder. The GitHub
repository is already created at:

  https://github.com/Zmugha1/thesuepattigroup.ai

Working directory: [PASTE YOUR LOCAL FOLDER PATH HERE]

Do these steps in order. Confirm pwd before each.

STEP 1 — Verify we are in the right directory
  Run: pwd
  Expected: ends with /thesuepattigroup.ai
  Confirm: I should see index.html, css/, js/, etc.

STEP 2 — Initialize git
  Run: git init
  Run: git branch -M main

STEP 3 — Create .gitignore
  Create .gitignore with:
    .DS_Store
    Thumbs.db
    .vscode/
    node_modules/
    *.log

STEP 4 — Stage files individually (NEVER git add .)
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
  git add .gitignore
  git add css/style.css
  git add js/chatbot.js

STEP 5 — Verify staged files
  Run: git status
  Confirm: 17 files staged, nothing in modified or untracked

STEP 6 — Commit
  Run: git commit -m "init: Sue Patti Group Phase 1 launch"
  Report: commit hash

STEP 7 — Add remote
  Run: git remote add origin https://github.com/Zmugha1/thesuepattigroup.ai.git
  Run: git remote -v
  Confirm: origin shows fetch and push

STEP 8 — Push to main
  Run: git push -u origin main
  If authentication prompt: use GitHub username + Personal Access Token

STEP 9 — Verify on GitHub
  Open: https://github.com/Zmugha1/thesuepattigroup.ai
  Confirm: all 17 files visible

Report ONLY:
  - Commit hash
  - Confirmation push succeeded
  - Any errors encountered
────────────────────────────────────────────────────────────


═══════════════════════════════════════════════════════════════
PROMPT 2 — After Netlify deploy, verify everything works
═══════════════════════════════════════════════════════════════

Copy everything between the dashes:

────────────────────────────────────────────────────────────
I have deployed the site to Netlify. The temporary URL is:

  [PASTE NETLIFY TEMPORARY URL HERE]

Test this checklist by opening each page in a browser. For each
item, report PASS or FAIL with what you see.

VISUAL TESTS
  [ ] Homepage loads at /
  [ ] Hero says "The Sue Patti Group | Discover Lake Country"
  [ ] Stats show 30+ years, 400+ homes, 47+ reviews, 73 areas
  [ ] Scrolling sales ribbon animates and pauses on hover
  [ ] Scrolling reviews ribbon animates and pauses on hover
  [ ] All 9 nav links work (Home, Search, Neighborhoods, Sold,
      Reviews, Home Value, About, Contact, Dashboard)

CHATBOT TEST
  [ ] Chatbot loads on homepage
  [ ] Question 1: area selection works
  [ ] Question 2: budget selection works
  [ ] Question 3: bedrooms selection works
  [ ] Question 4: pre-approval selection works
  [ ] Question 5: timeline selection works
  [ ] Question 6: name/email/phone form
  [ ] After submit: "all three" promise screen appears
  [ ] If not pre-approved: TJ Milewski mention appears
  [ ] Reset button works

LEAD CAPTURE TEST
  [ ] Open dev tools (F12) → Application → Local Storage
  [ ] Submit a chatbot lead
  [ ] Confirm: agentpulse_leads contains lead JSON
  [ ] Confirm: agentpulse_events contains event stream

DASHBOARD TEST
  [ ] /dashboard.html loads
  [ ] All tabs render
  [ ] No console errors

SEO TESTS
  [ ] /sitemap.xml loads as XML
  [ ] /robots.txt loads as text
  [ ] /llms.txt loads as text
  [ ] View source of /index.html, find <script type="application/ld+json">
      Confirm: RealEstateAgent schema with name, address, phone

MOBILE TESTS (use Chrome dev tools mobile emulator)
  [ ] Homepage responsive at 375px width
  [ ] Nav collapses (or simplifies) on mobile
  [ ] Chatbot still functional on mobile
  [ ] Scrolling ribbons still work

Report any FAIL items with exact symptom.
────────────────────────────────────────────────────────────


═══════════════════════════════════════════════════════════════
PROMPT 3 — Update content (when needed in future)
═══════════════════════════════════════════════════════════════

Copy everything between the dashes:

────────────────────────────────────────────────────────────
I need to update [SPECIFIC CONTENT] in [SPECIFIC FILENAME].

Working directory: [PASTE YOUR LOCAL FOLDER PATH]

Steps:

STEP 1 — Pull latest from main
  Run: git pull origin main

STEP 2 — Make the edit
  Edit only: [FILENAME]
  Change: [DESCRIBE EXACT CHANGE]

STEP 3 — Verify the change
  Open the file in browser
  Confirm: change is visible
  Confirm: no other content was modified

STEP 4 — Stage ONLY the changed file (NEVER git add .)
  Run: git add [FILENAME]
  Run: git status
  Confirm: only one file staged, nothing else

STEP 5 — Commit
  Run: git commit -m "update: [DESCRIBE CHANGE]"

STEP 6 — Push
  Run: git push origin main

STEP 7 — Wait 60 seconds, verify on live site
  Open: https://thesuepattigroup.ai/[FILENAME]
  Confirm: change is live

Report ONLY:
  - Commit hash
  - Confirmation live site updated
  - Any errors
────────────────────────────────────────────────────────────


═══════════════════════════════════════════════════════════════
PROMPT 4 — Add a new sold listing (monthly maintenance)
═══════════════════════════════════════════════════════════════

Copy everything between the dashes:

────────────────────────────────────────────────────────────
Add a new sold listing to sold-homes.html.

Working directory: [PASTE YOUR LOCAL FOLDER PATH]

Listing details:
  Address: [STREET ADDRESS]
  City: [CITY]
  Sale price: [$XXX,XXX]
  Beds: [#]
  Baths: [#]
  Sqft: [#]
  Code: [DLF/HTL/PEW/OCM/CHQ/BRK/NSH/WAU]

Steps:

STEP 1 — Edit ONLY sold-homes.html
  Find: <div class="sales-grid">
  Add a new gridded-sale block at the TOP of the grid

STEP 2 — Use this template:
  <div class="gridded-sale">
    <div class="sale-photo">
      <span class="sale-badge sold">SOLD</span>[CODE]
    </div>
    <div class="sale-body">
      <div class="sale-price">$[PRICE]</div>
      <div class="sale-addr">[ADDRESS], [CITY]</div>
      <div class="sale-specs">
        <span><strong>[BEDS]</strong>bd</span>
        <span><strong>[BATHS]</strong>ba</span>
        <span><strong>[SQFT]</strong>sf</span>
      </div>
    </div>
  </div>

STEP 3 — Save and verify
  Open sold-homes.html in browser
  Confirm: new listing visible at top

STEP 4 — Stage, commit, push
  git add sold-homes.html
  git commit -m "content: added [CITY] sale at $[PRICE]"
  git push origin main

Report commit hash.
────────────────────────────────────────────────────────────


═══════════════════════════════════════════════════════════════
PROMPT 5 — Add a new client review (monthly maintenance)
═══════════════════════════════════════════════════════════════

Copy everything between the dashes:

────────────────────────────────────────────────────────────
Add a new 5-star testimonial to reviews.html.

Working directory: [PASTE YOUR LOCAL FOLDER PATH]

Review details:
  Reviewer: [FIRST NAME LAST INITIAL]
  Location: [CITY]
  Type: [Buyer/Seller]
  Source: [Zillow/Realtor.com/Direct]
  Quote: [TESTIMONIAL TEXT]

Steps:

STEP 1 — Edit ONLY reviews.html
  Find: <div class="reviews-grid">
  Add a new review-large block at the TOP of the grid

STEP 2 — Use this template:
  <div class="review-large">
    <div class="stars">★★★★★</div>
    <p>"[QUOTE]"</p>
    <div class="reviewer">
      <strong>[REVIEWER NAME]</strong>
      [LOCATION] [TYPE]
      <div class="source">Verified via [SOURCE]</div>
    </div>
  </div>

STEP 3 — Update reviewCount in JSON-LD
  Find: "reviewCount": "47"
  Change to: [NEW COUNT, e.g., "48"]

STEP 4 — Update header text if needed
  Find: 47+ verified
  Update if review count crosses a milestone

STEP 5 — Stage, commit, push
  git add reviews.html
  git commit -m "content: added review from [REVIEWER]"
  git push origin main

Report commit hash.
────────────────────────────────────────────────────────────
