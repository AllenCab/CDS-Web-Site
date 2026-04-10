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

  /* --- File Upload: Power Automate + OneDrive ---
       ACTION REQUIRED: Replace the placeholder below with your Power Automate
       HTTP trigger URL. Steps:
       1. Go to https://make.powerautomate.com and sign in with your M365 account.
       2. Click + New flow → Instant cloud flow.
       3. Name it "CDS File Upload", choose "When an HTTP request is received", click Create.
       4. In the trigger: leave the JSON schema blank. Click + New step.
       5. Add action: "Create file" (OneDrive for Business).
          - Folder Path: pick or type your desired OneDrive folder (e.g. /CDS Uploads)
          - File Name:   concat(formatDateTime(utcNow(),'yyyy-MM-dd_HHmm'),'_',json(triggerBody())?['senderCompany'],'_',json(triggerBody())?['filename'])
          - File Content: base64ToBinary(json(triggerBody())?['fileContent'])
       6. Add action: "Send an email (V2)" (Office 365 Outlook).
          - To: service@pnfcds.com
          - Subject: New CDS Upload from [json(triggerBody())?['senderCompany']]
          - Body: Name: [senderName], Email: [senderEmail], File: [filename], Notes: [notes]
       7. Add action: "Response".
          - Status Code: 200
          - Headers: add key "Access-Control-Allow-Origin" value "*"
          - Body: {"status":"ok"}
       8. Save the flow. Copy the HTTP POST URL from the trigger step and paste it below. ---- */
  var POWER_AUTOMATE_URL = 'YOUR_POWER_AUTOMATE_URL';

  var MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
  var selectedFile   = null;

  var uploadForm  = document.getElementById('upload-form');
  var dropZone    = document.getElementById('drop-zone');
  var dropInput   = document.getElementById('uf-file');
  var dropIdle    = document.getElementById('drop-idle');
  var dropChosen  = document.getElementById('drop-chosen');
  var dropFileName = document.getElementById('drop-file-name');
  var dropFileSize = document.getElementById('drop-file-size');
  var dropClear   = document.getElementById('drop-clear');
  var ufSubmit    = document.getElementById('uf-submit');
  var uploadStatus = document.getElementById('upload-status');

  function formatBytes(bytes) {
    if (bytes < 1024)    return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function setFile(file) {
    if (!file) return;
    // Validate type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      uploadStatus.textContent = 'Please select a PDF file.';
      uploadStatus.className   = 'form-status error';
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_BYTES) {
      uploadStatus.textContent = 'File exceeds the 20 MB limit. Please compress or split the PDF.';
      uploadStatus.className   = 'form-status error';
      return;
    }
    selectedFile = file;
    uploadStatus.textContent = '';
    uploadStatus.className   = 'form-status';
    dropFileName.textContent = file.name;
    dropFileSize.textContent = formatBytes(file.size);
    dropIdle.hidden   = true;
    dropChosen.hidden = false;
    ufSubmit.disabled = false;
  }

  function clearFile() {
    selectedFile = null;
    dropInput.value = '';
    dropIdle.hidden   = false;
    dropChosen.hidden = true;
    ufSubmit.disabled = true;
    uploadStatus.textContent = '';
    uploadStatus.className   = 'form-status';
  }

  if (dropZone) {
    dropInput.addEventListener('change', function () {
      setFile(dropInput.files[0] || null);
    });

    dropClear.addEventListener('click', function (e) {
      e.stopPropagation();
      clearFile();
    });

    // Keyboard: activate drop zone with Enter/Space
    dropZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dropInput.click();
      }
    });

    // Drag-and-drop visual feedback
    ['dragenter', 'dragover'].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropZone.classList.add('is-over');
      });
    });

    ['dragleave', 'drop'].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropZone.classList.remove('is-over');
      });
    });

    dropZone.addEventListener('drop', function (e) {
      var dt    = e.dataTransfer;
      var files = dt && dt.files;
      if (files && files.length) setFile(files[0]);
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var name    = document.getElementById('uf-name').value.trim();
      var company = document.getElementById('uf-company').value.trim();
      var email   = document.getElementById('uf-email').value.trim();
      var notes   = document.getElementById('uf-notes').value.trim();

      // Basic validation
      if (!name || !company || !email) {
        uploadStatus.textContent = 'Please fill in your name, company, and email.';
        uploadStatus.className   = 'form-status error';
        return;
      }
      if (!selectedFile) {
        uploadStatus.textContent = 'Please select a PDF to upload.';
        uploadStatus.className   = 'form-status error';
        return;
      }

      // Guard: if Power Automate URL hasn't been configured, fall back to email
      if (!POWER_AUTOMATE_URL || POWER_AUTOMATE_URL === 'YOUR_POWER_AUTOMATE_URL') {
        var subject = encodeURIComponent('CDS File Upload — ' + company);
        var body    = encodeURIComponent(
          'Name: ' + name + '\nCompany: ' + company + '\nEmail: ' + email +
          '\nFile: ' + selectedFile.name + '\nNotes: ' + (notes || '(none)') +
          '\n\nPlease attach the file manually and send to service@pnfcds.com.'
        );
        window.location.href = 'mailto:service@pnfcds.com?subject=' + subject + '&body=' + body;
        return;
      }

      ufSubmit.disabled     = true;
      ufSubmit.textContent  = 'Reading file…';
      uploadStatus.textContent = '';
      uploadStatus.className   = 'form-status';

      try {
        // Read file as base64
        var fileContent = await new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload  = function () {
            // result is "data:application/pdf;base64,<content>" — strip the prefix
            resolve(reader.result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        ufSubmit.textContent = 'Uploading…';

        // POST JSON as text/plain to avoid CORS preflight
        var payload = JSON.stringify({
          filename:      selectedFile.name,
          fileContent:   fileContent,
          senderName:    name,
          senderCompany: company,
          senderEmail:   email,
          notes:         notes
        });

        var res = await fetch(POWER_AUTOMATE_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'text/plain' },
          body:    payload
        });

        if (res.ok || res.status === 202) {
          uploadForm.reset();
          clearFile();
          uploadStatus.textContent = 'File sent successfully! You will receive a confirmation email shortly.';
          uploadStatus.className   = 'form-status';
          ufSubmit.textContent = 'Send to CDS';
          ufSubmit.disabled    = true;
        } else {
          throw new Error('Server responded with status ' + res.status);
        }
      } catch (err) {
        uploadStatus.textContent = 'Upload failed. Please email the file directly to service@pnfcds.com.';
        uploadStatus.className   = 'form-status error';
        ufSubmit.textContent = 'Send to CDS';
        ufSubmit.disabled    = false;
      }
    });
  }

})();
