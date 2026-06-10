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

// ROI Calculator
const sliderHoras = document.getElementById('sliderHoras');
const sliderValor = document.getElementById('sliderValor');
const sliderEmp   = document.getElementById('sliderEmp');
const lblHoras    = document.getElementById('lblHoras');
const lblValor    = document.getElementById('lblValor');
const lblEmp      = document.getElementById('lblEmp');
const resLoss     = document.getElementById('resLoss');
const resCosto    = document.getElementById('resCosto');
const resGanancia = document.getElementById('resGanancia');

function fmt(n) {
  if (n >= 1000000) return '€' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '€' + n.toLocaleString('es-ES');
  return '€' + n;
}

function calcROI() {
  const horas = +sliderHoras.value;
  const valor = +sliderValor.value;
  const emp   = +sliderEmp.value;
  lblHoras.textContent = horas + 'h';
  lblValor.textContent = '€' + valor;
  lblEmp.textContent   = emp + (emp === 1 ? ' persona' : ' personas');
  const perdida = Math.round(horas * valor * 52 * emp);
  const costo   = 17964;
  const ganancia = Math.max(perdida - costo, 0);
  resLoss.textContent     = fmt(perdida);
  resCosto.textContent    = fmt(costo);
  resGanancia.textContent = fmt(ganancia);
}

if (sliderHoras) {
  [sliderHoras, sliderValor, sliderEmp].forEach(s => s.addEventListener('input', calcROI));
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

// Contact form
const form = document.getElementById('contactForm');
const successMsg = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type=submit]');
    const original = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    setTimeout(() => {
      successMsg.classList.add('show');
      form.reset();
      submitBtn.textContent = original;
      submitBtn.disabled = false;
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1000);
  });
}
