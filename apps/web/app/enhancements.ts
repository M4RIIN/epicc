const pointerLogo = document.querySelector<HTMLElement>('.epicc-pointer-logo');
if (pointerLogo) {
  const hidePointerLogo = () => pointerLogo.removeAttribute('data-visible');
  const edgeMargin = 56;

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') {
      hidePointerLogo();
      return;
    }

    const { clientX, clientY } = event;
    pointerLogo.style.transform = `translate(${clientX}px, ${clientY}px)`;
    pointerLogo.toggleAttribute(
      'data-flip-x',
      clientX > innerWidth - edgeMargin,
    );
    pointerLogo.toggleAttribute(
      'data-flip-y',
      clientY > innerHeight - edgeMargin,
    );
    pointerLogo.setAttribute('data-visible', '');
  });
  window.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') hidePointerLogo();
  });
  document.documentElement.addEventListener('pointerleave', hidePointerLogo);
  window.addEventListener('pointercancel', hidePointerLogo);
  window.addEventListener('blur', hidePointerLogo);
}

const manifesto = document.querySelector('#epicc');
if (
  manifesto &&
  'IntersectionObserver' in window &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  manifesto.classList.add('vitrine-manifesto-rotation');
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      manifesto.classList.add('vitrine-manifesto-animated');
      observer.disconnect();
    },
    { threshold: 0.25 },
  );
  observer.observe(manifesto);
}

const projects = document.querySelector('#projets');
const gallery = projects?.querySelector<HTMLElement>(
  '.vitrine-projects-collage',
);
if (projects && gallery) {
  gallery.addEventListener(
    'pointermove',
    ({ clientX, clientY, pointerType }) => {
      if (pointerType !== 'mouse') return;
      gallery.style.setProperty('--preview-x', `${clientX}px`);
      gallery.style.setProperty('--preview-y', `${clientY}px`);
      gallery.setAttribute(
        'data-preview-pointer',
        clientY < 216 ? 'below' : 'above',
      );
    },
  );

  const updateProjectsEdges = () => {
    const { scrollTop, scrollHeight, clientHeight } = gallery;
    projects.toggleAttribute('data-projects-above', scrollTop > 1);
    projects.toggleAttribute(
      'data-projects-below',
      scrollHeight - clientHeight - scrollTop > 1,
    );
  };
  gallery.addEventListener('scroll', updateProjectsEdges, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(updateProjectsEdges).observe(gallery);
  }
  updateProjectsEdges();
}

const contact = document.querySelector<HTMLFormElement>(
  '.vitrine-contact-form[action^="mailto:"]',
);
contact?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(contact);
  const subject = `Une collaboration avec ${data.get('prenom')} ${data.get('nom')}`;
  const body = `Nom : ${data.get('nom')}\nPrénom : ${data.get('prenom')}\n\n${data.get('demande')}`;
  window.location.href = `${contact.action}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
