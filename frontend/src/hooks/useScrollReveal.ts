import { useEffect, useRef } from "react";

export function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            e.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    const el = ref.current;
    if (!el) return;

    el.querySelectorAll(".reveal, .scroll-reveal").forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default useScrollReveal;
