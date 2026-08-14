"use client";

import Auth from "@/components/pages/Auth";
import { useAppNavigate } from "@/lib/use-navigate";

export default function SignInPage() {
  const navigate = useAppNavigate();
  return <Auth mode="signin" onNavigate={navigate} />;
}
