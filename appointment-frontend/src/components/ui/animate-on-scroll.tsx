"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

export type RevealVariant = "up" | "left" | "right" | "scale" | "fade";

type AnimateOnScrollProps = {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: ElementType;
  once?: boolean;
  threshold?: number;
};

const VARIANT_CLASS: Record<RevealVariant, string> = {
  up: "reveal-up",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
  fade: "reveal-fade",
};

export function AnimateOnScroll({
  children,
  variant = "up",
  delay = 0,
  className = "",
  as: Tag = "div",
  once = true,
  threshold = 0.12,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${VARIANT_CLASS[variant]} ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
