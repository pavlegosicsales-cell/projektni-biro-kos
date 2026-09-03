/* ==========================================================================
   Projektni biro Kos, ponasanje sajta
   Mobilna navigacija, scroll reveal, cepanje naslova na reci, FAQ akordeon,
   visekoracni upitnik i hvatanje mejla u podnozju.
   ========================================================================== */

/* Ovde ide Apps Script URL nakon sto se odradi Skill 03 (Form Backend Setup) */
const ENDPOINT = '';

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------- Glatki skrol
     Koristi se Lenis, ista biblioteka koju koristi referentni sajt.
     Rucna implementacija preko presretanja wheel dogadjaja je uklonjena
     jer se lomila na tacpedu i ostavljala stranicu da klizi i posle
     prestanka skrolovanja. Lenis vodi pravi skrol prozora, pa tastatura,
     traka za skrolovanje i dodir rade normalno. */
  var lenis = null;

  if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      lerp: 0.085,          // niza vrednost = mekse i duze klizanje
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false      // na dodir ostaje prirodna inercija sistema
    });

    var rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
  }

  // Jedan pomocnik za oba rezima
  function goToY(y) {
    if (lenis) { lenis.scrollTo(y); return; }
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* In-page anchor links ride the same easing */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const dest = document.querySelector(id);
    if (!dest) return;
    e.preventDefault();
    goToY(dest.getBoundingClientRect().top + window.scrollY - 100);
  });

  /* ---------------------------------------------------------------- Year */
  document.querySelectorAll('#year').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ------------------------------------------------------------------ Nav */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    });

    // Close the menu after tapping a link
    nav.querySelectorAll('.nav-menu a, .nav-cta a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Otvori meni');
      });
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });

    /* Traka prati smer skrolovanja:
       vrh strane  -> polupovidna teget traka
       nadole      -> bela puna traka
       nagore      -> potpuno providna traka
       Prag od 6px sprecava treperenje na sitnim pomerajima. */
    var lastY = window.scrollY;
    var TOP_ZONE = 40;
    var DIR_THRESHOLD = 6;

    const onScroll = function () {
      var y = window.scrollY;
      var delta = y - lastY;

      if (y <= TOP_ZONE) {
        nav.classList.remove('is-down', 'is-up');
        lastY = y;
        return;
      }
      if (Math.abs(delta) < DIR_THRESHOLD) return;

      if (delta > 0) {
        nav.classList.add('is-down');
        nav.classList.remove('is-up');
      } else {
        nav.classList.add('is-up');
        nav.classList.remove('is-down');
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* -------------------------------------------- Word-by-word heading split */
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    const blur = el.hasAttribute('data-split-blur');
    if (blur) el.classList.add('split-blur');

    const walk = function (node) {
      const kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (child) {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement('span');
            span.className = 'split-word';
            span.textContent = part;
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);

    el.querySelectorAll('.split-word').forEach(function (w, i) {
      w.style.setProperty('--word-delay', (i * 0.06) + 's');
    });
    el.dataset.splitDone = '1';
  }

  const splitTargets = document.querySelectorAll('[data-split]');
  if (!reduceMotion) {
    splitTargets.forEach(splitWords);
  }

  /* -------------------------------------------------- Scroll reveal system */
  if (reduceMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    splitTargets.forEach(function (el) { el.classList.add('split-ready'); });
  } else {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

    // Headings animate their words in when they scroll into view
    const headingIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('split-ready');
        headingIO.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    splitTargets.forEach(function (el) {
      // Headings above the fold reveal immediately on load
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        setTimeout(function () { el.classList.add('split-ready'); }, 350);
      } else {
        headingIO.observe(el);
      }
    });
  }

  /* --------------------------------------------------------- FAQ accordion */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq-item');
      const list = btn.closest('.faq-list');
      const willOpen = !item.classList.contains('is-open');

      if (list) {
        list.querySelectorAll('.faq-item').forEach(function (other) {
          other.classList.remove('is-open');
          const b = other.querySelector('.faq-q');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
      }
      item.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });

  /* ---------------------------------------------------------- POST helper */
  function send(payload) {
    if (!ENDPOINT) {
      // Backend jos nije povezan. Ispisujemo podatke da forma ostane proverljiva.
      console.info('[Projektni biro Kos] ENDPOINT je prazan. Podaci koji bi bili poslati:', payload);
      return Promise.resolve({ ok: true, simulated: true });
    }
    return fetch(ENDPOINT, {
      method: 'POST',
      // Apps Script web apps reject preflighted requests, so keep it simple.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('Request failed with status ' + res.status);
      return { ok: true };
    });
  }

  /* ============================================================== WIZARD */
  const form = document.getElementById('wizardForm');

  if (form) {
    const steps = Array.prototype.slice.call(form.querySelectorAll('.wiz-step'));
    const dotsWrap = document.getElementById('wizDots');
    const countEl = document.getElementById('wizCount');
    const submitBtn = document.getElementById('wizSubmit');
    const formError = document.getElementById('wizFormError');
    const doneEl = document.getElementById('wizDone');
    const summaryEl = document.getElementById('wizSummary');
    const total = steps.length;

    const answers = {
      service: '', projectType: '', timing: '', heardVia: '',
      suburb: '', name: '', phone: '', email: '', message: ''
    };
    let current = 0;

    // Progress dots
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('span');
      dot.className = 'wiz-dot';
      dotsWrap.appendChild(dot);
    }
    const dots = Array.prototype.slice.call(dotsWrap.children);

    function paint() {
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
      dots.forEach(function (d, i) { d.classList.toggle('is-done', i <= current); });
      countEl.textContent = 'Korak ' + (current + 1) + ' od ' + total;
    }

    function showError(key, on) {
      const el = form.querySelector('[data-error-for="' + key + '"]');
      if (el) el.hidden = !on;
    }

    function goTo(index) {
      current = Math.max(0, Math.min(total - 1, index));
      paint();
      const wizard = form.closest('.wizard');
      if (wizard) {
        goToY(wizard.getBoundingClientRect().top + window.scrollY - 110);
      }
      const firstControl = steps[current].querySelector('.choice, input, textarea');
      if (firstControl) firstControl.focus({ preventScroll: true });
    }

    // Choice buttons
    form.querySelectorAll('[data-choice-group]').forEach(function (group) {
      const key = group.dataset.choiceGroup;
      const autoAdvance = group.dataset.autoAdvance === 'true';

      group.querySelectorAll('.choice').forEach(function (choice) {
        choice.addEventListener('click', function () {
          group.querySelectorAll('.choice').forEach(function (c) { c.classList.remove('is-picked'); });
          choice.classList.add('is-picked');
          answers[key] = choice.dataset.value;
          showError(key, false);
          if (autoAdvance) {
            window.setTimeout(function () { if (current < total - 1) goTo(current + 1); }, 220);
          }
        });
      });
    });

    // Text inputs
    ['suburb', 'name', 'phone', 'email', 'message'].forEach(function (key) {
      const input = form.querySelector('#' + key);
      if (!input) return;
      input.addEventListener('input', function () {
        answers[key] = input.value.trim();
        showError(key, false);
      });
    });

    function validateStep(index) {
      const step = steps[index];
      const n = Number(step.dataset.step);
      let ok = true;

      if (n === 1 && !answers.service) { showError('service', true); ok = false; }
      if (n === 2 && !answers.projectType) { showError('projectType', true); ok = false; }
      if (n === 3 && !answers.timing) { showError('timing', true); ok = false; }
      if (n === 4 && !answers.suburb) { showError('suburb', true); ok = false; }

      if (n === 5) {
        if (!answers.name) { showError('name', true); ok = false; }
        if (!answers.phone || answers.phone.replace(/\D/g, '').length < 8) { showError('phone', true); ok = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) { showError('email', true); ok = false; }
      }
      return ok;
    }

    form.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validateStep(current)) return;
        goTo(current + 1);
      });
    });

    form.querySelectorAll('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { goTo(current - 1); });
    });

    // Enter should advance rather than submit early
    form.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      if (e.target.tagName === 'TEXTAREA') return;
      if (current < total - 1) {
        e.preventDefault();
        if (validateStep(current)) goTo(current + 1);
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (formError) formError.hidden = true;
      if (!validateStep(current)) return;

      submitBtn.disabled = true;
      const original = submitBtn.firstChild.textContent;
      submitBtn.firstChild.textContent = 'Šaljemo ';

      const payload = {
        formType: 'Upit za procenu i izlazak na teren',
        service: answers.service,
        projectType: answers.projectType,
        timing: answers.timing,
        heardVia: answers.heardVia,
        suburb: answers.suburb,
        name: answers.name,
        phone: answers.phone,
        email: answers.email,
        message: answers.message,
        submittedAt: new Date().toISOString(),
        page: window.location.href
      };

      send(payload).then(function () {
        form.style.display = 'none';
        doneEl.classList.add('is-active');

        summaryEl.innerHTML = '';
        [
          ['Posao', answers.service],
          ['Objekat', answers.projectType],
          ['Rok', answers.timing],
          ['Mesto', answers.suburb],
          ['Kontakt', answers.name + ', ' + answers.phone]
        ].forEach(function (row) {
          const wrap = document.createElement('div');
          wrap.className = 'summary-row';
          const dt = document.createElement('dt');
          dt.textContent = row[0];
          const dd = document.createElement('dd');
          dd.textContent = row[1];
          wrap.appendChild(dt);
          wrap.appendChild(dd);
          summaryEl.appendChild(wrap);
        });

        goToY(doneEl.getBoundingClientRect().top + window.scrollY - 120);
      }).catch(function (err) {
        console.error(err);
        submitBtn.disabled = false;
        submitBtn.firstChild.textContent = original;
        if (formError) {
          formError.hidden = false;
          formError.textContent = 'Slanje nije uspelo. Pozovite 063 442 011 i rešićemo to.';
        }
      });
    });

    paint();
  }

  /* ================================================= Footer call-back form */
  const cbForm = document.getElementById('callbackForm');
  if (cbForm) {
    const cbInput = document.getElementById('callbackEmail');
    const cbBtn = document.getElementById('callbackBtn');
    const cbNote = document.getElementById('callbackNote');

    cbForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const value = cbInput.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        cbNote.textContent = 'Upišite ispravnu mejl adresu.';
        cbInput.focus();
        return;
      }

      cbBtn.disabled = true;
      cbBtn.textContent = 'Šaljemo';
      cbNote.textContent = '';

      send({
        formType: 'Zahtev za povratni poziv',
        email: value,
        submittedAt: new Date().toISOString(),
        page: window.location.href
      }).then(function () {
        cbForm.reset();
        cbBtn.textContent = 'Pozovite me';
        cbBtn.disabled = false;
        cbNote.textContent = 'Hvala, javljamo se u najkraćem roku.';
      }).catch(function (err) {
        console.error(err);
        cbBtn.textContent = 'Pozovite me';
        cbBtn.disabled = false;
        cbNote.textContent = 'Slanje nije uspelo. Pozovite 063 442 011.';
      });
    });
  }

})();
