"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PAGE_ROUTES } from "@/lib/navigation";

export function useAppNavigate() {
  const router = useRouter();
  return useCallback(
    (page: string) => {
      router.push(PAGE_ROUTES[page] || page);
    },
    [router],
  );
}
