import { describe, it, expect } from "vitest";
import { sneakerFormSchema } from "@/lib/validation/sneaker";

const baseInput = {
  brand: "Nike",
  sneakerName: "Dunk Low",
  size: 10,
  sizeSystem: "US",
  sizeCategory: "MEN",
  inventoryNumber: "SNK-000001",
  quantity: 1,
  condition: "DEADSTOCK",
  status: "IN_COLLECTION",
};

describe("sneakerFormSchema", () => {
  it("accepts a minimal valid submission", () => {
    const result = sneakerFormSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
  });

  it("rejects a missing brand", () => {
    const result = sneakerFormSchema.safeParse({ ...baseInput, brand: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive size", () => {
    const result = sneakerFormSchema.safeParse({ ...baseInput, size: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects quantity below 1", () => {
    const result = sneakerFormSchema.safeParse({ ...baseInput, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative purchase price", () => {
    const result = sneakerFormSchema.safeParse({ ...baseInput, purchasePrice: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects a condition score outside 1-10", () => {
    const result = sneakerFormSchema.safeParse({ ...baseInput, conditionScore: 11 });
    expect(result.success).toBe(false);
  });

  it("requires sale date and sale price when status is SOLD", () => {
    const result = sneakerFormSchema.safeParse({ ...baseInput, status: "SOLD" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("saleDate");
      expect(paths).toContain("salePrice");
    }
  });

  it("accepts SOLD status when sale date and price are provided", () => {
    const result = sneakerFormSchema.safeParse({
      ...baseInput,
      status: "SOLD",
      saleDate: "2024-01-01",
      salePrice: 100,
      purchaseDate: "2023-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a sale date earlier than the purchase date", () => {
    const result = sneakerFormSchema.safeParse({
      ...baseInput,
      status: "SOLD",
      purchaseDate: "2024-06-01",
      saleDate: "2024-01-01",
      salePrice: 100,
    });
    expect(result.success).toBe(false);
  });
});
