"use client";

import { useState } from "react";

import { ClosingCTA } from "@/components/ClosingCTA";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { MobileNavLinks, Nav } from "@/components/Nav";
import { OrderForm } from "@/components/OrderForm";
import { Process } from "@/components/Process";
import { ScrollFrameStory } from "@/components/ScrollFrameStory";
import { VellumOverlay } from "@/components/ui/VellumOverlay";

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderInitialStep, setOrderInitialStep] = useState(1);
  const [orderSession, setOrderSession] = useState(0);

  function openOrder(step = 1) {
    setMobileNavOpen(false);
    setOrderInitialStep(step);
    setOrderSession((current) => current + 1);
    setOrderOpen(true);
  }

  return (
    <main className="min-h-screen bg-[color:var(--surface)]">
      <Nav
        onOpenOrder={() => openOrder()}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      <Hero onOpenOrder={() => openOrder()} />
      <Features />
      <Process />
      <ScrollFrameStory />
      <ClosingCTA onOpenOrder={() => openOrder()} />
      <Footer />

      {/* Mobile nav drawer */}
      <VellumOverlay
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        align="top"
        panelClassName="mt-16 w-full max-w-xl rounded-[calc(var(--radius-lg)+0.4rem)] bg-[color:var(--surface)] p-0"
      >
        <MobileNavLinks
          onNavigate={() => setMobileNavOpen(false)}
          onOpenOrder={() => openOrder()}
        />
      </VellumOverlay>

      {/* Multi-step order form overlay */}
      <OrderForm
        key={`${orderSession}-${orderInitialStep}`}
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        initialStep={orderInitialStep}
      />
    </main>
  );
}
