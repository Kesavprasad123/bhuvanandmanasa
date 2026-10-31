import { useEffect } from 'react';

function useScrollReveal(isActive = true) {
  useEffect(() => {
    if (!isActive) return;

    let observer = null;

    const scanAndObserve = () => {
      const elements = document.querySelectorAll('.reveal:not(.visible)');
      if (elements.length === 0) return;

      if (!('IntersectionObserver' in window)) {
        elements.forEach((el) => el.classList.add('visible'));
        return;
      }

      if (!observer) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.05, rootMargin: '80px 0px 80px 0px' }
        );
      }

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Immediately reveal elements already in or near viewport
        if (rect.top < viewportHeight + 120 && rect.bottom > -120) {
          el.classList.add('visible');
        } else {
          observer.observe(el);
        }
      });
    };

    // Scan immediately on mount
    scanAndObserve();

    // Scan on progressive intervals to catch lazy chunks, images, and font renders
    const t1 = setTimeout(scanAndObserve, 60);
    const t2 = setTimeout(scanAndObserve, 250);
    const t3 = setTimeout(scanAndObserve, 750);

    // Guaranteed safety fallback: reveal all content if observer doesn't fire
    const safety = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => {
        el.classList.add('visible');
      });
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(safety);
      if (observer) observer.disconnect();
    };
  }, [isActive]);
}

export default useScrollReveal;
