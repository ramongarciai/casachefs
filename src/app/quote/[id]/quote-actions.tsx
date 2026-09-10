"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { approveQuote, requestQuoteChanges, declineQuote } from "./actions";

type Panel = "approve" | "changes" | "decline" | null;

export function QuoteActions({ quoteId }: { quoteId: string }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [signatureName, setSignatureName] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  function submitApprove() {
    if (!signatureName.trim()) {
      toast.error("Type your full name to sign.");
      return;
    }
    startTransition(async () => {
      try {
        await approveQuote(quoteId, signatureName);
        setDone("approved");
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  function submitChanges() {
    if (!note.trim()) {
      toast.error("Let us know what you'd like changed.");
      return;
    }
    startTransition(async () => {
      try {
        await requestQuoteChanges(quoteId, note);
        setDone("changes_requested");
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  function submitDecline() {
    startTransition(async () => {
      try {
        await declineQuote(quoteId, note);
        setDone("declined");
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  if (done === "approved") {
    return <p className="text-sm font-medium text-primary">Thanks — your quote is approved. We&apos;ll be in touch to finalize details.</p>;
  }
  if (done === "changes_requested") {
    return <p className="text-sm font-medium">We received your requested changes and will follow up shortly.</p>;
  }
  if (done === "declined") {
    return <p className="text-sm font-medium text-muted-foreground">This quote has been declined.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Separator />
      {panel === null && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setPanel("approve")}>
            Approve
          </Button>
          <Button type="button" variant="outline" onClick={() => setPanel("changes")}>
            Request changes
          </Button>
          <Button type="button" variant="outline" onClick={() => setPanel("decline")}>
            Decline
          </Button>
        </div>
      )}

      {panel === "approve" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="signature">Type your full name to sign and approve</Label>
          <Input id="signature" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setPanel(null)} disabled={isPending}>
              Back
            </Button>
            <Button type="button" onClick={submitApprove} disabled={isPending}>
              {isPending ? "Submitting…" : "Confirm approval"}
            </Button>
          </div>
        </div>
      )}

      {panel === "changes" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="changes-note">What would you like changed?</Label>
          <Textarea id="changes-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setPanel(null)} disabled={isPending}>
              Back
            </Button>
            <Button type="button" onClick={submitChanges} disabled={isPending}>
              {isPending ? "Submitting…" : "Send request"}
            </Button>
          </div>
        </div>
      )}

      {panel === "decline" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="decline-note">Let us know why (optional)</Label>
          <Textarea id="decline-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setPanel(null)} disabled={isPending}>
              Back
            </Button>
            <Button type="button" variant="destructive" onClick={submitDecline} disabled={isPending}>
              {isPending ? "Submitting…" : "Confirm decline"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
