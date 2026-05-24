"use client";

import { useEffect, useRef, useState } from "react";

export function RevealSection({
  children,
  delay = 0,
  className = "",
  id,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback: selalu tampilkan setelah 1.5 detik
    // mencegah konten blank jika IntersectionObserver gagal trigger
    const fallbackTimer = setTimeout(() => setInView(true), 1500);

    if (!("IntersectionObserver" in window)) {
      // Browser tidak support — langsung tampilkan
      setTimeout(() => setInView(true), 0);
      clearTimeout(fallbackTimer);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          clearTimeout(fallbackTimer);
          observer.unobserve(el);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0px)" : "translateY(24px)",
        transition: `opacity 1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
