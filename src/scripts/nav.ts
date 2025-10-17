function getToggle(): HTMLInputElement | null {
  const el = document.getElementById('nav-toggle');
  return el instanceof HTMLInputElement ? el : null;
}

function handleMobileClick(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const link = target.closest('a');
  if (link) {
    const toggle = getToggle();
    if (toggle) toggle.checked = false;
  }
}

function updateShadow(): void {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  if (window.scrollY > 0) {
    nav.classList.add('shadow-sm');
  } else {
    nav.classList.remove('shadow-sm');
  }
}

function setup(): void {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    mobileMenu.addEventListener('click', handleMobileClick);
  }
  updateShadow();
  window.addEventListener('scroll', updateShadow, { passive: true });
}

if (typeof window !== 'undefined') {
  // Defer until DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}
