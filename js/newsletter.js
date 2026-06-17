/* Newsletter (email-only) lead capture
   Saves to same agentpulse_leads localStorage key with lead_type: 'newsletter'.
   Phase 2 dashboard reads this for the Newsletter Subscribers panel. */
(function() {
  function getAttribution() {
    if (typeof window.buildLeadAttribution === 'function') {
      return window.buildLeadAttribution();
    }
    return {
      referrer: 'direct',
      referrer_domain: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      landing_page: window.location.pathname,
      session_id: null,
    };
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

        if (typeof window.trackLeadEvent === 'function') {
          window.trackLeadEvent('newsletter_signup', {
            lead_type: 'newsletter',
            capture_source: 'footer_newsletter',
            page: window.location.pathname
          });
        }

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
