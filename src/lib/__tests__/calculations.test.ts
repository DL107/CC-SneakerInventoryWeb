import { describe, it, expect } from "vitest";
import { totalAcquisitionCost, netProceeds, profitOrLoss, currentValueOf } from "@/lib/calculations";

describe("totalAcquisitionCost", () => {
  it("sums purchase price, tax, shipping, and fees", () => {
    expect(
      totalAcquisitionCost({ purchasePrice: 100, salesTax: 8, shippingCost: 5, additionalFees: 2 })
    ).toBe(115);
  });

  it("treats missing fields as zero", () => {
    expect(totalAcquisitionCost({ purchasePrice: 100 })).toBe(100);
  });

  it("returns 0 for null purchase record", () => {
    expect(totalAcquisitionCost(null)).toBe(0);
  });
});

describe("netProceeds", () => {
  it("subtracts fees, shipping, and other expenses from sale price", () => {
    expect(
      netProceeds({ salePrice: 200, marketplaceFees: 20, sellerPaidShipping: 10, otherSellingExpenses: 5 })
    ).toBe(165);
  });

  it("returns 0 for null sale record", () => {
    expect(netProceeds(null)).toBe(0);
  });
});

describe("profitOrLoss", () => {
  it("computes profit when net proceeds exceed acquisition cost", () => {
    const purchase = { purchasePrice: 100, salesTax: 8, shippingCost: 5, additionalFees: 0 };
    const sale = { salePrice: 200, marketplaceFees: 20, sellerPaidShipping: 0, otherSellingExpenses: 0 };
    // acquisition = 113, net proceeds = 180 -> profit of 67
    expect(profitOrLoss(purchase, sale)).toBe(67);
  });

  it("computes a loss when net proceeds are below acquisition cost", () => {
    const purchase = { purchasePrice: 300 };
    const sale = { salePrice: 100 };
    expect(profitOrLoss(purchase, sale)).toBe(-200);
  });
});

describe("currentValueOf", () => {
  it("prefers the user-defined value over the estimated value", () => {
    expect(currentValueOf({ estimatedCurrentValue: 100, userDefinedValue: 150 })).toBe(150);
  });

  it("falls back to estimated value when no user-defined value is set", () => {
    expect(currentValueOf({ estimatedCurrentValue: 100, userDefinedValue: null })).toBe(100);
  });

  it("returns 0 when neither value is set", () => {
    expect(currentValueOf({})).toBe(0);
  });
});
