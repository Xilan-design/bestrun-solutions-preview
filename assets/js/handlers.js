document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateVideoMotion = () => {
    document.querySelectorAll('[data-brs-motion-video]').forEach(video => {
      if (reducedMotion.matches) video.pause();
      else video.play().catch(() => { /* Keep the static background. */ });
    });
  };
  updateVideoMotion();
  reducedMotion.addEventListener('change', updateVideoMotion);

  const nav = document.querySelector('.mobile-nav');
  const openButton = document.querySelector('.header .header__burger');
  const closeButton = nav?.querySelector('.header__burger');
  const setNavigation = (open, restoreFocus = false) => {
    if (!nav) return;
    nav.classList.toggle('mobile-nav_active', open);
    nav.inert = !open;
    nav.setAttribute('aria-hidden', String(!open));
    openButton?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('brs-nav-open', open);
    if (open) closeButton?.focus();
    else if (restoreFocus) openButton?.focus();
  };
  openButton?.addEventListener('click', () => setNavigation(true));
  closeButton?.addEventListener('click', () => setNavigation(false, true));
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setNavigation(false)));

  const servicesToggle = document.querySelector('.nav-services__toggle');
  const servicesMenu = document.querySelector('.nav-services__menu');
  const closeServices = () => {
    if (servicesMenu) servicesMenu.hidden = true;
    servicesToggle?.setAttribute('aria-expanded', 'false');
  };
  servicesToggle?.addEventListener('click', () => {
    servicesMenu.hidden = !servicesMenu.hidden;
    servicesToggle.setAttribute('aria-expanded', String(!servicesMenu.hidden));
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-services')) closeServices();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (nav?.classList.contains('mobile-nav_active')) setNavigation(false, true);
      if (servicesMenu && !servicesMenu.hidden) { closeServices(); servicesToggle.focus(); }
    }
    if (event.key === 'Tab' && nav?.classList.contains('mobile-nav_active')) {
      const elements = [...nav.querySelectorAll('a, button')].filter(element => element.getClientRects().length);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(max-width: 1320px)').addEventListener('change', event => {
    if (!event.matches) setNavigation(false);
    closeServices();
  });

  const revealLegacySection = () => {
    if (!['#careers', '#blog'].includes(location.hash)) return;
    const details = document.querySelector('#company-updates');
    const target = document.querySelector(location.hash);
    if (details && target) {
      details.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  };
  window.addEventListener('hashchange', revealLegacySection);
  revealLegacySection();
});
