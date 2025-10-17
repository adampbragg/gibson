function qs<T extends Element>(selector: string, root: ParentNode | Document = document): T | null {
  return root.querySelector(selector) as T | null;
}

function setupLightbox(): void {
  const grid = document.getElementById('gallery-grid');
  const modal = document.getElementById('lightbox');
  const imgEl = document.getElementById('lightbox-image') as HTMLImageElement | null;
  const closeBtn = document.getElementById('lightbox-close');

  if (!modal || !grid || !imgEl || !closeBtn) return;
  // Narrow to non-null, specifically typed elements for use in inner closures
  const gridEl = grid as HTMLElement;
  const modalEl = modal as HTMLElement;
  const imageEl = imgEl as HTMLImageElement;
  const closeEl = closeBtn as HTMLElement;

  function openLightbox(src: string, alt?: string): void {
    imageEl.src = src;
    imageEl.alt = alt || '';
    modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(): void {
    modalEl.classList.add('hidden');
    imageEl.removeAttribute('src');
    document.body.style.overflow = '';
  }

  // Open on image click within the grid
  gridEl.addEventListener('click', (e: MouseEvent) => {
    const t = e.target as EventTarget | null;
    if (!(t instanceof HTMLImageElement)) return;
    openLightbox(t.src, t.alt);
  });

  // Close on backdrop click or close button
  modalEl.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target) return;
    if (target === modalEl || !!target.closest('#lightbox-close')) {
      closeLightbox();
    }
  });

  // Close on ESC
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Explicit close button
  closeEl.addEventListener('click', () => closeLightbox());
}

function init(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLightbox);
  } else {
    setupLightbox();
  }
}

if (typeof window !== 'undefined') {
  init();
}
