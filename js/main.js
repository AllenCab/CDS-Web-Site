/* ============================================================
   CDS — Cabinet Dealer Services
   js/main.js
   ============================================================ */

(function () {
  'use strict';

  /* --- Nav: become opaque after scrolling past hero --- */
  const header = document.getElementById('site-header');

  function updateHeader() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader(); // run once on load

  /* --- Mobile nav toggle --- */
  const navToggle = document.getElementById('nav-toggle');
  const navLinks  = document.getElementById('nav-links');

  function openNav() {
    navLinks.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', function () {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeNav() : openNav();
  });

  // Close nav on any nav-link click (smooth-scroll to section)
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  // Close nav on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* --- Contact form: async Formspree submission --- */
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('cf-submit');
  const statusEl   = document.getElementById('form-status');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Guard: if Formspree endpoint hasn't been configured yet, fall back
      // to mailto so the form still works during development.
      const action = form.getAttribute('action') || '';
      if (action.includes('YOUR_FORM_ID')) {
        const name    = document.getElementById('cf-name').value;
        const email   = document.getElementById('cf-email').value;
        const company = document.getElementById('cf-company').value;
        const message = document.getElementById('cf-message').value;
        const subject = encodeURIComponent('CDS Website Inquiry' + (company ? ' — ' + company : ''));
        const body    = encodeURIComponent(
          'Name: ' + name + '\n' +
          'Email: ' + email + '\n' +
          'Company: ' + company + '\n\n' +
          message
        );
        window.location.href = 'mailto:service@pnfcds.com?subject=' + subject + '&body=' + body;
        return;
      }

      // Disable button and show sending state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      statusEl.textContent = '';
      statusEl.className = 'form-status';

      try {
        const data = new FormData(form);
        const res  = await fetch(action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          form.reset();
          statusEl.textContent = 'Thank you — your message has been sent.';
          statusEl.className   = 'form-status';
          submitBtn.textContent = 'E-Mail Message';
          submitBtn.disabled    = false;
        } else {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Submission failed');
        }
      } catch (err) {
        statusEl.textContent = 'Something went wrong. Please email service@pnfcds.com directly.';
        statusEl.className   = 'form-status error';
        submitBtn.textContent = 'E-Mail Message';
        submitBtn.disabled    = false;
      }
    });
  }
})();
