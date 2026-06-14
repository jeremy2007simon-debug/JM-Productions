// Nav: scroll effect + burger menu
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
});

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// Scroll reveal with stagger
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 70);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObs.observe(el));

// Counter animation
function animateCount(el) {
  const target = +el.dataset.target;
  const duration = 2000;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.counter').forEach(animateCount);
      counterObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.metrics__grid, .pain__grid').forEach(el => counterObs.observe(el));

// ROI Calculator — Real Estate
const sliderLeads    = document.getElementById('sliderLeads');
const sliderComision = document.getElementById('sliderComision');
const sliderCierre   = document.getElementById('sliderCierre');
const lblLeads       = document.getElementById('lblLeads');
const lblComision    = document.getElementById('lblComision');
const lblCierre      = document.getElementById('lblCierre');
const resLoss        = document.getElementById('resLoss');
const resExtra       = document.getElementById('resExtra');
const resCosto       = document.getElementById('resCosto');
const resGanancia    = document.getElementById('resGanancia');

function fmt(n) {
  if (n >= 1000000) return '€' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '€' + n.toLocaleString('es-ES');
  return '€' + n;
}

function calcROI() {
  const leads    = +sliderLeads.value;
  const comision = +sliderComision.value;
  const cierre   = +sliderCierre.value / 100;
  lblLeads.textContent    = leads + ' leads';
  lblComision.textContent = '€' + comision.toLocaleString('es-ES');
  lblCierre.textContent   = cierre * 100 + '%';

  // What they currently earn per year
  const actual = Math.round(leads * cierre * comision * 12);
  // What they'd earn with Propflow (18% close rate)
  const conPropflow = Math.round(leads * 0.18 * comision * 12);
  const extra = Math.max(conPropflow - actual, 0);
  const costo = 13200; // €1,100/mes × 12
  const ganancia = Math.max(extra - costo, 0);

  resLoss.textContent     = fmt(extra);      // "ventas que estás perdiendo"
  resExtra.textContent    = fmt(extra);
  resCosto.textContent    = fmt(costo);
  resGanancia.textContent = fmt(ganancia);
}

if (sliderLeads) {
  [sliderLeads, sliderComision, sliderCierre].forEach(s => s.addEventListener('input', calcROI));
  calcROI();
}

// FAQ accordion
document.querySelectorAll('.faq-item__q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// Contact form — sends to jmproductions863@gmail.com via Formsubmit.co
const form = document.getElementById('contactForm');
const successMsg = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type=submit]');
    const original = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    const data = {};
    new FormData(form).forEach(function(value, key) { data[key] = value; });
    data['_subject'] = 'Nueva solicitud de auditoría — Propflow';

    try {
      const res = await fetch('https://formsubmit.co/ajax/jmproductions863@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        successMsg.classList.add('show');
        form.reset();
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        alert('Error al enviar. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      alert('Error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      submitBtn.textContent = original;
      submitBtn.disabled = false;
    }
  });
}
