"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { EMPTY_DRAFT, DRAFT_STORAGE_KEY, TOTAL_STEPS, type WizardDraft } from "./types";
import { Step1ServiceType } from "./steps/step1-service-type";
import { Step2EventDetails } from "./steps/step2-event-details";
import { Step3Restrictions } from "./steps/step3-restrictions";
import { Step4Budget } from "./steps/step4-budget";
import { Step5Options } from "./steps/step5-options";
import { Step6Contact } from "./steps/step6-contact";
import { GapScreen } from "./gap-screen";
import { ConfirmationScreen } from "./confirmation-screen";

export interface Minimums {
  boxLunchMinGuests: number;
  boxLunchMinLeadDays: number;
  cateringMinGuests: number;
  cateringMinLeadDays: number;
  deliveryRadiusMiles: number;
}

export interface SavedAddress {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
}

export function WizardClient({
  minimums,
  savedAddresses = [],
  initialContact,
}: {
  minimums: Minimums;
  savedAddresses?: SavedAddress[];
  initialContact?: WizardDraft["contact"];
}) {
  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);

  // localStorage doesn't exist during SSR, so the draft can't be read at
  // render time without a hydration mismatch — this effect intentionally
  // syncs from that external system once, after the initial (empty) render.
  useEffect(() => {
    let restored = EMPTY_DRAFT;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) restored = { ...EMPTY_DRAFT, ...JSON.parse(saved) };
    } catch {
      // corrupt/blocked storage — start fresh
    }
    // Pre-fill contact for a signed-in customer whenever it isn't already
    // set — covers both a brand-new draft and a reorder draft (which never
    // carries contact info). Date/time/guest count/address are always
    // re-asked regardless, so this only saves retyping name/email/phone.
    if (initialContact && !restored.contact.email) {
      restored = { ...restored, contact: initialContact };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(restored);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // best-effort only
    }
  }, [draft, hydrated]);

  function update(patch: Partial<WizardDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function goToStep(step: number) {
    setDraft((prev) => ({ ...prev, step }));
  }

  function next() {
    goToStep(Math.min(draft.step + 1, TOTAL_STEPS));
  }

  function back() {
    goToStep(Math.max(draft.step - 1, 1));
  }

  function handleSubmitted(orderId: string) {
    setSubmittedOrderId(orderId);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  if (!hydrated) return null;

  if (submittedOrderId) {
    return (
      <div className="mx-auto flex max-w-3xl flex-1 items-center justify-center px-6 py-16">
        <ConfirmationScreen orderId={submittedOrderId} />
      </div>
    );
  }

  const minimumsForOrderType =
    draft.orderType === "event_catering"
      ? { minGuests: minimums.cateringMinGuests, minLeadDays: minimums.cateringMinLeadDays, deliveryRadiusMiles: minimums.deliveryRadiusMiles }
      : { minGuests: minimums.boxLunchMinGuests, minLeadDays: minimums.boxLunchMinLeadDays, deliveryRadiusMiles: minimums.deliveryRadiusMiles };

  const isGap = draft.step === 5 && draft.quote?.status === "gap";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      {!isGap && (
        <div className="flex flex-col gap-1.5">
          <Progress value={(draft.step / TOTAL_STEPS) * 100} />
          <span className="text-xs text-muted-foreground">
            Step {draft.step} of {TOTAL_STEPS}
          </span>
        </div>
      )}

      {draft.step === 1 && <Step1ServiceType draft={draft} update={update} next={next} />}
      {draft.step === 2 && (
        <Step2EventDetails
          draft={draft}
          update={update}
          next={next}
          back={back}
          minimums={minimumsForOrderType}
          savedAddresses={savedAddresses}
        />
      )}
      {draft.step === 3 && <Step3Restrictions draft={draft} update={update} next={next} back={back} />}
      {draft.step === 4 && <Step4Budget draft={draft} update={update} next={next} back={back} />}
      {draft.step === 5 && isGap && <GapScreen back={() => goToStep(4)} />}
      {draft.step === 5 && !isGap && <Step5Options draft={draft} update={update} next={next} back={back} />}
      {draft.step === 6 && <Step6Contact draft={draft} update={update} back={back} onSubmitted={handleSubmitted} />}
    </div>
  );
}
