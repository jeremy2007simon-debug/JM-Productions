/* =============================================
   PROPFLOW — main.js
   Production-ready. No dependencies.
============================================= */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     1. NAV — scroll effect + burger menu
  ───────────────────────────────────────── */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  function handleNavScroll() {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-label', 'Abrir menú');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('open') && !nav.contains(e.target)) {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-label', 'Abrir menú');
        document.body.style.overflow = '';
      }
    });
  }

  /* ─────────────────────────────────────────
     2. SMOOTH SCROLL for anchor links
  ───────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navHeight = 72;
      const targetY = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });

  /* ─────────────────────────────────────────
     3. SCROLL PROGRESS BAR
  ───────────────────────────────────────── */
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ─────────────────────────────────────────
     4. INTERSECTION OBSERVER — scroll reveal
  ───────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const siblings = Array.from(entry.target.parentNode.querySelectorAll('.reveal:not(.visible)'));
          const idx = siblings.indexOf(entry.target);
          const stagger = Math.max(0, idx) * 80;
          const baseDelay = parseFloat(getComputedStyle(entry.target).getPropertyValue('--delay') || '0') * 1000;
          const totalDelay = baseDelay + stagger;
          setTimeout(function () {
            entry.target.classList.add('visible');
          }, totalDelay);
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ─────────────────────────────────────────
     5. COUNTERS — animate 0 → target on scroll
  ───────────────────────────────────────── */
  const counterEls = document.querySelectorAll('.counter');

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = Math.round(target * eased);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterEls.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  /* ─────────────────────────────────────────
     6. ROI CALCULATOR
  ───────────────────────────────────────── */
  const sliderLeads = document.getElementById('sliderLeads');
  const sliderComision = document.getElementById('sliderComision');
  const sliderCierre = document.getElementById('sliderCierre');
  const valLeads = document.getElementById('valLeads');
  const valComision = document.getElementById('valComision');
  const valCierre = document.getElementById('valCierre');
  const resLoss = document.getElementById('resLoss');
  const resExtra = document.getElementById('resExtra');
  const resCosto = document.getElementById('resCosto');
  const resGanancia = document.getElementById('resGanancia');

  function fmtEuro(n) {
    if (n === 0) return '€0';
    if (n >= 1000000) {
      const m = (n / 1000000).toFixed(2).replace('.', ',');
      return '€' + m + 'M';
    }
    if (n >= 1000) {
      const parts = Math.round(n).toString();
      const thousands = parts.slice(0, -3);
      const rest = parts.slice(-3);
      return '€' + thousands + '.' + rest;
    }
    return '€' + Math.round(n);
  }

  function fmtComision(n) {
    if (n >= 1000) {
      return '€' + Math.round(n / 1000) + '.000';
    }
    return '€' + n;
  }

  function updateSliderTrack(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(90deg, #7B61FF 0%, #00C8FF ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
  }

  function calcROI() {
    if (!sliderLeads || !sliderComision || !sliderCierre) return;

    const leads = parseInt(sliderLeads.value, 10);
    const comision = parseInt(sliderComision.value, 10);
    const cierre = parseInt(sliderCierre.value, 10) / 100;

    valLeads.textContent = leads;
    valComision.textContent = fmtComision(comision);
    valCierre.textContent = sliderCierre.value + '%';

    updateSliderTrack(sliderLeads);
    updateSliderTrack(sliderComision);
    updateSliderTrack(sliderCierre);

    const actual = leads * cierre * comision * 12;
    const conPropflow = leads * 0.18 * comision * 12;
    const extra = Math.max(conPropflow - actual, 0);
    const costo = 13200;
    const ganancia = Math.max(extra - costo, 0);
    const loss = Math.max(conPropflow - actual, 0);

    if (resLoss) resLoss.textContent = fmtEuro(loss);
    if (resExtra) resExtra.textContent = fmtEuro(extra);
    if (resCosto) resCosto.textContent = '€13.200';
    if (resGanancia) resGanancia.textContent = fmtEuro(ganancia);
  }

  if (sliderLeads) {
    sliderLeads.addEventListener('input', calcROI);
    sliderComision.addEventListener('input', calcROI);
    sliderCierre.addEventListener('input', calcROI);
    calcROI();
  }

  /* ─────────────────────────────────────────
     7. FAQ ACCORDION
  ───────────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    const btn = item.querySelector('.faq-item__q');
    const answer = item.querySelector('.faq-item__a');
    if (!btn || !answer) return;

    btn.addEventListener('click', function () {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      faqItems.forEach(function (other) {
        const otherBtn = other.querySelector('.faq-item__q');
        const otherAnswer = other.querySelector('.faq-item__a');
        if (otherBtn && otherAnswer && other !== item) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherAnswer.classList.remove('open');
        }
      });

      const willOpen = !isOpen;
      btn.setAttribute('aria-expanded', willOpen.toString());
      answer.classList.toggle('open', willOpen);
    });
  });

  /* ─────────────────────────────────────────
     8. CONTACT FORM — fetch submit
  ───────────────────────────────────────── */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = contactForm ? contactForm.querySelector('.form-submit') : null;

  if (contactForm && formSuccess) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const requiredInputs = contactForm.querySelectorAll('[required]');
      let valid = true;
      requiredInputs.forEach(function (input) {
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = '#FF4757';
          input.addEventListener('input', function () {
            input.style.borderColor = '';
          }, { once: true });
        }
      });
      if (!valid) return;

      if (submitBtn) {
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
      }

      try {
        const formData = new FormData(contactForm);
        const response = await fetch('https://formsubmit.co/ajax/jmproductions863@gmail.com', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData
        });

        if (response.ok) {
          contactForm.style.display = 'none';
          formSuccess.style.display = 'block';
          formSuccess.style.opacity = '0';
          formSuccess.style.transform = 'translateY(20px)';
          formSuccess.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              formSuccess.style.opacity = '1';
              formSuccess.style.transform = 'translateY(0)';
            });
          });
        } else {
          throw new Error('Form submission failed');
        }
      } catch (err) {
        console.error('Form error:', err);
        if (submitBtn) {
          submitBtn.textContent = 'Error al enviar. Inténtalo de nuevo.';
          submitBtn.disabled = false;
          submitBtn.style.opacity = '';
          submitBtn.style.background = 'rgba(255,71,87,0.2)';
          setTimeout(function () {
            submitBtn.textContent = 'Agenda mi auditoría gratuita →';
            submitBtn.style.background = '';
          }, 3000);
        }
      }
    });
  }

  /* ─────────────────────────────────────────
     9. SCORE BAR ANIMATION on scroll
  ───────────────────────────────────────── */
  const scoreBars = document.querySelectorAll('.score-bar');
  if ('IntersectionObserver' in window && scoreBars.length > 0) {
    const scoreObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)';
          scoreObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    scoreBars.forEach(function (bar) {
      const finalWidth = bar.style.width;
      bar.style.width = '0%';
      scoreObserver.observe(bar);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bar.style.width = finalWidth;
        });
      });
    });
  }

  /* ─────────────────────────────────────────
     10. RANGE SLIDER — initial track fill
  ───────────────────────────────────────── */
  document.querySelectorAll('.range-slider').forEach(function (slider) {
    updateSliderTrack(slider);
    slider.addEventListener('input', function () {
      updateSliderTrack(this);
    });
  });

  /* ─────────────────────────────────────────
     11. PAGE LOAD — reveal hero immediately
  ───────────────────────────────────────── */
  window.addEventListener('load', function () {
    document.querySelectorAll('.hero .reveal').forEach(function (el) {
      setTimeout(function () {
        el.classList.add('visible');
      }, parseFloat(getComputedStyle(el).getPropertyValue('--delay') || '0') * 1000);
    });
  });

})();
