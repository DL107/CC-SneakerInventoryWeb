import { z } from "zod";
import {
  SIZE_SYSTEMS,
  SIZE_CATEGORIES,
  CONDITIONS,
  OWNERSHIP_STATUSES,
  AUTHENTICATION_STATUSES,
  SALE_VISIBLE_STATUSES,
} from "@/lib/constants";

const sizeSystemValues = SIZE_SYSTEMS as readonly string[];
const sizeCategoryValues = SIZE_CATEGORIES.map((c) => c.value);
const conditionValues = CONDITIONS.map((c) => c.value);
const statusValues = OWNERSHIP_STATUSES.map((s) => s.value);
const authStatusValues = AUTHENTICATION_STATUSES.map((s) => s.value);

/** Converts "" / null / undefined into undefined, otherwise passes value through. */
const blankToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

const optionalString = z.preprocess(blankToUndefined, z.string().trim().max(2000).optional());

const optionalNonNegativeNumber = z.preprocess(
  blankToUndefined,
  z.coerce.number({ message: "Must be a number" }).nonnegative("Cannot be negative").optional()
);

const optionalDate = z.preprocess(
  blankToUndefined,
  z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Enter a valid date")
    .optional()
);

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const sneakerFormSchema = z
  .object({
    // Basic information
    brand: z.string().trim().min(1, "Brand is required"),
    sneakerName: z.string().trim().min(1, "Sneaker name is required"),
    model: optionalString,
    nickname: optionalString,
    colorway: optionalString,
    styleCode: optionalString,
    upc: optionalString,
    category: optionalString,
    collaboration: optionalString,
    releaseDate: optionalDate,
    originalRetailPrice: optionalNonNegativeNumber,

    // Size information
    size: z.coerce
      .number({ message: "Size is required" })
      .positive("Size must be greater than 0"),
    sizeSystem: z.enum(sizeSystemValues as [string, ...string[]], {
      message: "Size system is required",
    }),
    sizeCategory: z.enum(sizeCategoryValues as [string, ...string[]], {
      message: "Size category is required",
    }),
    width: optionalString,

    // Inventory information
    inventoryNumber: z.string().trim().min(1, "Inventory number is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
    condition: z.enum(conditionValues as [string, ...string[]], {
      message: "Condition is required",
    }),
    conditionScore: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().min(1).max(10, "Condition score must be between 1 and 10").optional()
    ),
    status: z.enum(statusValues as [string, ...string[]], {
      message: "Ownership status is required",
    }),
    originalBoxIncluded: checkbox,
    boxCondition: optionalString,
    extraLacesIncluded: checkbox,
    accessoriesIncluded: checkbox,
    accessoriesNotes: optionalString,
    receiptIncluded: checkbox,
    authenticationStatus: z.enum(authStatusValues as [string, ...string[]]).default("NOT_AUTHENTICATED"),
    authenticationProvider: optionalString,
    storageLocation: optionalString,
    dateAdded: optionalDate,
    notes: optionalString,
    tags: optionalString, // comma-separated

    // Purchase information
    purchaseDate: optionalDate,
    purchasedFrom: optionalString,
    orderNumber: optionalString,
    purchasePrice: optionalNonNegativeNumber,
    salesTax: optionalNonNegativeNumber,
    shippingCost: optionalNonNegativeNumber,
    additionalFees: optionalNonNegativeNumber,

    // Value information
    estimatedCurrentValue: optionalNonNegativeNumber,
    userDefinedValue: optionalNonNegativeNumber,
    minAcceptableSalePrice: optionalNonNegativeNumber,
    valuationDate: optionalDate,
    valuationNotes: optionalString,

    // Sale information (conditionally required)
    marketplace: optionalString,
    listingDate: optionalDate,
    listingUrl: optionalString,
    askingPrice: optionalNonNegativeNumber,
    saleDate: optionalDate,
    salePrice: optionalNonNegativeNumber,
    marketplaceFees: optionalNonNegativeNumber,
    sellerPaidShipping: optionalNonNegativeNumber,
    otherSellingExpenses: optionalNonNegativeNumber,
    buyerNotes: optionalString,
    paymentReceived: checkbox,
    trackingNumber: optionalString,
  })
  .superRefine((data, ctx) => {
    if (data.status === "SOLD") {
      if (!data.saleDate) {
        ctx.addIssue({
          code: "custom",
          path: ["saleDate"],
          message: "Sale date is required when status is Sold",
        });
      }
      if (data.salePrice === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["salePrice"],
          message: "Sale price is required when status is Sold",
        });
      }
    }
    if (data.saleDate && data.purchaseDate) {
      if (new Date(data.saleDate).getTime() < new Date(data.purchaseDate).getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["saleDate"],
          message: "Sale date cannot be earlier than the purchase date",
        });
      }
    }
    if (data.brand.trim().length === 0) {
      ctx.addIssue({ code: "custom", path: ["brand"], message: "Brand is required" });
    }
  });

export type SneakerFormInput = z.infer<typeof sneakerFormSchema>;

export function isSaleSectionVisible(status: string) {
  return (SALE_VISIBLE_STATUSES as string[]).includes(status);
}
