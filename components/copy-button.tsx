"use client";

import { useState } from "react";

import { Button } from "@/components/button";

export function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  return (
    <Button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setStatus("copied");
        } catch {
          setStatus("error");
        }
        window.setTimeout(() => setStatus("idle"), 1800);
      }}
    >
      {status === "copied" ? "Copied" : status === "error" ? "Copy failed" : "Copy summary"}
    </Button>
  );
}
