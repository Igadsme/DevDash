"use client";

import Pricing from "@/components/pages/Pricing";
import { useAppNavigate } from "@/lib/use-navigate";

export default function PricingPage() {
  const navigate = useAppNavigate();
  return <Pricing onNavigate={navigate} />;
}
