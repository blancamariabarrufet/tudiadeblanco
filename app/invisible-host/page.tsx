import type { Metadata } from "next";

import { InvisibleHostPage } from "@/components/InvisibleHostPage";

export const metadata: Metadata = {
  title: "The Invisible Host | Tu dia de blanco",
  description: "Try a wedding chatbot generated from your event details.",
};

export default function InvisibleHostRoute() {
  return <InvisibleHostPage />;
}
