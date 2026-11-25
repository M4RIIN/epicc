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

function biographyTextRanges(paragraph: Element) {
  const ranges = [];
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    for (const { 0: line, index = 0 } of text.data.matchAll(/[^\n]+/g)) {
      const range = new Range();
      range.setStart(text, index);
      range.collapse(true);
      ranges.push({ range, length: line.length });
    }
  }
  return ranges;
}

function writeBiographyParagraph(paragraph: HTMLElement, highlight: Highlight) {
  const ranges = biographyTextRanges(paragraph);
  for (const { range } of ranges) highlight.add(range);

  let startedAt: number | undefined;
  const letterIntervalMs = 16;
  const writeLetters = (time: number) => {
    startedAt ??= time;
    const lettersWritten =
      1 + Math.floor((time - startedAt) / letterIntervalMs);
    for (const { range, length } of ranges) {
      range.setEnd(
        range.startContainer,
        range.startOffset + Math.min(lettersWritten, length),
      );
    }
    if (ranges.some(({ length }) => lettersWritten < length)) {
      requestAnimationFrame(writeLetters);
      return;
    }
    paragraph.dataset.biographyWriting = 'finished';
    for (const { range } of ranges) highlight.delete(range);
  };

  paragraph.dataset.biographyWriting = 'started';
  requestAnimationFrame(writeLetters);
}

const biographyParagraphs = document.querySelectorAll<HTMLElement>(
  '[data-biography-writing]',
);
if (
  biographyParagraphs.length &&
  'IntersectionObserver' in window &&
  typeof Highlight === 'function' &&
  CSS.highlights
) {
  const highlight = new Highlight();
  CSS.highlights.set('biography-writing', highlight);
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      writeBiographyParagraph(target as HTMLElement, highlight);
    }
  });

  for (const paragraph of biographyParagraphs) {
    paragraph.dataset.biographyWriting = 'pending';
    observer.observe(paragraph);
  }
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
