import type { OrderType, DietRestriction } from "@/lib/validations/order-wizard";
import type { GetQuoteResult } from "./actions";

export interface WizardAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface WizardDraft {
  step: number;
  orderType?: OrderType;
  eventDate?: string;
  eventTime?: string;
  guestCount?: number;
  address: WizardAddress;
  allergens: Record<string, number>;
  diets: Partial<Record<DietRestriction, number>>;
  lowSpiceGuestCount?: number;
  otherNote?: string;
  budgetMode?: "per_person" | "total";
  budgetAmountCents?: number;
  quote?: GetQuoteResult;
  selectedPackageId?: string;
  selectedItemIds: string[];
  contact: { name: string; companyName?: string; email: string; phone: string };
}

export const EMPTY_DRAFT: WizardDraft = {
  step: 1,
  address: { line1: "", city: "", state: "TX", zip: "" },
  allergens: {},
  diets: {},
  selectedItemIds: [],
  contact: { name: "", email: "", phone: "" },
};

export const DRAFT_STORAGE_KEY = "casachefs-order-draft";
export const TOTAL_STEPS = 6;
