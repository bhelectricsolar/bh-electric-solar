"use client";

import { useEffect, useState } from "react";
import { BENEFIT_CARDS } from "@/lib/benefitsData";

const CYCLE_MS = 3200;

export default function BenefitCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion || paused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % BENEFIT_CARDS.length);
    }, CYCLE_MS);

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="grid gap-5 sm:grid-cols-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {BENEFIT_CARDS.map((card, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={card.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`premium-card group relative block cursor-pointer touch-manipulation rounded-2xl border bg-white p-6 text-left transition-colors ${
              isActive ? "border-navy-900" : "border-ink/10 hover:border-navy-900/30"
            }`}
          >
            <div className="grid h-11 w-11">
              <span
                className={`col-start-1 row-start-1 grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-500 transition-opacity duration-500 ${
                  isActive ? "opacity-0" : "opacity-100"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </span>
              <span
                className={`col-start-1 row-start-1 grid h-11 w-11 place-items-center rounded-full bg-navy-900 text-gold-400 transition-opacity duration-500 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
              </span>
            </div>

            <h3 className="mt-3 text-base font-bold text-ink">{card.title}</h3>

            <div className="mt-1.5 grid">
              <p
                className={`col-start-1 row-start-1 text-sm leading-relaxed text-body transition-opacity duration-500 ${
                  isActive ? "opacity-0" : "opacity-100"
                }`}
              >
                {card.problem}
              </p>
              <p
                className={`col-start-1 row-start-1 text-sm leading-relaxed text-body transition-opacity duration-500 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              >
                {card.solution}
              </p>
            </div>

            <div className="mt-4 grid">
              <span
                className={`col-start-1 row-start-1 text-xs font-semibold text-gold-600 transition-opacity duration-500 ${
                  isActive ? "opacity-0" : "opacity-100"
                }`}
              >
                Ver beneficio →
              </span>
              <span
                className={`col-start-1 row-start-1 text-xs font-semibold text-gold-600 transition-opacity duration-500 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              >
                Ver costo
              </span>
            </div>

            {isActive && (
              <ProgressBar key={activeIndex} paused={paused} duration={CYCLE_MS} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function ProgressBar({ paused, duration }: { paused: boolean; duration: number }) {
  return (
    <span className="absolute inset-x-6 bottom-2 block h-0.5 overflow-hidden rounded-full bg-ink/10">
      <span
        className="bh-progress-fill block h-full origin-left bg-gold-500"
        style={{
          animationDuration: `${duration}ms`,
          animationPlayState: paused ? "paused" : "running",
        }}
      />
    </span>
  );
}
