"use client";

import { signIn, signOut } from "next-auth/react";

import { Button } from "@/components/button";

export function SignInButton({ disabled = false }: { disabled?: boolean }) {
  return <Button disabled={disabled} onClick={() => signIn("github")}>{disabled ? "Setup required" : "Connect GitHub"}</Button>;
}

export function SignOutButton() {
  return <Button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>;
}
