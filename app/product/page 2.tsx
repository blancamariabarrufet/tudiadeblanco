"use client";

import { useState } from "react";

import { Footer } from "@/components/Footer";
import { MobileNavLinks, Nav } from "@/components/Nav";
import { OrderForm } from "@/components/OrderForm";
import { ProductShowcase } from "@/components/ProductShowcase";
import { VellumOverlay } from "@/components/ui/VellumOverlay";

export default function ProductPage() {
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

      <ProductShowcase onOpenOrder={() => openOrder()} />

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
