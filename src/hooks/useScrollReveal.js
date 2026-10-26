import { useEffect } from 'react';

function useScrollReveal(isActive) {
  useEffect(() => {
    if (!isActive) return;

    // Small delay to let DOM render
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [isActive]);
}

export default useScrollReveal;
