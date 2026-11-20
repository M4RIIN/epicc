type LetterEnd = { node: Text; offset: number };
type Paragraph = { element: HTMLParagraphElement; range: Range };

function sequenceRoot(paragraph: Element) {
  return paragraph.closest('[data-paragraph-sequence]') ?? paragraph;
}

function letterEnds(paragraph: Node, segmenter: Intl.Segmenter) {
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

  return new Promise<void>((finish) => {
    function reveal(now: number) {
      const elapsed = now - startedAt;
      if (!hidden.has(range) || elapsed >= duration) {
        hidden.delete(range);
        finish();
        return;
      }

      const letter =
        letters[Math.floor((elapsed / duration) * letters.length) - 1];
      if (letter) range.setStart(letter.node, letter.offset);
      requestAnimationFrame(reveal);
    }

    requestAnimationFrame(reveal);
  });
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
  const waiting = new Map<Element, Paragraph[]>();

  async function typeSequence(sequence: Paragraph[]) {
    for (const { element, range } of sequence) {
      if (!hidden.has(range)) break;
      await typeParagraph(range, letterEnds(element, segmenter), hidden);
    }
  }

  const observer = new IntersectionObserver((entries) => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting) continue;
      const root = sequenceRoot(target);
      const sequence = waiting.get(root);
      if (!sequence) continue;
      waiting.delete(root);
      for (const { element } of sequence) observer.unobserve(element);
      void typeSequence(sequence);
    }
  });

  CSS.highlights.set('paragraph-reveal', hidden);
  // La définition du manifeste possède déjà son propre effet de machine à écrire.
  for (const paragraph of document.querySelectorAll<HTMLParagraphElement>(
    'p:not(.vitrine-manifesto-definition)',
  )) {
    if (!paragraph.textContent?.trim()) continue;
    const range = new Range();
    range.selectNodeContents(paragraph);
    hidden.add(range);
    const root = sequenceRoot(paragraph);
    const sequence = waiting.get(root) ?? [];
    sequence.push({ element: paragraph, range });
    waiting.set(root, sequence);
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
