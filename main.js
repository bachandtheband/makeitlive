(function () {
  var root = document.documentElement;

  var titles = window.MIL_TITLES || {
    nl: 'Make It Live — You bring the people. We Make It Live.',
    en: 'Make It Live — You bring the people. We Make It Live.'
  };

  // ── Language ────────────────────────────────
  function setLang(lang) {
    root.lang = lang;
    document.title = titles[lang];
    try { localStorage.setItem('mil-lang', lang); } catch (e) {}
  }
  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-set-lang')); });
  });
  setLang(root.lang === 'en' ? 'en' : 'nl');

  // ── Theme (light by default) ────────────────
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function paintThemeColor() {
    if (themeMeta) themeMeta.setAttribute('content', root.dataset.theme === 'dark' ? '#050507' : '#f6f2ec');
  }
  paintThemeColor();
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { sessionStorage.setItem('mil-theme', next); } catch (e) {}
      paintThemeColor();
    });
  });

  // ── Nav: backdrop + small wordmark after the hero logo scrolls away ──
  var nav = document.querySelector('.nav');
  var hero = document.getElementById('hero');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.55); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Hero video: fades in by itself once assets/video/hero.* exists ──
  var vid = hero && hero.querySelector('.hero-video');
  if (vid) {
    var conn = navigator.connection || {};
    var skip = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
               conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
    if (skip) {
      vid.remove();
    } else {
      vid.addEventListener('playing', function () {
        hero.classList.add('has-video');
        nav.classList.add('on-video');
      });
      var sources = vid.querySelectorAll('source');
      sources[sources.length - 1].addEventListener('error', function () { vid.remove(); });
      var played = vid.play();
      if (played && played.catch) played.catch(function () {});
    }
  }

  // ── Scroll reveal ───────────────────────────
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // ── Soft spotlight that follows the cursor ──
  var raf = 0, mx = 0, my = 0;
  window.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      root.style.setProperty('--mx', mx + 'px');
      root.style.setProperty('--my', my + 'px');
      raf = 0;
    });
  }, { passive: true });

  // ── Copy buttons ────────────────────────────
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        btn.classList.add('done');
        setTimeout(function () { btn.classList.remove('done'); }, 1800);
      };
      var fallback = function () {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { if (document.execCommand('copy')) done(); } catch (e) {}
        document.body.removeChild(ta);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });

  // ── Drafts (references, testimonials): only loaded with ?preview ──
  var slot = document.getElementById('drafts-slot');
  if (slot && root.classList.contains('show-drafts')) {
    fetch('/partials/drafts.html').then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
      slot.innerHTML = html;
    }).catch(function () {});
  }

  // ── Placeholder pages: team notes / visitor view ──
  document.querySelectorAll('[data-notes-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var off = root.classList.toggle('hide-notes');
      try { localStorage.setItem('mil-notes', off ? 'off' : 'on'); } catch (e) {}
    });
  });

  // ── Pre-select a service in the form via ?service=DJ ──
  var wanted = new URLSearchParams(location.search).get('service');
  if (wanted) {
    document.querySelectorAll('#contact-form [name="services"]').forEach(function (cb) {
      if (cb.value === wanted) cb.checked = true;
    });
  }

  // ── Preview only: make the five service cards open their (unlisted) pages ──
  if (root.classList.contains('show-drafts')) {
    var pages = ['/dj', '/live-musicians', '/live-bands', '/performers', '/photo-video'];
    document.querySelectorAll('.core-card').forEach(function (card, i) {
      if (!pages[i]) return;
      var a = document.createElement('a');
      a.className = 'core-link';
      a.href = pages[i];
      a.setAttribute('aria-label', (card.querySelector('h3') || {}).textContent || 'Open');
      card.appendChild(a);
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // ── Contact form ────────────────────────────
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var submit = form.querySelector('button[type="submit"]');
    var T = {
      nl: {
        sending: 'Versturen…',
        checking: 'Even de beveiligingscontrole afwachten…',
        ok: 'Bedankt! We hebben je bericht ontvangen en nemen snel contact op.',
        okConfirm: 'Bedankt! We hebben je bericht ontvangen. Je krijgt een bevestiging per e-mail en we antwoorden binnen één werkdag.',
        err: 'Het versturen lukte niet automatisch. Stuur je bericht rechtstreeks per mail: ',
        link: 'open je mailprogramma'
      },
      en: {
        sending: 'Sending…',
        checking: 'Waiting for the security check…',
        ok: 'Thank you! We received your message and will be in touch soon.',
        okConfirm: 'Thank you! We received your message. You will get a confirmation by email and we reply within one working day.',
        err: "We couldn't send that automatically. Please send your message by email instead: ",
        link: 'open your email app'
      }
    };

    // Cloudflare Turnstile (anti-spam). Only active when index.html has a site key, and the script is loaded
    // only once the visitor starts using the form, so most visitors never contact Cloudflare's challenge server.
    var tsSlot = document.getElementById('ts-slot');
    var siteKey = tsSlot ? tsSlot.getAttribute('data-sitekey') : '';
    var tsWidget = null, tsToken = '', tsLoading = false;
    var loadTurnstile = function () {
      if (!siteKey || tsLoading) return;
      tsLoading = true;
      window.milTurnstileReady = function () {
        tsWidget = window.turnstile.render(tsSlot, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          theme: root.dataset.theme === 'dark' ? 'dark' : 'light',
          callback: function (token) { tsToken = token; },
          'expired-callback': function () { tsToken = ''; },
          'error-callback': function () { tsToken = ''; }
        });
      };
      var sc = document.createElement('script');
      sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=milTurnstileReady';
      sc.async = true;
      sc.defer = true;
      document.head.appendChild(sc);
    };
    form.addEventListener('focusin', loadTurnstile, { once: true });
    var waitForToken = function (ms) {
      return new Promise(function (resolve) {
        var t0 = Date.now();
        (function poll() {
          if (tsToken || Date.now() - t0 > ms) return resolve(tsToken);
          setTimeout(poll, 150);
        })();
      });
    };

    var buildMailto = function (d) {
      var lines = [
        'Name: ' + d.name,
        'Email: ' + d.email,
        'Event type: ' + d.type,
        d.date ? 'Date: ' + d.date : '',
        d.services.length ? 'Looking for: ' + d.services.join(', ') : '',
        '',
        d.message
      ].filter(function (l, i) { return l !== '' || i > 3; });
      return 'mailto:bookings@makeitlive.agency?subject=' +
        encodeURIComponent('Website — ' + d.type + ' — ' + d.name) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var fd = new FormData(form);
      var data = {
        name: (fd.get('name') || '').toString().trim(),
        email: (fd.get('email') || '').toString().trim(),
        type: (fd.get('type') || '').toString(),
        date: (fd.get('date') || '').toString(),
        message: (fd.get('message') || '').toString().trim(),
        services: fd.getAll('services').map(String),
        website: (fd.get('website') || '').toString(),
        lang: root.lang
      };
      var t = T[root.lang] || T.nl;

      status.className = 'form-status';
      status.textContent = siteKey ? t.checking : t.sending;
      submit.disabled = true;

      loadTurnstile();
      (siteKey ? waitForToken(15000) : Promise.resolve('')).then(function (token) {
        status.textContent = t.sending;
        data.turnstileToken = token;
        return fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }).then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json().catch(function () { return {}; });
      }).then(function (result) {
        form.reset();
        status.className = 'form-status ok';
        status.textContent = result && result.confirmation ? t.okConfirm : t.ok;
      }).catch(function () {
        status.className = 'form-status err';
        status.textContent = t.err;
        var a = document.createElement('a');
        a.href = buildMailto(data);
        a.textContent = t.link;
        status.appendChild(a);
        status.appendChild(document.createTextNode('.'));
      }).then(function () {
        submit.disabled = false;
        // a Turnstile token works once: get a fresh one for a possible next attempt
        if (tsWidget !== null && window.turnstile) { tsToken = ''; window.turnstile.reset(tsWidget); }
      });
    });
  }
})();
