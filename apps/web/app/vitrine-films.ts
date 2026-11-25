function enhanceVitrineFilm(frame: HTMLElement) {
  const video = frame.querySelector('video');
  if (!video || !('IntersectionObserver' in window)) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const autoplay = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting || motion.matches) return;
      video.muted = true;
      void video.play().catch(() => {});
      autoplay.disconnect();
    },
    { threshold: 0.4 },
  );
  autoplay.observe(frame);

  if (!frame.hasAttribute('data-floating-film')) return;
  const close = frame.querySelector<HTMLButtonElement>('.vitrine-film-close');
  const updateFloating = () => {
    frame.toggleAttribute(
      'data-film-floating',
      !video.paused && frame.getBoundingClientRect().bottom <= 0,
    );
  };
  new IntersectionObserver(updateFloating).observe(frame);
  video.addEventListener('play', updateFloating);
  video.addEventListener('pause', updateFloating);
  close?.addEventListener('click', () => video.pause());
}

document
  .querySelectorAll<HTMLElement>('.vitrine-film')
  .forEach(enhanceVitrineFilm);
