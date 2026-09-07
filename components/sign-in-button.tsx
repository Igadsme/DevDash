"use client";

import { signIn, signOut } from "next-auth/react";

import { Button } from "@/components/button";

export function SignInButton({
  disabled = false,
  callbackUrl = "/dashboard",
  label = "Continue with GitHub",
}: {
  disabled?: boolean;
  callbackUrl?: string;
  label?: string;
}) {
  return (
    <Button
      disabled={disabled}
      onClick={() => signIn("github", { callbackUrl })}
    >
      {disabled ? "Setup required" : label}
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
  );
}
