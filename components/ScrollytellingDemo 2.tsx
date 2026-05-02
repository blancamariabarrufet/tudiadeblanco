"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Step data (Gallery removed) ─────────────────────────────────────────── */
const steps = [
  {
    id: "home",
    route: "/",
    eyebrow: "Save the Date",
    title: "A hero that stops time.",
    description:
      "The first thing guests see is your names, your date, and a live countdown ticking toward the big day — editorial design tailored to your story.",
    detail:
      "Your AI assistant is embedded right here so guests can ask anything the moment they arrive.",
    accentColor: "#c4a882",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: "nosotros",
    route: "/nosotros",
    eyebrow: "Nuestra Historia",
    title: "Your love story, beautifully told.",
    description:
      "Guide guests through your journey — from the first meeting to the proposal — written in your voice and styled to match your wedding's aesthetic.",
    detail:
      "Each chapter is crafted with elegant typography and rich spacing that reflects the weight of those memories.",
    accentColor: "#a89070",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    id: "el-gran-dia",
    route: "/el-gran-dia",
    eyebrow: "El Gran Día",
    title: "Venues, schedule, and directions — all in one place.",
    description:
      "Guests arrive knowing exactly where to go and when. Ceremony venue, reception location, travel time — presented clearly so no one gets lost.",
    detail:
      "Clickable maps link straight to Google Maps. A clean timeline breaks down every moment of your day.",
    accentColor: "#8a7060",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "rsvp",
    route: "/rsvp",
    eyebrow: "RSVP",
    title: "Confirmations made effortless.",
    description:
      "A refined RSVP form collects everything you need — dietary restrictions, song requests, personal messages — without any of the usual back-and-forth.",
    detail:
      "Responses are gathered in real time so you always know exactly who's coming.",
    accentColor: "#6e5c4c",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    id: "alojamiento",
    route: "/alojamiento",
    eyebrow: "Alojamiento",
    title: "Handpicked hotels, shared with care.",
    description:
      "Take care of your guests by listing curated accommodation options — with your group discount code front and centre so booking is instant.",
    detail:
      "Your AI assistant can also answer accommodation questions directly in the chat.",
    accentColor: "#5e4c3c",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

/* ─── Main component ───────────────────────────────────────────────────────── */

export function ScrollytellingDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const band = window.innerHeight * 0.45;
      let closestIndex = 0;
      let closestDistance = Infinity;

      stepsRef.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(centerY - band);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestIndex = i;
        }
      });

      setActiveIndex(closestIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="scrolly-section" aria-label="Product walkthrough">
      {/* Section header */}
      <div className="scrolly-header">
        <p className="eyebrow">The full picture</p>
        <h2 className="scrolly-heading">
          Every page your guests need,{" "}
          <em>crafted to perfection.</em>
        </h2>
        <p className="scrolly-subheading">
          From the first save-the-date to post-wedding memories — WedSITE Studio handles every detail of your digital presence.
        </p>
      </div>

      {/* Two-column scrollytelling */}
      <div className="scrolly-grid">
        {/* LEFT — sticky browser panel */}
        <div className="scrolly-left">
          <div className="scrolly-panels">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={`scrolly-panel${activeIndex === i ? " is-on" : ""}`}
                aria-hidden={activeIndex !== i}
              >
                {/* Browser chrome */}
                <div className="panel-chrome">
                  <div className="panel-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <div className="panel-url-bar">
                    demo.wedsite.studio{step.route === "/" ? "" : step.route}
                  </div>
                  <a
                    href={`http://localhost:3000${step.route}`}
                    target="_blank"
                    rel="noreferrer"
                    className="panel-open-link"
                    title="Open in new tab"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>

                {/* Live iframe */}
                <div className="panel-body">
                  <div className="panel-iframe-scale">
                    <iframe
                      src={`http://localhost:3000${step.route}`}
                      title={step.title}
                      className="panel-iframe"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — scrolling steps */}
        <div className="scrolly-right">
          {steps.map((step, i) => (
            <div
              key={step.id}
              ref={(el) => { stepsRef.current[i] = el; }}
              className={`scrolly-step${activeIndex === i ? " active" : ""}`}
            >
              <div
                className="step-icon"
                style={{ "--step-color": step.accentColor } as React.CSSProperties}
              >
                {step.icon}
              </div>
              <p className="step-eyebrow">{step.eyebrow}</p>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              <p className="step-detail">{step.detail}</p>
              <div className="step-indicator">
                <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="step-of">/ {String(steps.length).padStart(2, "0")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
