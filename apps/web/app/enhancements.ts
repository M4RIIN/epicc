import { revealParagraphs } from './paragraph-reveal';

revealParagraphs();

function besidePointer(
  pointer: number,
  size: number,
  edge: number,
  gap: number,
) {
  const margin = 12;
  return pointer + gap + size <= edge - margin
    ? pointer + gap
    : Math.max(margin, pointer - size - gap);
}

for (const service of document.querySelectorAll<HTMLElement>(
  '.vitrine-service',
)) {
  const tooltip = service.querySelector<HTMLElement>(
    '.vitrine-service-tooltip',
  );
  if (!tooltip) continue;

  service.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    tooltip.hidden = false;
    const x = besidePointer(event.clientX, tooltip.offsetWidth, innerWidth, 56);
    const y = besidePointer(
      event.clientY,
      tooltip.offsetHeight,
      innerHeight,
      14,
    );
    tooltip.style.translate = `${x}px ${y}px`;
  });
  service.addEventListener('pointerleave', () => {
    tooltip.hidden = true;
  });
}

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
const manifestoDefinition = manifesto?.querySelector(
  '.vitrine-manifesto-definition',
);
if (manifesto && manifestoDefinition && 'IntersectionObserver' in window) {
  manifestoDefinition.classList.add('vitrine-manifesto-rotation');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.add(
          target === manifestoDefinition
            ? 'vitrine-manifesto-rotating'
            : 'vitrine-manifesto-animated',
        );
        observer.unobserve(target);
      }
    },
    { threshold: 0.25 },
  );
  observer.observe(manifesto);
  observer.observe(manifestoDefinition);
}

const projects = document.querySelector('#projets');
const gallery = projects?.querySelector<HTMLElement>(
  '.vitrine-projects-collage',
);
if (projects && gallery) {
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
