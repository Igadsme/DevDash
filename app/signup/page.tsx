"use client";

import Auth from "@/components/pages/Auth";
import { useAppNavigate } from "@/lib/use-navigate";

export default function SignUpPage() {
  const navigate = useAppNavigate();
  return <Auth mode="signup" onNavigate={navigate} />;
}
