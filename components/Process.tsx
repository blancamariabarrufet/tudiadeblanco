"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";

export function Process() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !pathRef.current || !dotRef.current) return;

      const { top, height } = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const scrollableDistance = height - windowHeight;
      let progress = -top / scrollableDistance;

      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      const pathLength = pathRef.current.getTotalLength();
      const point = pathRef.current.getPointAtLength(progress * pathLength);

      // Update dot position using transform for performance rather than setting attributes directly
      // Or set cx cy. Transform is fine, but since cx and cy were already 0, we can just use cx/cy.
      dotRef.current.setAttribute("cx", point.x.toString());
      dotRef.current.setAttribute("cy", point.y.toString());

      // Determine active step based on progress
      let currentStep = 0;
      if (progress > 0.8) currentStep = 4;
      else if (progress > 0.6) currentStep = 3;
      else if (progress > 0.4) currentStep = 2;
      else if (progress > 0.2) currentStep = 1;

      setActiveStep(currentStep);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    setTimeout(handleScroll, 100);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, isTablet]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const tabletQuery = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");
    const handleMediaChange = () => {
      setIsMobile(mobileQuery.matches);
      setIsTablet(tabletQuery.matches);
    };

    handleMediaChange();
    mobileQuery.addEventListener("change", handleMediaChange);
    tabletQuery.addEventListener("change", handleMediaChange);

    return () => {
      mobileQuery.removeEventListener("change", handleMediaChange);
      tabletQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const steps = [
    { num: 1, desktopX: 100, desktopY: 10, mobileX: 110, mobileY: 40, titleKey: "process.step1.title", fallbackTitle: "Brief & vision", bodyKey: "process.step1.body", fallbackBody: "Style, must-haves & event details" },
    { num: 2, desktopX: 300, desktopY: 90, mobileX: 110, mobileY: 160, titleKey: "process.step2.title", fallbackTitle: "Design & content", bodyKey: "process.step2.body", fallbackBody: "Palette, fonts, photos & copy" },
    { num: 3, desktopX: 500, desktopY: 10, mobileX: 110, mobileY: 280, titleKey: "process.step3.title", fallbackTitle: "First draft", bodyKey: "process.step3.body", fallbackBody: "Homepage & key sections for review" },
    { num: 4, desktopX: 700, desktopY: 90, mobileX: 110, mobileY: 400, titleKey: "process.step4.title", fallbackTitle: "Revisions & RSVP", bodyKey: "process.step4.body", fallbackBody: "Feedback, polish & guest form setup" },
    { num: 5, desktopX: 900, desktopY: 10, mobileX: 110, mobileY: 520, titleKey: "process.step5.title", fallbackTitle: "Launch", bodyKey: "process.step5.body", fallbackBody: "Go live, share & ongoing updates" },
  ];

  const viewBox = isMobile ? "0 0 220 560" : "0 0 1000 100";
  const pathD = isMobile
    ? "M 110 40 Q 158 100 110 160 T 110 280 T 110 400 T 110 520"
    : "M 0 50 Q 100 10 200 50 T 400 50 T 600 50 T 800 50 T 1000 50";
  const stepDotRadius = isMobile ? 4 : 6;
  const travelerDotRadius = isMobile ? 6 : 10;
  const travelerStrokeWidth = isMobile ? 2.5 : 4;
  const pathStrokeWidth = isMobile ? 2 : 3;

  return (
    <section id="process" ref={sectionRef} className="relative h-[230vh] bg-[color:var(--surface)] sm:h-[200vh]">
      <div className="sticky top-0 flex h-screen w-full flex-col justify-center overflow-hidden px-0 pb-8 pt-16 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-16">

        <div className="mx-auto mb-8 w-full max-w-7xl px-8 text-center sm:mb-14 sm:px-12 lg:mb-20 lg:px-20">
          <h2 className="font-[family-name:var(--font-newsreader)] text-[clamp(1.8rem,3.6vw,2.5rem)] tracking-[-0.01em] text-[color:var(--on-surface)]">
            {t("process.heading") === "process.heading" ? "The Process" : t("process.heading")}
          </h2>
        </div>

        <div className="relative mx-auto mt-0 w-full max-w-md px-6 sm:mt-6 sm:max-w-3xl sm:px-8 lg:mt-10 lg:max-w-5xl lg:px-4">
          {/* SVG Wave Container */}
          <div className="relative h-[calc(100vh-13rem)] max-h-[560px] w-full sm:mb-6 sm:h-[80px] sm:max-h-none sm:w-full lg:mb-8 lg:h-[100px]">
            <svg
              viewBox={viewBox}
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              {/* Background faded path */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(204, 198, 188, 0.4)"
                strokeWidth={pathStrokeWidth}
                strokeDasharray="8 8"
              />

              {/* Invisible path for logic bounds calculation (getTotalLength) */}
              <path
                ref={pathRef}
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth="0"
              />

              {/* Dots on the path for each step */}
              {steps.map((step, idx) => (
                <circle
                  key={`bg-dot-${idx}`}
                  cx={isMobile ? step.mobileX : step.desktopX}
                  cy={isMobile ? step.mobileY : step.desktopY}
                  r={stepDotRadius}
                  fill={activeStep >= idx ? "var(--primary)" : "rgba(204, 198, 188, 0.3)"}
                  className="transition-colors duration-500"
                />
              ))}

              {/* The animating traveler dot */}
              <circle
                ref={dotRef}
                cx="0"
                cy="50"
                r={travelerDotRadius}
                fill="var(--surface-container-lowest)"
                stroke="var(--primary)"
                strokeWidth={travelerStrokeWidth}
                className={isMobile ? "transition-transform drop-shadow-[0px_2px_5px_rgba(26,28,26,0.12)]" : "transition-transform drop-shadow-[0px_4px_8px_rgba(26,28,26,0.15)]"}
              />
            </svg>
          </div>

          {/* Text Labels */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="relative h-full w-full">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                const isPast = activeStep > idx;
                const isMobileLabelLeft = idx % 2 === 1;
                const topVal = isMobile
                  ? `${(step.mobileY / 560) * 100}%`
                  : step.desktopY === 10
                    ? isTablet ? "-82px" : "-110px"
                    : isTablet ? "138px" : "185px";
                const labelStyle = isMobile
                  ? isMobileLabelLeft
                    ? { right: "calc(50% + 2.75rem)", top: topVal }
                    : { left: "calc(50% + 2.75rem)", top: topVal }
                  : { left: `${(step.desktopX / 1000) * 100}%`, top: topVal };
                const mobileAlignment = isMobileLabelLeft
                  ? "items-end text-right"
                  : "items-start text-left";

                return (
                  <div
                    key={`label-${idx}`}
                    className={`absolute flex w-[calc(50%-3.25rem)] max-w-[9.5rem] -translate-y-1/2 flex-col transition-all duration-700 pointer-events-auto sm:w-28 sm:max-w-none sm:-translate-x-1/2 sm:translate-y-0 sm:items-center sm:text-center md:w-36 lg:w-48 ${mobileAlignment} ${isActive
                        ? "opacity-100 scale-105"
                        : isPast
                          ? "opacity-50 scale-100"
                          : "opacity-30 scale-95"
                      }`}
                    style={labelStyle}
                  >
                    <h3 className="font-[family-name:var(--font-sans)] text-[0.95rem] sm:text-[0.95rem] md:text-[1rem] lg:text-[1.2rem] font-medium text-[color:var(--on-surface)] leading-tight mb-1">
                      {t(step.titleKey) === step.titleKey ? step.fallbackTitle : t(step.titleKey)}
                    </h3>
                    <p className="font-[family-name:var(--font-sans)] text-[0.68rem] sm:text-[0.75rem] md:text-[0.8rem] lg:text-[0.85rem] text-[color:var(--on-surface)] opacity-70 leading-snug">
                      {t(step.bodyKey) === step.bodyKey ? step.fallbackBody : t(step.bodyKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
