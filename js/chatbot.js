/* The Sue Patti Group | Chatbot
   Captures leads and emits structured events for AgentPulse dashboard */

/* === AgentPulse Attribution Layer ===
   Captures referrer, UTM params, and persistent session ID on first page load.
   Stored in localStorage so return visits link to the same session.
   Phase 2 dashboard reads from agentpulse_session for source attribution. */
(function initAttribution() {
  try {
    let session = JSON.parse(localStorage.getItem('agentpulse_session') || 'null');

    if (!session) {
      // First visit - capture full attribution context
      const referrer = document.referrer || '';
      const params = new URLSearchParams(window.location.search);

      // Classify source from referrer
      let sourceCategory = 'Direct';
      let sourceDetail = '';
      if (referrer) {
        const r = referrer.toLowerCase();
        if (r.includes('chat.openai.com') || r.includes('chatgpt.com')) sourceCategory = 'ChatGPT';
        else if (r.includes('perplexity.ai')) sourceCategory = 'Perplexity';
        else if (r.includes('claude.ai')) sourceCategory = 'Claude';
        else if (r.includes('gemini.google.com') || r.includes('bard.google.com')) sourceCategory = 'Gemini';
        else if (r.includes('google.')) sourceCategory = 'Google';
        else if (r.includes('bing.com')) sourceCategory = 'Bing';
        else if (r.includes('duckduckgo.com')) sourceCategory = 'DuckDuckGo';
        else if (r.includes('facebook.com') || r.includes('fb.com')) sourceCategory = 'Facebook';
        else if (r.includes('linkedin.com')) sourceCategory = 'LinkedIn';
        else if (r.includes('instagram.com')) sourceCategory = 'Instagram';
        else if (r.includes('zillow.com')) sourceCategory = 'Zillow';
        else if (r.includes('realtor.com')) sourceCategory = 'Realtor.com';
        else if (r.includes('redfin.com')) sourceCategory = 'Redfin';
        else { sourceCategory = 'Referral'; sourceDetail = referrer; }
      }

      // UTM override - if utm_source present, that wins
      const utmSource = params.get('utm_source');
      const utmMedium = params.get('utm_medium');
      const utmCampaign = params.get('utm_campaign');
      const utmTerm = params.get('utm_term');
      const utmContent = params.get('utm_content');

      session = {
        sessionId: 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        firstSeenAt: new Date().toISOString(),
        firstLandingPage: window.location.pathname,
        referrer: referrer,
        sourceCategory: sourceCategory,
        sourceDetail: sourceDetail,
        utmSource: utmSource,
        utmMedium: utmMedium,
        utmCampaign: utmCampaign,
        utmTerm: utmTerm,
        utmContent: utmContent,
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        language: navigator.language,
        pageViewCount: 0
      };

      localStorage.setItem('agentpulse_session', JSON.stringify(session));
    }

    // Increment page view count on every load
    session.pageViewCount = (session.pageViewCount || 0) + 1;
    session.lastSeenAt = new Date().toISOString();
    localStorage.setItem('agentpulse_session', JSON.stringify(session));
  } catch (e) {
    // localStorage unavailable - silent fail, chatbot still works
  }
})();

function getAttribution() {
  try {
    return JSON.parse(localStorage.getItem('agentpulse_session') || 'null');
  } catch (e) {
    return null;
  }
}

const QUESTIONS = [
  { key: 'area', q: 'What area of Lake Country and beyond are you looking in?',
    opts: ['Hartland / Delafield', 'Oconomowoc / Pewaukee', 'Dousman / Mukwonago', 'Waukesha / Brookfield', 'Watertown / Ixonia / Beyond', 'Not sure yet'] },
  { key: 'budget', q: "What's your budget range?",
    opts: ['Under $300K', '$300K - $450K', '$450K - $600K', '$600K - $800K', 'Over $800K'] },
  { key: 'beds', q: 'How many bedrooms do you need?',
    opts: ['2 bedrooms', '3 bedrooms', '4 bedrooms', '5+ bedrooms'] },
  { key: 'preApproved', q: 'Are you pre-approved with a lender?',
    opts: ['Yes, pre-approved', 'No, but ready to start', 'Not sure what that means'] },
  { key: 'timeline', q: "What's your timeline to move?",
    opts: ['ASAP / under 60 days', '2 to 4 months', '4 to 6 months', 'Just browsing for now'] },
  { key: 'name', q: "Last one. What's your name and email so Jason can reach out personally?",
    type: 'text' }
];

let step = 0;
const answers = {};

function renderChatbot() {
  const container = document.getElementById('chatbot-body');
  if (!container) return;

  if (step >= QUESTIONS.length) {
    saveAndShowMatches();
    return;
  }

  const q = QUESTIONS[step];
  const progress = QUESTIONS.map((_, i) =>
    `<span class="${i < step ? 'done' : i === step ? 'current' : ''}"></span>`
  ).join('');

  let html = `
    <div class="chatbot-step">
      <div class="chatbot-progress">${progress}</div>
      <h4>${q.q}</h4>
  `;

  if (q.type === 'text') {
    html += `
      <input type="text" class="chatbot-input" id="cb-name" placeholder="Your full name" style="margin-bottom:8px" />
      <input type="email" class="chatbot-input" id="cb-email" placeholder="Your email" style="margin-bottom:8px" />
      <input type="tel" class="chatbot-input" id="cb-phone" placeholder="Your phone (optional)" style="margin-bottom:8px" />
      <button class="chatbot-submit" onclick="submitName()">Get My Matches</button>
    `;
  } else {
    html += '<div class="chatbot-options">';
    q.opts.forEach(opt => {
      html += `<button onclick="pickAnswer('${q.key}', '${opt.replace(/'/g, "\\'")}')">${opt}</button>`;
    });
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function pickAnswer(key, val) {
  answers[key] = val;
  step++;
  emitEvent('chatbot_answer', { question: key, answer: val, step: step });
  renderChatbot();
}

function submitName() {
  const name = document.getElementById('cb-name').value.trim();
  const email = document.getElementById('cb-email').value.trim();
  const phone = document.getElementById('cb-phone').value.trim();

  if (!name || !email) {
    alert('Please enter your name and email.');
    return;
  }

  answers.name = name;
  answers.email = email;
  answers.phone = phone || 'Not provided';
  step++;
  renderChatbot();
}

function saveAndShowMatches() {
  const budgetMap = {
    'Under $300K': 280000, '$300K - $450K': 425000, '$450K - $600K': 525000,
    '$600K - $800K': 700000, 'Over $800K': 850000
  };
  const paMap = {
    'Yes, pre-approved': true,
    'No, but ready to start': false,
    'Not sure what that means': false
  };
  const urgencyScore = {
    'ASAP / under 60 days': 9,
    '2 to 4 months': 7,
    '4 to 6 months': 5,
    'Just browsing for now': 3
  };

  const pa = paMap[answers.preApproved] || false;
  let score = urgencyScore[answers.timeline] || 5;
  if (pa) score = Math.min(10, score + 1);
  if (answers.area !== 'Not sure yet') score = Math.min(10, score + 1);

  const status = score >= 8 ? 'hot' : score >= 5 ? 'warm' : 'cold';
  const firstName = answers.name.split(' ')[0];

  const attribution = getAttribution();

  const lead = {
    id: 'web-' + Date.now(),
    sessionId: attribution ? attribution.sessionId : null,
    lead_type: 'buyer',
    capture_source: 'chatbot',
    name: answers.name,
    email: answers.email,
    phone: answers.phone,
    area: answers.area,
    budget: budgetMap[answers.budget] || 400000,
    beds: answers.beds,
    pa: pa,
    timeline: answers.timeline,
    days: 0,
    score: score,
    status: status,
    source: attribution ? attribution.sourceCategory : 'Website Chatbot',
    sourceDetail: attribution ? attribution.sourceDetail : '',
    referrer: attribution ? attribution.referrer : '',
    utmSource: attribution ? attribution.utmSource : null,
    utmMedium: attribution ? attribution.utmMedium : null,
    utmCampaign: attribution ? attribution.utmCampaign : null,
    landingPage: attribution ? attribution.firstLandingPage : window.location.pathname,
    pageViewsBeforeCapture: attribution ? attribution.pageViewCount : 1,
    property: 'Matched: ' + answers.area,
    note: 'Captured via thesuepattigroup.ai chatbot. Timeline: ' + answers.timeline + '. Pre-approved: ' + answers.preApproved + '.',
    timestamp: new Date().toISOString()
  };

  try {
    const existing = JSON.parse(localStorage.getItem('agentpulse_leads') || '[]');
    existing.unshift(lead);
    localStorage.setItem('agentpulse_leads', JSON.stringify(existing));
    emitEvent('lead_captured', lead);

    // Persist to Netlify Forms (server-side capture for AgentPulse)
    try {
      const formData = new URLSearchParams();
      formData.append('form-name', 'chatbot-lead');
      formData.append('name', lead.name);
      formData.append('email', lead.email);
      formData.append('phone', lead.phone || '');
      formData.append('area', lead.area || '');
      formData.append('budget', String(lead.budget || ''));
      formData.append('beds', lead.beds || '');
      formData.append('pre_approved', String(lead.pa));
      formData.append('timeline', lead.timeline || '');
      formData.append('score', String(lead.score));
      formData.append('status', lead.status);
      formData.append('source', lead.source);
      formData.append('timestamp', lead.timestamp);
      formData.append('note', lead.note || '');
      formData.append('bot-field', '');

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      }).catch(function(err) {
        console.warn('Netlify Forms submission failed (lead still in localStorage):', err);
      });
    } catch (err) {
      console.warn('Netlify Forms submission error:', err);
    }
    
    // Send conversion event to GA4
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
  } catch (e) {
    console.log('Storage unavailable in this preview');
  }

  const container = document.getElementById('chatbot-body');
  const tjBlurb = pa
    ? ''
    : '<div class="captured-notice" style="background:#FEF3DC;color:#C8960C;border-color:#C8960C;margin-top:8px">Not pre-approved yet? No problem. Jason can connect you with a trusted lender who can pre-approve you in 24 hours at no cost.</div>';

  container.innerHTML = `
    <div class="chatbot-success">
      <h4>Got it, ${firstName}!</h4>
      <p style="font-size:13px;color:var(--slate);margin-bottom:10px">Here is what happens next:</p>

      <div class="three-promise">
        <div class="three-promise-item"><span><strong>Text confirmation</strong> within 60 seconds</span></div>
        <div class="three-promise-item"><span><strong>Email</strong> with your matched homes</span></div>
        <div class="three-promise-item"><span><strong>Personal call</strong> from Jason within 15 minutes</span></div>
      </div>

      ${tjBlurb}

      <div class="captured-notice" style="margin-top:12px">
        <strong>Lead captured.</strong> Welcome to Lake Country, ${firstName}.
      </div>

      <button class="chatbot-submit" onclick="resetChatbot()" style="background:var(--teal);margin-top:12px">Start a New Search</button>
    </div>
  `;
}

function resetChatbot() {
  step = 0;
  Object.keys(answers).forEach(k => delete answers[k]);
  renderChatbot();
}

/* Event stream for AgentPulse intelligence layer */
function emitEvent(type, data) {
  try {
    const attribution = getAttribution();
    const events = JSON.parse(localStorage.getItem('agentpulse_events') || '[]');
    events.unshift({
      type: type,
      data: data,
      sessionId: attribution ? attribution.sessionId : null,
      source: attribution ? attribution.sourceCategory : 'Direct',
      timestamp: new Date().toISOString(),
      page: window.location.pathname
    });
    if (events.length > 200) events.length = 200;
    localStorage.setItem('agentpulse_events', JSON.stringify(events));
  } catch (e) {}
}

/* Page view tracking for AgentPulse */
function trackPageView() {
  emitEvent('page_view', {
    path: window.location.pathname,
    title: document.title
  });
}

/* Auto-init */
function postNewsletterToNetlify(email) {
  try {
    var formData = new URLSearchParams();
    formData.append('form-name', 'newsletter-signup');
    formData.append('email', email);
    formData.append('bot-field', '');
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    }).catch(function(err) {
      console.warn('Netlify Forms submission failed (lead still in localStorage):', err);
    });
  } catch (err) {
    console.warn('Netlify Forms submission error:', err);
  }
}

window.handleNewsletterSubmit = function(event, form) {
  event.preventDefault();
  var input = form.querySelector('input[name="email"]');
  var email = input ? (input.value || '').trim() : '';
  var status = form.parentNode ? form.parentNode.querySelector('.newsletter-status') : null;
  var btn = form.querySelector('button[type="submit"]');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (status) {
      status.style.color = '#E8604A';
      status.textContent = 'Please enter a valid email address.';
    }
    return false;
  }

  // Enter-key submit path (newsletter.js only hooks button click)
  if (event.type === 'submit') {
    var lead = {
      id: 'nl-' + Date.now(),
      lead_type: 'newsletter',
      capture_source: 'footer_newsletter',
      email: email,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      attribution: (function() {
        try {
          var ref = document.referrer || '';
          var src = 'direct';
          if (ref) {
            var host = (new URL(ref)).hostname.replace('www.', '');
            if (host.indexOf('google.') > -1) src = 'Google';
            else src = host;
          }
          return { source: src, landing_page: window.location.pathname, referrer: ref };
        } catch (e) { return { source: 'unknown' }; }
      })()
    };
    try {
      var existing = JSON.parse(localStorage.getItem('agentpulse_leads') || '[]');
      existing.unshift(lead);
      localStorage.setItem('agentpulse_leads', JSON.stringify(existing));
    } catch (e) { /* silent */ }
    if (typeof window.trackLeadEvent === 'function') {
      window.trackLeadEvent('newsletter_signup', {
        lead_type: 'newsletter',
        capture_source: 'footer_newsletter',
        page: window.location.pathname
      });
    }
    if (input) input.disabled = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Subscribed';
    }
    if (status) {
      status.style.color = '#F5C842';
      status.textContent = 'You are subscribed. Lake Country market reports arrive monthly.';
    }
  }

  postNewsletterToNetlify(email);
  return false;
};

document.addEventListener('click', function(e) {
  var btn = e.target.closest('.newsletter-form button[type="submit"]');
  if (!btn) return;
  var form = btn.closest('.newsletter-form');
  if (!form) return;
  setTimeout(function() {
    var input = form.querySelector('input[name="email"]');
    var email = input ? (input.value || '').trim() : '';
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      postNewsletterToNetlify(email);
    }
  }, 150);
}, false);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    renderChatbot();
    trackPageView();
  });
} else {
  renderChatbot();
  trackPageView();
}
