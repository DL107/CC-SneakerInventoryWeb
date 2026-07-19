export type PurchaseLike = {
  purchasePrice?: number | null;
  salesTax?: number | null;
  shippingCost?: number | null;
  additionalFees?: number | null;
} | null;

export type SaleLike = {
  salePrice?: number | null;
  marketplaceFees?: number | null;
  sellerPaidShipping?: number | null;
  otherSellingExpenses?: number | null;
} | null;

/** Total acquisition cost = purchase price + sales tax + shipping cost + additional fees */
export function totalAcquisitionCost(purchase: PurchaseLike): number {
  if (!purchase) return 0;
  return (
    (purchase.purchasePrice ?? 0) +
    (purchase.salesTax ?? 0) +
    (purchase.shippingCost ?? 0) +
    (purchase.additionalFees ?? 0)
  );
}

/** Net proceeds = sale price − marketplace fees − seller-paid shipping − other selling expenses */
export function netProceeds(sale: SaleLike): number {
  if (!sale) return 0;
  return (
    (sale.salePrice ?? 0) -
    (sale.marketplaceFees ?? 0) -
    (sale.sellerPaidShipping ?? 0) -
    (sale.otherSellingExpenses ?? 0)
  );
}

/** Profit or loss = net proceeds − total acquisition cost */
export function profitOrLoss(purchase: PurchaseLike, sale: SaleLike): number {
  return netProceeds(sale) - totalAcquisitionCost(purchase);
}

/** Unrealized profit/loss = estimated (or user-defined) value − total acquisition cost */
export function currentValueOf(item: {
  estimatedCurrentValue?: number | null;
  userDefinedValue?: number | null;
}): number {
  return item.userDefinedValue ?? item.estimatedCurrentValue ?? 0;
}

export function formatCurrency(value: number | null | undefined): string {
  const n = value ?? 0;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
