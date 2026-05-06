/* Newsletter (email-only) lead capture
   Saves to same agentpulse_leads localStorage key with lead_type: 'newsletter'.
   Phase 2 dashboard reads this for the Newsletter Subscribers panel. */
(function() {
  function getAttribution() {
    try {
      var ref = document.referrer || '';
      var src = 'direct';
      if (ref) {
        var host = (new URL(ref)).hostname.replace('www.', '');
        if (host.indexOf('chat.openai.com') > -1 || host.indexOf('chatgpt.com') > -1) src = 'ChatGPT';
        else if (host.indexOf('claude.ai') > -1) src = 'Claude';
        else if (host.indexOf('perplexity.ai') > -1) src = 'Perplexity';
        else if (host.indexOf('google.') > -1) src = 'Google';
        else if (host.indexOf('bing.') > -1) src = 'Bing';
        else if (host.indexOf('facebook.') > -1) src = 'Facebook';
        else if (host.indexOf('zillow.') > -1) src = 'Zillow';
        else src = host;
      }
      var params = new URLSearchParams(window.location.search);
      return {
        source: src,
        utm_source: params.get('utm_source') || null,
        utm_medium: params.get('utm_medium') || null,
        utm_campaign: params.get('utm_campaign') || null,
        landing_page: window.location.pathname,
        referrer: ref
      };
    } catch (e) { return { source: 'unknown' }; }
  }
  
  function isValidEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }
  
  function init() {
    var forms = document.querySelectorAll('.newsletter-form');
    if (!forms.length) return;
    
    forms.forEach(function(form) {
      var btn = form.querySelector('button');
      var input = form.querySelector('input[type="email"]');
      var status = form.parentNode.querySelector('.newsletter-status');
      if (!btn || !input) return;
      
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var email = (input.value || '').trim();
        
        if (!isValidEmail(email)) {
          if (status) {
            status.style.color = '#E8604A';
            status.textContent = 'Please enter a valid email address.';
          }
          return;
        }
        
        var lead = {
          id: 'nl-' + Date.now(),
          lead_type: 'newsletter',
          capture_source: 'footer_newsletter',
          email: email,
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
          attribution: getAttribution()
        };
        
        try {
          var existing = JSON.parse(localStorage.getItem('agentpulse_leads') || '[]');
          existing.unshift(lead);
          localStorage.setItem('agentpulse_leads', JSON.stringify(existing));
        } catch (e) { /* silent */ }
        
        // Send conversion event to GA4
        if (typeof window.trackLeadEvent === 'function') {
          window.trackLeadEvent('newsletter_signup', {
            lead_type: 'newsletter',
            capture_source: 'footer_newsletter',
            page: window.location.pathname
          });
        }
        
        // Success state
        input.disabled = true;
        btn.disabled = true;
        btn.textContent = 'Subscribed';
        if (status) {
          status.style.color = '#F5C842';
          status.textContent = 'You are subscribed. Lake Country market reports arrive monthly.';
        }
      });
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
