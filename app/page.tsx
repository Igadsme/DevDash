"use client";

import Landing from "@/components/pages/Landing";
import { useAppNavigate } from "@/lib/use-navigate";

export default function HomePage() {
  const navigate = useAppNavigate();
  return <Landing onNavigate={navigate} />;
}
