"use client";
export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { useUser } from "@/context/UserContext";
import { Globe2, Mail, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Globe2,
    title: "Custom domain",
    body: "Choose the wedding address you want guests to receive, for example boda-maria-y-pablo.com.",
  },
  {
    icon: ShieldCheck,
    title: "DNS setup",
    body: "We prepare the records and connect the domain to the wedding website once the domain is ready.",
  },
  {
    icon: Mail,
    title: "Wedding email",
    body: "Plan a polished inbox such as hola@yourwedding.com for guest questions and supplier communication.",
  },
];

export default function DomainPage() {
  const user = useUser();

  if (!user.isAdmin && !user.features.includes("domain")) {
    return (
      <div>
        <ModuleHeader
          title="Custom Domain & Email"
          subtitle="This service is not enabled for your account yet."
        />
      </div>
    );
  }

  return (
    <div>
      <ModuleHeader
        title="Custom Domain & Email"
        subtitle="A clean place to plan the public address and wedding inbox for this website."
      />

      <section
        className="grid gap-5 rounded-2xl p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]"
        style={{
          background: "var(--surface-container-lowest)",
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        <div>
          <p
            className="text-xs uppercase tracking-[0.12em]"
            style={{ fontFamily: "var(--font-work-sans)", color: "var(--primary)" }}
          >
            Setup plan
          </p>
          <h2
            className="mt-4 text-3xl leading-tight"
            style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}
          >
            A memorable address, handled calmly.
          </h2>
          <p
            className="mt-4 text-sm leading-7"
            style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
          >
            This section keeps the domain and email setup visible while the technical records are prepared. Add the preferred domain and email ideas here during planning.
          </p>
        </div>

        <div className="grid gap-3">
          {steps.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-xl p-4"
              style={{ background: "var(--surface-container-low)" }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "var(--surface-container-lowest)", color: "var(--primary)" }}
              >
                <Icon size={17} strokeWidth={1.3} />
              </div>
              <div>
                <h3
                  className="text-sm font-medium"
                  style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}
                >
                  {title}
                </h3>
                <p
                  className="mt-1 text-xs leading-5"
                  style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
                >
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
