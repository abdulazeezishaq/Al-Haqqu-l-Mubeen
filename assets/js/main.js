/* ==========================================================================
   AHM — shared behaviour
   Progressive enhancement: every feature degrades to usable static markup.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on = function (el, ev, fn) { if (el) el.addEventListener(ev, fn); };
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------- Navbar --------------------------------- */
  function initNav() {
    var nav = $('.nav');
    if (!nav) return;
    var burger = $('.nav__burger', nav);

    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    on(burger, 'click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });

    $$('.nav__links a').forEach(function (a) {
      on(a, 'click', function () {
        nav.classList.remove('is-open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      });
    });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
      }
    });
  }

  /* ------------------------- Reveal on scroll --------------------------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* --------------------- Count-up numbers / charts ---------------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400;
    if (reduceMotion) { el.textContent = prefix + target.toLocaleString() + suffix; return; }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target < 100 ? (Math.round(target * eased * 10) / 10) : Math.round(target * eased);
      el.textContent = prefix + (Number.isInteger(val) ? val.toLocaleString() : val) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initOnView() {
    var nodes = $$('[data-count], .donut, .bars');
    if (!nodes.length) return;

    var fire = function (el) {
      if (el.hasAttribute('data-count')) return countUp(el);
      if (el.classList.contains('donut')) {
        var pct = parseFloat(el.getAttribute('data-value') || '0');
        var path = $('.donut__val', el);
        if (path) {
          var c = 2 * Math.PI * 70;                     /* r = 70 in the SVG */
          path.style.strokeDasharray = (c * pct / 100) + ' ' + c;
        }
        return;
      }
      $$('.bars__bar', el).forEach(function (bar, i) {
        var h = bar.getAttribute('data-h') || '50';
        setTimeout(function () { bar.style.height = h + '%'; }, reduceMotion ? 0 : i * 90);
      });
    };

    if (!('IntersectionObserver' in window)) { nodes.forEach(fire); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        fire(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    nodes.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------- Carousel -------------------------------- */
  function initCarousels() {
    $$('.carousel').forEach(function (car) {
      var track = $('.carousel__track', car);
      if (!track) return;

      /* Arrow buttons may sit outside the carousel (e.g. in the section
         header), in which case they point back with data-nav-for="<id>". */
      var scope = car;
      if (car.id) {
        var external = $('[data-nav-for="' + car.id + '"]');
        if (external) scope = external;
      }
      var prev = $('[data-car="prev"]', scope);
      var next = $('[data-car="next"]', scope);

      /* Left edge of every slide, measured in the track's scroll coordinates. */
      var offsets = function () {
        var base = track.getBoundingClientRect().left - track.scrollLeft;
        return Array.prototype.map.call(track.children, function (kid) {
          return Math.round(kid.getBoundingClientRect().left - base);
        });
      };

      var goTo = function (left) {
        var max = track.scrollWidth - track.clientWidth;
        var target = Math.max(0, Math.min(max, left));
        try {
          track.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
        } catch (err) {                      /* older browsers: no options object */
          track.scrollLeft = target;
        }
      };

      var sync = function () {
        var max = track.scrollWidth - track.clientWidth - 2;
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= max;
      };

      on(next, 'click', function () {
        var here = track.scrollLeft;
        var target = offsets().filter(function (x) { return x > here + 8; })[0];
        goTo(target === undefined ? track.scrollWidth : target);
      });

      on(prev, 'click', function () {
        var here = track.scrollLeft;
        var before = offsets().filter(function (x) { return x < here - 8; });
        goTo(before.length ? before[before.length - 1] : 0);
      });

      track.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  /* ---------------------------- Accordion ------------------------------- */
  function initAccordions() {
    /* Animate between an explicit pixel height and 0, then release to `auto`
       so that nested content can still grow. A per-panel timer replaces the
       transitionend listener, which could be left dangling when a transition
       never ran. */
    var setPanel = function (panel, open) {
      if (!panel) return;
      if (panel.ahmTimer) { clearTimeout(panel.ahmTimer); panel.ahmTimer = null; }

      var content = panel.scrollHeight;
      if (reduceMotion) { panel.style.height = open ? 'auto' : '0px'; return; }

      panel.style.height = (open ? 0 : content) + 'px';
      void panel.offsetHeight;                       /* force a reflow       */
      panel.style.height = (open ? content : 0) + 'px';

      if (open) {
        panel.ahmTimer = setTimeout(function () {
          panel.style.height = 'auto';
          panel.ahmTimer = null;
        }, 400);
      }
    };

    $$('.acc').forEach(function (acc) {
      var btns = $$('.acc__btn', acc);

      btns.forEach(function (btn) {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var startOpen = btn.getAttribute('aria-expanded') === 'true';
        if (panel) panel.style.height = startOpen ? 'auto' : '0px';

        on(btn, 'click', function () {
          var isOpen = btn.getAttribute('aria-expanded') === 'true';

          btns.forEach(function (other) {
            if (other === btn || other.getAttribute('aria-expanded') !== 'true') return;
            other.setAttribute('aria-expanded', 'false');
            setPanel(document.getElementById(other.getAttribute('aria-controls')), false);
          });

          btn.setAttribute('aria-expanded', String(!isOpen));
          setPanel(panel, !isOpen);
        });
      });
    });
  }

  /* ---------------------- Segmented + chip groups ----------------------- */
  function initToggleGroups() {
    $$('[data-toggle-group]').forEach(function (group) {
      var btns = $$('button', group);
      btns.forEach(function (btn) {
        on(btn, 'click', function () {
          btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
          group.dispatchEvent(new CustomEvent('toggled', {
            bubbles: true,
            detail: { value: btn.getAttribute('data-value'), name: group.getAttribute('data-toggle-group') }
          }));
        });
      });
    });
  }

  /* -------------------------- Donation form ----------------------------- */
  function initDonate() {
    var form = $('#donate-form');
    if (!form) return;

    var amountInput = $('#donate-amount', form);
    var customWrap  = $('#custom-amount-wrap', form);
    var customInput = $('#custom-amount', form);
    var currency    = { code: 'NGN', symbol: '₦' };
    var presets     = { NGN: [5000, 10000, 25000, 50000, 100000], USD: [10, 25, 50, 100, 250] };
    var chipWrap    = $('#amount-chips', form);

    function renderChips() {
      if (!chipWrap) return;
      var active = amountInput ? amountInput.value : '';
      chipWrap.innerHTML = '';
      presets[currency.code].forEach(function (v) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.setAttribute('data-value', String(v));
        b.setAttribute('aria-pressed', String(String(v) === active));
        b.textContent = currency.symbol + v.toLocaleString();
        chipWrap.appendChild(b);
      });
      var custom = document.createElement('button');
      custom.type = 'button';
      custom.className = 'chip';
      custom.setAttribute('data-value', 'custom');
      custom.setAttribute('aria-pressed', 'false');
      custom.textContent = 'Custom';
      chipWrap.appendChild(custom);
    }
    renderChips();

    on(chipWrap, 'click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      $$('.chip', chipWrap).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var val = btn.getAttribute('data-value');
      var isCustom = val === 'custom';
      if (customWrap) customWrap.hidden = !isCustom;
      if (isCustom) { if (customInput) customInput.focus(); if (amountInput) amountInput.value = ''; }
      else if (amountInput) { amountInput.value = val; }
    });

    on(customInput, 'input', function () { if (amountInput) amountInput.value = customInput.value; });

    var curGroup = $('[data-toggle-group="currency"]');
    on(curGroup, 'toggled', function (e) {
      currency = e.detail.value === 'USD' ? { code: 'USD', symbol: '$' } : { code: 'NGN', symbol: '₦' };
      if (amountInput) amountInput.value = '';
      if (customWrap) customWrap.hidden = true;
      renderChips();
      var note = $('#currency-note');
      if (note) note.textContent = currency.code === 'USD'
        ? 'Amounts shown in US dollars.'
        : 'Amounts shown in Nigerian naira.';
    });

    var freq = 'one-time', cause = 'Where Most Needed';
    on($('[data-toggle-group="frequency"]'), 'toggled', function (e) { freq = e.detail.value; });
    on($('[data-toggle-group="cause"]'), 'toggled', function (e) { cause = e.detail.value; });

    on(form, 'submit', function (e) {
      e.preventDefault();
      var amount = amountInput && amountInput.value ? amountInput.value : (customInput ? customInput.value : '');
      var status = $('#donate-status');
      if (!amount) {
        if (status) {
          status.hidden = false;
          status.textContent = 'Please choose or enter an amount before continuing.';
        }
        return;
      }
      /* ------------------------------------------------------------------
         PAYMENT INTEGRATION PLACEHOLDER
         Replace this block with a Paystack or Flutterwave checkout call.
         Paystack:    PaystackPop.setup({ key: '[PAYSTACK_PUBLIC_KEY]', ... })
         Flutterwave: FlutterwaveCheckout({ public_key: '[FLW_PUBLIC_KEY]', ... })
         Payload below is already assembled for either provider.
      ------------------------------------------------------------------ */
      var payload = {
        amount: Number(amount),
        currency: currency.code,
        frequency: freq,
        cause: cause,
        name: (form.elements.name || {}).value,
        email: (form.elements.email || {}).value,
        phone: (form.elements.phone || {}).value,
        anonymous: !!(form.elements.anonymous || {}).checked
      };
      if (window.console) console.log('[AHM] donation payload ready for gateway:', payload);
      if (status) {
        status.hidden = false;
        status.textContent = 'Thank you, ' + (payload.name || 'friend') + '. Your ' + freq +
          ' gift of ' + currency.symbol + Number(amount).toLocaleString() + ' for “' + cause +
          '” is ready. Connect a payment gateway to complete this step.';
      }
    });
  }

  /* --------------------------- Copy to clipboard ------------------------ */
  function initCopy() {
    $$('[data-copy]').forEach(function (btn) {
      on(btn, 'click', function () {
        var text = btn.getAttribute('data-copy');
        var done = function () {
          var old = btn.getAttribute('data-label') || btn.textContent;
          btn.setAttribute('data-label', old);
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = old; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (err) {}
          document.body.removeChild(ta); done();
        }
      });
    });
  }

  /* ------------------------- Simple form handling ----------------------- */
  function initForms() {
    $$('form[data-demo-form]').forEach(function (form) {
      on(form, 'submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var status = $('.form-status', form);
        if (status) {
          status.hidden = false;
          status.textContent = form.getAttribute('data-success') ||
            'Thank you — your message has been received. We will be in touch shortly.';
        }
        form.reset();
      });
    });
  }

  /* --------------------------- Dotted world map -------------------------- */
  /* Land grid derived from an equirectangular public-domain world map,
     sampled to a 96-column dot lattice. Row 0 = far north. */
  var LAND = [
    '111111000000000000000000000000000000000000000000000000000000000000000000000000000000100011111111',
    '111111100000000000000000000000000000000000000000000000000000000000000000011000000000100000111111',
    '111111110000000000000110101010111100000000000000000000000000000011000000000100010011111101111111',
    '111111110011110000000011100111111111111111000000000000000000000000111000000111111111111100111111',
    '111110010111111100001101111111101111111111110000000000010000000011111101111111111111110001011100',
    '111110000111111101101111010111001111111111100000111000000001000111111111111111111111111000011110',
    '000000001111111111110111011110000011111111100000000000000110001111111111111111111111110000000010',
    '000000001111111111111111111111000001111111100000000000000100111111111111111111111111110000000000',
    '000000011111111111111111011001110011111111100000000000001100111111111111111111111100000000000100',
    '000000001110111111111111111100110011111111000000001100000011111111111111111111111101100000000000',
    '000000011000011111111111110000111001111110000000011111011111111111111111111111100001100000000000',
    '001010000000011111111111101111110011111000000000011111111111111111111111111111100001100010100000',
    '000000000000001111111111000011100011100011100000111111111111111111111111111111100000100000000000',
    '000000000000011111111111000011000001100000000001110111111111111111111111111111111100000000000000',
    '000000000000001111111111100111100000000000000001110011111111111111111111111111111100000000000000',
    '000000000000001111111111111111110000000000001100111011111111111111111111111111111000000000000000',
    '000000000000001111111111111111110000000000001100100111111111111111111111111111111010000000000000',
    '000000000000001111111111111111100000000000010101111111111111111111111111111111111011000000000000',
    '000000000000011111111111111111011000000000001111111111111111111111111111111111110010000000000000',
    '000000000000011111111111111111100000000000000111111111111101111111111111111111110001000000000000',
    '000000000000011111111111111100000000000000000111101110011101111111111111111110110011000000000000',
    '000000000000011111111111110000000000000000011110010111111111111111111111111111010110000000000000',
    '000000000000001111111111110000000000001000011100010111111110111111111111111111100100000000000000',
    '000000000000001111111111100000000000000000001111110010111111111111111111111111100000000000000000',
    '000000000000001111111101000000000000000000011111110110011111111111111111111111100000000000000000',
    '000000000000001011100001100000000000000000011111111111111110111111111111111111110000000000000000',
    '001000000000000011100000100000000000000000111111111111101111011111111111111111000000000000000000',
    '000000000000000011101100100000000000000001111111111111111111111001111101111110000000000000000000',
    '000000000000000001111000011100000000000001111111111111111111110000111000111100001000000000000000',
    '000000000000000000011100000010000000000001111111111111111011100000011000011110000000000000000000',
    '000000000000000000000100010010000000000001111111111111111110000000011000010110011100000000000000',
    '000000000000000000000111111110000000000001111111111111111111000000010000010000000100000000000000',
    '000000000000000000000000111111100000000000111111111111111111000000100000001000010000000000000000',
    '000000000000000000000001111111110000000000000000111111111110000000100000011101110000000000000000',
    '000000000000000000010001111111110000000000000000111111111100000000000000001101100011000000000000',
    '000000000000000000000011111111111110000000000000011111111000010000000000000100101010111000000000',
    '000000000000000000000001111111111111000000000000011111111000000000000000000010000000011110000000',
    '000000000000000000000001111111111111000000000000001111111100000000000000000000011100011100000000',
    '000000000000000000000000111111111110000000000000011111111101000000000000000000000000000010010000',
    '000000000000000000000000011111111110000000000000011111111011000000000000000000000111101000000000',
    '000000000000000000000000001111111110000000000000011111110011000000000000000000001111111000000000',
    '000100000000000000000000001111111100000000000000011111110010000000000000000000111111111000000000',
    '000000000000000000000000001111111000000000000000001111100000000000000000000001111111111100000000',
    '000000000000000000000000001111110000000000000000001111100000000000000000000001111111111100000000',
    '000000000000000000000000001111110000000000000000001111000000000000000000000001111111111100000000',
    '000000000000000000000000001111100000000000000000000000000000000000000000000001111111111100000000',
    '000000000000000000000000001111100000000000000000000000000000000000000000000011100011111100000000',
    '000000000000000000000000001111000000000000000000000000000000000000000000000000000011111000000000',
    '000000000000000000000000001110000000000000000000000000000000000000000000000000000001110000000000',
    '000000000000000000000000000110000000000000000000000000000000000000000000000000000001100000001000',
    '000000000000000000000000000110000000000000000000000000000000000000000000000000000001000000001000',
    '000000000000000000000000000110010000000000000000000000000000000000000000000000000001000000001000'
  ];

  function initMap() {
    var host = $('#dotmap');
    if (!host) return;
    var COLS = 96, ROWS = LAND.length;
    var isAfrica = function (r, c) {
      if (c < 42 || c > 62 || r < 24 || r > 47) return false;   /* continental box   */
      if (r < 29 && c > 58) return false;                        /* trim Arabia/Levant */
      if (r < 26 && c > 56) return false;
      return true;
    };
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + COLS + ' ' + ROWS);
    svg.setAttribute('class', 'dotmap');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Dotted map of the world with the African continent highlighted in green and Nigeria marked.');

    var gLand = document.createElementNS(NS, 'g'); gLand.setAttribute('class', 'land');
    var gAfr  = document.createElementNS(NS, 'g'); gAfr.setAttribute('class', 'africa');

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (LAND[r][c] !== '1') continue;
        var africa = isAfrica(r, c);
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', c + 0.5);
        dot.setAttribute('cy', r + 0.5);
        dot.setAttribute('r', africa ? 0.42 : 0.33);
        (africa ? gAfr : gLand).appendChild(dot);
      }
    }
    svg.appendChild(gLand);
    svg.appendChild(gAfr);
    host.insertBefore(svg, host.firstChild);

    /* On narrow screens the whole world is illegible, so we frame Africa. */
    var WORLD  = { x: 0,  y: 0,  w: COLS, h: ROWS };
    var AFRICA = { x: 37, y: 20, w: 32,   h: 33 };
    var current = null;

    var place = function () {
      var box = window.matchMedia('(max-width: 820px)').matches ? AFRICA : WORLD;
      if (box === current) return;
      current = box;
      svg.setAttribute('viewBox', box.x + ' ' + box.y + ' ' + box.w + ' ' + box.h);
      $$('[data-cell]', host).forEach(function (el) {
        var parts = el.getAttribute('data-cell').split(',');
        var col = parseFloat(parts[1]) + 0.5, row = parseFloat(parts[0]) + 0.5;
        el.style.left = ((col - box.x) / box.w * 100) + '%';
        el.style.top  = ((row - box.y) / box.h * 100) + '%';
      });
    };
    place();
    window.addEventListener('resize', place);
  }

  /* ------------------------------ Misc ---------------------------------- */
  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  function init() {
    initNav();
    initReveal();
    initOnView();
    initCarousels();
    initAccordions();
    initToggleGroups();
    initDonate();
    initCopy();
    initForms();
    initMap();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
