document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateVideoMotion = () => {
    document.querySelectorAll('[data-brs-motion-video]').forEach(video => {
      if (reducedMotion.matches) {
        video.pause();
      } else {
        video.play().catch(() => { /* The static background remains available. */ });
      }
    });
  };
  updateVideoMotion();
  reducedMotion.addEventListener('change', updateVideoMotion);
  const burgerButtons = document.querySelectorAll('.header__burger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileNav && burgerButtons.length > 0) {
    burgerButtons.forEach(burger => {
      burger.addEventListener('click', () => {
        mobileNav.classList.toggle('mobile-nav_active');
      });
    });

    const navLinks = mobileNav.querySelectorAll('a');

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('mobile-nav_active');
      });
    });
  }
});
