"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DRAFT_STORAGE_KEY } from "../order/types";
import { buildDraftFromOrder, type OrderForReorder } from "./reorder";

export function ReorderButton({ order }: { order: OrderForReorder }) {
  const router = useRouter();

  function handleReorder() {
    const draft = buildDraftFromOrder(order);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // best-effort — the wizard still works starting from scratch
    }
    router.push("/order");
  }

  return (
    <Button type="button" size="sm" onClick={handleReorder}>
      Reorder
    </Button>
  );
}
