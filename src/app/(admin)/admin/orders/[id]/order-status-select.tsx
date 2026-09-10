"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "../actions";

const STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "quote_sent",
  "changes_requested",
  "approved",
  "scheduled",
  "completed",
  "cancelled",
] as const;

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  quote_sent: "Quote sent",
  changes_requested: "Changes requested",
  approved: "Approved",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  function onChange(value: string | null) {
    if (!value || value === status) return;
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, value as (typeof STATUSES)[number]);
        toast.success("Status updated.");
      } catch {
        toast.error("Failed to update status.");
      }
    });
  }

  return (
    <Select value={status} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-44 capitalize" disabled={isPending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
