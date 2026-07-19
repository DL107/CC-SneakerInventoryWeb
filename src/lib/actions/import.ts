"use server";

import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { generateInventoryNumber } from "@/lib/inventory-number";
import { findPossibleDuplicate } from "@/lib/duplicate-detection";
import { SIZE_SYSTEMS, SIZE_CATEGORIES, CONDITIONS, OWNERSHIP_STATUSES } from "@/lib/constants";

export type ImportRowError = { row: number; message: string };

export type ImportActionState = {
  error?: string;
  summary?: {
    totalRows: number;
    created: number;
    skippedDuplicates: number;
    failed: number;
  };
  errors?: ImportRowError[];
} | null;

const HEADER_MAP: Record<string, string> = {
  "Brand": "brand",
  "Sneaker Name": "sneakerName",
  "Model": "model",
  "Nickname": "nickname",
  "Colorway": "colorway",
  "Style Code": "styleCode",
  "UPC": "upc",
  "Category": "category",
  "Collaboration": "collaboration",
  "Size": "size",
  "Size System": "sizeSystem",
  "Size Category": "sizeCategory",
  "Width": "width",
  "Quantity": "quantity",
  "Condition": "condition",
  "Condition Score": "conditionScore",
  "Status": "status",
  "Storage Location": "storageLocation",
  "Purchase Price": "purchasePrice",
  "Notes": "notes",
  "Tags": "tags",
};

function findValue(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return value === undefined || value === null ? "" : String(value).trim();
}

/**
 * A minimal, working import path: parses an uploaded .xlsx built with the
 * same "Inventory" column headers this app exports, validates required
 * fields per row, skips likely duplicates, and creates the rest. The fuller
 * column-mapping/preview wizard described in the product spec is a
 * documented future enhancement — this keeps import functional today
 * without delaying the (higher-priority) export feature.
 */
export async function importInventoryAction(_prev: ImportActionState, formData: FormData): Promise<ImportActionState> {
  const session = await requireSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a .xlsx file to import." };
  }

  const workbook = new ExcelJS.Workbook();
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    return { error: "That file couldn't be read. Please upload a valid .xlsx workbook." };
  }

  const sheet = workbook.getWorksheet("Inventory") ?? workbook.worksheets[0];
  if (!sheet) {
    return { error: "No worksheet found in this workbook." };
  }

  // Find the header row (the row containing "Brand" and "Sneaker Name").
  let headerRowNumber = -1;
  let headerCells: string[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (headerRowNumber !== -1) return;
    const values = (row.values as unknown[]).map((v) => (v ? String(v).trim() : ""));
    if (values.includes("Brand") && values.includes("Sneaker Name")) {
      headerRowNumber = rowNumber;
      headerCells = values;
    }
  });

  if (headerRowNumber === -1) {
    return { error: 'Could not find a header row with "Brand" and "Sneaker Name" columns.' };
  }

  const errors: ImportRowError[] = [];
  let created = 0;
  let skippedDuplicates = 0;
  let totalRows = 0;

  const savedLocations = new Set<string>();

  for (let rowNumber = headerRowNumber + 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const excelRow = sheet.getRow(rowNumber);
    if (!excelRow.hasValues) continue;

    const record: Record<string, unknown> = {};
    headerCells.forEach((header, idx) => {
      if (!header) return;
      const mappedKey = HEADER_MAP[header];
      if (mappedKey) record[mappedKey] = excelRow.getCell(idx).value;
    });

    if (Object.values(record).every((v) => v === undefined || v === null || v === "")) continue;
    totalRows++;

    const brand = findValue(record, "brand");
    const sneakerName = findValue(record, "sneakerName");
    const sizeRaw = findValue(record, "size");
    const sizeSystem = findValue(record, "sizeSystem").toUpperCase();
    const sizeCategory = findValue(record, "sizeCategory").toUpperCase().replace(/\s+/g, "_");
    const condition = findValue(record, "condition").toUpperCase().replace(/\s+/g, "_");
    const status = findValue(record, "status").toUpperCase().replace(/\s+/g, "_");
    const styleCode = findValue(record, "styleCode") || undefined;

    const rowErrors: string[] = [];
    if (!brand) rowErrors.push("Brand is required");
    if (!sneakerName) rowErrors.push("Sneaker Name is required");
    const size = Number(sizeRaw);
    if (!sizeRaw || Number.isNaN(size) || size <= 0) rowErrors.push("Size must be a positive number");
    if (!SIZE_SYSTEMS.includes(sizeSystem as (typeof SIZE_SYSTEMS)[number])) rowErrors.push(`Size System must be one of ${SIZE_SYSTEMS.join(", ")}`);
    if (!SIZE_CATEGORIES.some((c) => c.value === sizeCategory)) rowErrors.push("Size Category is invalid");
    if (!CONDITIONS.some((c) => c.value === condition)) rowErrors.push("Condition is invalid");
    const finalStatus = OWNERSHIP_STATUSES.some((s) => s.value === status) ? status : "IN_COLLECTION";

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join("; ") });
      continue;
    }

    const duplicate = await findPossibleDuplicate({
      userId: session.userId,
      styleCode,
      size,
      sizeSystem,
      sizeCategory,
    });
    if (duplicate) {
      skippedDuplicates++;
      continue;
    }

    const storageLocation = findValue(record, "storageLocation") || undefined;
    if (storageLocation) savedLocations.add(storageLocation);

    const inventoryNumber = await generateInventoryNumber(session.userId);
    const quantityRaw = Number(findValue(record, "quantity"));
    const purchasePriceRaw = findValue(record, "purchasePrice");
    const conditionScoreRaw = findValue(record, "conditionScore");

    try {
      await prisma.$transaction(async (tx) => {
        const product = await tx.sneakerProduct.create({
          data: {
            userId: session.userId,
            brand,
            name: sneakerName,
            model: findValue(record, "model") || null,
            nickname: findValue(record, "nickname") || null,
            colorway: findValue(record, "colorway") || null,
            styleCode: styleCode ?? null,
            upc: findValue(record, "upc") || null,
            category: findValue(record, "category") || null,
            collaboration: findValue(record, "collaboration") || null,
          },
        });

        await tx.inventoryItem.create({
          data: {
            userId: session.userId,
            sneakerProductId: product.id,
            inventoryNumber,
            size,
            sizeSystem,
            sizeCategory,
            width: findValue(record, "width") || null,
            quantity: Number.isFinite(quantityRaw) && quantityRaw >= 1 ? Math.floor(quantityRaw) : 1,
            condition,
            conditionScore: conditionScoreRaw ? Number(conditionScoreRaw) : null,
            status: finalStatus,
            storageLocation: storageLocation ?? null,
            notes: findValue(record, "notes") || null,
            purchaseRecord: {
              create: {
                purchasePrice: purchasePriceRaw ? Number(purchasePriceRaw) : null,
              },
            },
          },
        });
      });
      created++;
    } catch (err) {
      errors.push({ row: rowNumber, message: err instanceof Error ? err.message : "Failed to import this row." });
    }
  }

  for (const name of savedLocations) {
    await prisma.storageLocation
      .upsert({ where: { userId_name: { userId: session.userId, name } }, update: {}, create: { userId: session.userId, name } })
      .catch(() => {});
  }

  return {
    summary: { totalRows, created, skippedDuplicates, failed: errors.length },
    errors,
  };
}
