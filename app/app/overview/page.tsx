"use client";
import Overview from "@/components/pages/app/Overview";
import { useAppNavigate } from "@/lib/use-navigate";

export default function Page() {
  const navigate = useAppNavigate();
  return <Overview onNavigate={navigate} />;
}
