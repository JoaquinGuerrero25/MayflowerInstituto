(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sticky header shadow + WhatsApp FAB visibility */
  const header = document.querySelector('.site-header');
  const fab = document.querySelector('.wa-fab');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = window.innerHeight;
      header.classList.toggle('is-scrolled', y > 8);
      const menuOpen = document.body.classList.contains('menu-open');
      fab.classList.toggle('is-visible', y > h * 0.75 && !menuOpen);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const menuBtn = document.getElementById('mf-menu-btn');
  const mobileNav = document.getElementById('mf-mobile-menu');
  const menuOpenIcon = menuBtn.querySelector('.icon-open');
  const menuCloseIcon = menuBtn.querySelector('.icon-close');

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    mobileNav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuOpenIcon.toggleAttribute('hidden', open);
    menuCloseIcon.toggleAttribute('hidden', !open);
    onScroll();
  }
  menuBtn.addEventListener('click', () => setMenu(mobileNav.hidden));
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !mobileNav.hidden) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  const mq = matchMedia('(max-width: 900px)');
  mq.addEventListener('change', e => { if (!e.matches) setMenu(false); });

  /* FAQ accordion */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const willOpen = btn.getAttribute('aria-expanded') !== 'true';
      document.querySelectorAll('.faq-question').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          document.getElementById(other.getAttribute('aria-controls')).classList.remove('is-open');
        }
      });
      btn.setAttribute('aria-expanded', String(willOpen));
      panel.classList.toggle('is-open', willOpen);
    });
  });

  /* Reveal on scroll */
  if (!reducedMotion && 'IntersectionObserver' in window && Element.prototype.animate) {
    const groups = new Map();
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const parent = el.parentElement;
      const i = groups.get(parent) || 0;
      groups.set(parent, i + 1);
      el.classList.add('reveal-init');
      el.dataset.revealIndex = i;
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const i = Number(el.dataset.revealIndex || 0);
        const anim = el.animate(
          [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }],
          { duration: 700, delay: Math.min(i, 5) * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }
        );
        anim.onfinish = () => { el.classList.remove('reveal-init'); anim.cancel(); };
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.remove('reveal-init'));
  }

  /* Animated stat counters */
  const statsSection = document.getElementById('mf-stats');
  if (statsSection && !reducedMotion && 'IntersectionObserver' in window) {
    const targets = Array.from(statsSection.querySelectorAll('[data-count-to]'));
    const fmt = new Intl.NumberFormat('es-AR');
    const run = () => {
      const dur = 1400;
      const t0 = performance.now();
      const step = t => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        targets.forEach(el => {
          const to = Number(el.dataset.countTo);
          const v = Math.round(to * eased);
          el.textContent = el.hasAttribute('data-plain') ? String(v) : fmt.format(v);
        });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const statIO = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { statIO.disconnect(); run(); }
    }, { threshold: 0.4 });
    statIO.observe(statsSection);
  }

  /* Parallax on hero/photo blocks */
  if (!reducedMotion) {
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    function tickParallax() {
      const h = window.innerHeight;
      parallaxEls.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > h) return;
        const off = (r.top + r.height / 2 - h / 2) * -0.05;
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0) scale(1.08)`;
      });
    }
    addEventListener('scroll', () => requestAnimationFrame(tickParallax), { passive: true });
    tickParallax();
  }

  /* Footer year */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Contact form */
  const form = document.getElementById('contact-form');
  if (form) {
    const statusEl = document.getElementById('form-status');
    const nameInput = form.elements.nombre;
    const emailInput = form.elements.email;
    const nameErr = document.getElementById('f-nombre-err');
    const mailErr = document.getElementById('f-mail-err');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const errNombre = nameInput.value.trim() ? '' : 'Escribí tu nombre.';
      const errMail = !emailInput.value.trim()
        ? 'Escribí tu email.'
        : (emailInput.validity.valid ? '' : 'Revisá el formato del email.');

      nameInput.setAttribute('aria-invalid', errNombre ? 'true' : 'false');
      emailInput.setAttribute('aria-invalid', errMail ? 'true' : 'false');
      nameErr.textContent = errNombre;
      mailErr.textContent = errMail;

      if (errNombre || errMail) {
        statusEl.textContent = '';
        (errNombre ? nameInput : emailInput).focus();
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = 'Enviando...';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (response.ok) {
          form.reset();
          statusEl.textContent = '¡Gracias! Te vamos a contactar a la brevedad.';
        } else {
          statusEl.textContent = 'No pudimos enviar tu consulta. Escribinos por WhatsApp.';
        }
      } catch (err) {
        statusEl.textContent = 'No pudimos enviar tu consulta. Escribinos por WhatsApp.';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
})();
