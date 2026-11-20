type LetterEnd = { node: Text; offset: number };

function letterEnds(paragraph: Element, segmenter: Intl.Segmenter) {
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
  const letters: LetterEnd[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    for (const { segment, index } of segmenter.segment(node.data)) {
      if (segment.trim())
        letters.push({ node, offset: index + segment.length });
    }
  }
  return letters;
}

function typeParagraph(range: Range, letters: LetterEnd[], hidden: Highlight) {
  const duration = Math.min(letters.length * 28, 2400);
  const startedAt = performance.now();

  function reveal(now: number) {
    if (!hidden.has(range)) return;
    const elapsed = now - startedAt;
    if (elapsed >= duration) {
      hidden.delete(range);
      return;
    }

    const letter =
      letters[Math.floor((elapsed / duration) * letters.length) - 1];
    if (letter) range.setStart(letter.node, letter.offset);
    requestAnimationFrame(reveal);
  }

  requestAnimationFrame(reveal);
}

export function revealParagraphs() {
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  if (
    !motion.matches ||
    !CSS.highlights ||
    !('Highlight' in window) ||
    !('IntersectionObserver' in window) ||
    !('Segmenter' in Intl)
  ) {
    return;
  }

  const segmenter = new Intl.Segmenter();
  const hidden = new Highlight();
  const waiting = new Map<Element, Range>();
  const observer = new IntersectionObserver((entries) => {
    for (const { isIntersecting, target } of entries) {
      const range = waiting.get(target);
      if (!isIntersecting || !range) continue;
      observer.unobserve(target);
      waiting.delete(target);
      typeParagraph(range, letterEnds(target, segmenter), hidden);
    }
  });

  CSS.highlights.set('paragraph-reveal', hidden);
  // La définition du manifeste possède déjà son propre effet de machine à écrire.
  for (const paragraph of document.querySelectorAll(
    'p:not(.vitrine-manifesto-definition)',
  )) {
    if (!paragraph.textContent?.trim()) continue;
    const range = new Range();
    range.selectNodeContents(paragraph);
    waiting.set(paragraph, range);
    hidden.add(range);
    observer.observe(paragraph);
  }

  motion.addEventListener(
    'change',
    () => {
      observer.disconnect();
      waiting.clear();
      hidden.clear();
      CSS.highlights.delete('paragraph-reveal');
    },
    { once: true },
  );
}
