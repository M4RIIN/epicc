const manifesto = document.querySelector('#epicc');
if (
  manifesto &&
  'IntersectionObserver' in window &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches
) {
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
