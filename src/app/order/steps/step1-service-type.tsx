"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { WizardDraft } from "../types";
import type { OrderType } from "@/lib/validations/order-wizard";

const CARDS: { orderType: OrderType | "frozen_food"; titleEn: string; descriptionEn: string }[] = [
  {
    orderType: "event_catering",
    titleEn: "Event Catering",
    descriptionEn: "Corporate or residential, buffet or plated service.",
  },
  {
    orderType: "box_lunch_employee",
    titleEn: "Employee Box Lunch",
    descriptionEn: "Recurring lunch orders for your team.",
  },
  {
    orderType: "box_lunch_training",
    titleEn: "Training Box Lunch",
    descriptionEn: "For single or multi-day training sessions.",
  },
  {
    orderType: "box_lunch_breakfast",
    titleEn: "Breakfast Box Lunch",
    descriptionEn: "Breakfast boxes for your employees.",
  },
  {
    orderType: "frozen_food",
    titleEn: "Frozen Food",
    descriptionEn: "Made-to-order, sold by the pound or liter.",
  },
];

export function Step1ServiceType({
  draft,
  update,
  next,
}: {
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  next: () => void;
}) {
  const router = useRouter();

  function choose(orderType: OrderType | "frozen_food") {
    if (orderType === "frozen_food") {
      router.push("/order/frozen");
      return;
    }
    update({ orderType });
    next();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">What can we make for you?</h1>
        <p className="text-muted-foreground">Choose the kind of service you need.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Card
            key={card.orderType}
            role="button"
            tabIndex={0}
            onClick={() => choose(card.orderType)}
            onKeyDown={(e) => e.key === "Enter" && choose(card.orderType)}
            className={`cursor-pointer transition-colors hover:border-primary ${
              draft.orderType === card.orderType ? "border-primary" : ""
            }`}
          >
            <CardHeader>
              <CardTitle>{card.titleEn}</CardTitle>
              <CardDescription>{card.descriptionEn}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
