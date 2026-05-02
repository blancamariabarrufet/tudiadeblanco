"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FRAME_COUNT = 120;
const FRAME_PATH = "/images/wedding-scroll/frame-";

function frameSrc(index: number) {
  return `${FRAME_PATH}${String(index).padStart(4, "0")}.jpg`;
}

export function ScrollFrameStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const [frame, setFrame] = useState(1);

  const frames = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, index) => frameSrc(index + 1)),
    []
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const updateFrame = () => {
      rafRef.current = null;

      if (!sectionRef.current) {
        return;
      }

      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableDistance = rect.height - window.innerHeight;
      const progress = scrollableDistance > 0 ? Math.min(1, Math.max(0, -rect.top / scrollableDistance)) : 0;
      const nextFrame = Math.min(FRAME_COUNT, Math.max(1, Math.round(progress * (FRAME_COUNT - 1)) + 1));

      setFrame((current) => (current === nextFrame ? current : nextFrame));
    };

    const handleScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(updateFrame);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const preloadFrames = () => {
      frames.forEach((src) => {
        const image = new window.Image();
        image.src = src;
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadFrames, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(preloadFrames, 400);
    return () => globalThis.clearTimeout(timeoutId);
  }, [frames]);

  return (
    <section ref={sectionRef} className="relative h-[240vh] bg-[color:var(--surface)]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-8 lg:px-20">
        <div className="relative w-full max-w-6xl">
          <div className="relative mx-auto overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--surface-container-lowest)] p-3 shadow-[0_30px_90px_rgba(76,62,50,0.14)] sm:p-4">
            <div className="relative aspect-video overflow-hidden rounded-[0.2rem] bg-[color:var(--surface-container-low)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- scroll-scrubbed frame sequences should not create 120 optimized image routes */}
              <img
                src={frameSrc(frame)}
                alt="Wedding website preview unfolding in motion"
                className="h-full w-full object-cover"
                draggable={false}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 45%, rgba(250, 246, 238, 0.01) 0%, rgba(108, 91, 78, 0.08) 55%, rgba(39, 30, 24, 0.32) 100%)",
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-1 pb-1 pt-5 sm:px-2 sm:pt-6">
              <p className="font-[family-name:var(--font-newsreader)] text-[1.1rem] italic leading-tight text-[color:var(--primary)] sm:text-[1.35rem]">
                A page that moves like a memory.
              </p>
              <p className="hidden font-[family-name:var(--font-work-sans)] text-[0.62rem] uppercase tracking-[0.12em] text-[rgba(108,91,78,0.58)] sm:block">
                Tu dia de blanco
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
