import "server-only";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { inventoryItemInclude, type InventoryItemWithRelations } from "@/lib/sneaker-queries";
import { totalAcquisitionCost, netProceeds, profitOrLoss, currentValueOf } from "@/lib/calculations";
import { INACTIVE_STATUSES, labelFor, CONDITIONS, OWNERSHIP_STATUSES, SIZE_CATEGORIES } from "@/lib/constants";

const APP_NAME = "Sneaker Shelf";
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1917" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" } };
const ALT_ROW_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F4" } };
const TITLE_FONT: Partial<ExcelJS.Font> = { bold: true, size: 14 };

type ColumnDef = {
  header: string;
  key: string;
  width: number;
  format?: "currency" | "date" | "boolean" | "number" | "text";
  get: (item: InventoryItemWithRelations) => unknown;
};

function buildColumns(): ColumnDef[] {
  return [
    { header: "Inventory Number", key: "inventoryNumber", width: 16, get: (i) => i.inventoryNumber },
    { header: "Brand", key: "brand", width: 14, get: (i) => i.sneakerProduct.brand },
    { header: "Sneaker Name", key: "sneakerName", width: 24, get: (i) => i.sneakerProduct.name },
    { header: "Model", key: "model", width: 16, get: (i) => i.sneakerProduct.model },
    { header: "Nickname", key: "nickname", width: 16, get: (i) => i.sneakerProduct.nickname },
    { header: "Colorway", key: "colorway", width: 20, get: (i) => i.sneakerProduct.colorway },
    { header: "Style Code", key: "styleCode", width: 14, get: (i) => i.sneakerProduct.styleCode },
    { header: "UPC", key: "upc", width: 14, get: (i) => i.sneakerProduct.upc },
    { header: "Category", key: "category", width: 14, get: (i) => i.sneakerProduct.category },
    { header: "Collaboration", key: "collaboration", width: 16, get: (i) => i.sneakerProduct.collaboration },
    { header: "Release Date", key: "releaseDate", width: 13, format: "date", get: (i) => i.sneakerProduct.releaseDate },
    { header: "Size", key: "size", width: 8, format: "number", get: (i) => i.size },
    { header: "Size System", key: "sizeSystem", width: 11, get: (i) => i.sizeSystem },
    { header: "Size Category", key: "sizeCategory", width: 14, get: (i) => labelFor(SIZE_CATEGORIES, i.sizeCategory) },
    { header: "Width", key: "width", width: 8, get: (i) => i.width },
    { header: "Quantity", key: "quantity", width: 9, format: "number", get: (i) => i.quantity },
    { header: "Condition", key: "condition", width: 16, get: (i) => labelFor(CONDITIONS, i.condition) },
    { header: "Condition Score", key: "conditionScore", width: 14, format: "number", get: (i) => i.conditionScore },
    { header: "Status", key: "status", width: 14, get: (i) => labelFor(OWNERSHIP_STATUSES, i.status) },
    { header: "Original Box Included", key: "originalBoxIncluded", width: 16, format: "boolean", get: (i) => i.originalBoxIncluded },
    { header: "Box Condition", key: "boxCondition", width: 14, get: (i) => i.boxCondition },
    { header: "Extra Laces Included", key: "extraLacesIncluded", width: 16, format: "boolean", get: (i) => i.extraLacesIncluded },
    { header: "Accessories Included", key: "accessoriesIncluded", width: 16, format: "boolean", get: (i) => i.accessoriesIncluded },
    { header: "Receipt Included", key: "receiptIncluded", width: 14, format: "boolean", get: (i) => i.receiptIncluded },
    { header: "Authentication Status", key: "authenticationStatus", width: 18, get: (i) => i.authenticationStatus },
    { header: "Authentication Provider", key: "authenticationProvider", width: 18, get: (i) => i.authenticationProvider },
    { header: "Storage Location", key: "storageLocation", width: 16, get: (i) => i.storageLocation },
    { header: "Purchase Date", key: "purchaseDate", width: 13, format: "date", get: (i) => i.purchaseRecord?.purchaseDate },
    { header: "Purchased From", key: "purchasedFrom", width: 16, get: (i) => i.purchaseRecord?.purchasedFrom },
    { header: "Order Number", key: "orderNumber", width: 16, get: (i) => i.purchaseRecord?.orderNumber },
    { header: "Purchase Price", key: "purchasePrice", width: 13, format: "currency", get: (i) => i.purchaseRecord?.purchasePrice },
    { header: "Sales Tax", key: "salesTax", width: 11, format: "currency", get: (i) => i.purchaseRecord?.salesTax },
    { header: "Shipping Cost", key: "shippingCost", width: 12, format: "currency", get: (i) => i.purchaseRecord?.shippingCost },
    { header: "Additional Fees", key: "additionalFees", width: 13, format: "currency", get: (i) => i.purchaseRecord?.additionalFees },
    { header: "Total Acquisition Cost", key: "totalAcquisitionCost", width: 16, format: "currency", get: (i) => totalAcquisitionCost(i.purchaseRecord) },
    { header: "Estimated Current Value", key: "estimatedCurrentValue", width: 16, format: "currency", get: (i) => i.estimatedCurrentValue },
    { header: "User-Defined Value", key: "userDefinedValue", width: 15, format: "currency", get: (i) => i.userDefinedValue },
    { header: "Minimum Sale Price", key: "minAcceptableSalePrice", width: 15, format: "currency", get: (i) => i.minAcceptableSalePrice },
    { header: "Valuation Date", key: "valuationDate", width: 13, format: "date", get: (i) => i.valuationDate },
    { header: "Marketplace", key: "marketplace", width: 14, get: (i) => i.saleRecord?.marketplace },
    { header: "Listing Date", key: "listingDate", width: 13, format: "date", get: (i) => i.saleRecord?.listingDate },
    { header: "Asking Price", key: "askingPrice", width: 12, format: "currency", get: (i) => i.saleRecord?.askingPrice },
    { header: "Sale Date", key: "saleDate", width: 13, format: "date", get: (i) => i.saleRecord?.saleDate },
    { header: "Sale Price", key: "salePrice", width: 12, format: "currency", get: (i) => i.saleRecord?.salePrice },
    { header: "Marketplace Fees", key: "marketplaceFees", width: 14, format: "currency", get: (i) => i.saleRecord?.marketplaceFees },
    { header: "Seller-Paid Shipping", key: "sellerPaidShipping", width: 16, format: "currency", get: (i) => i.saleRecord?.sellerPaidShipping },
    { header: "Other Selling Expenses", key: "otherSellingExpenses", width: 17, format: "currency", get: (i) => i.saleRecord?.otherSellingExpenses },
    { header: "Net Proceeds", key: "netProceeds", width: 13, format: "currency", get: (i) => netProceeds(i.saleRecord) },
    { header: "Profit or Loss", key: "profitOrLoss", width: 13, format: "currency", get: (i) => profitOrLoss(i.purchaseRecord, i.saleRecord) },
    { header: "Notes", key: "notes", width: 30, get: (i) => i.notes },
    { header: "Tags", key: "tags", width: 20, get: (i) => i.tags.map((t) => t.tag.name).join(", ") },
    { header: "Date Added", key: "dateAdded", width: 13, format: "date", get: (i) => i.dateAdded },
    { header: "Last Updated", key: "updatedAt", width: 13, format: "date", get: (i) => i.updatedAt },
  ];
}

function applyCellFormat(cell: ExcelJS.Cell, format?: ColumnDef["format"], value?: unknown) {
  if (format === "currency") {
    cell.numFmt = '"$"#,##0.00';
  } else if (format === "date") {
    cell.numFmt = "yyyy-mm-dd";
  } else if (format === "boolean") {
    cell.value = value ? "Yes" : "No";
  }
}

function writeInfoBlock(sheet: ExcelJS.Worksheet, title: string, scopeLabel: string, columnCount: number) {
  sheet.mergeCells(1, 1, 1, Math.min(columnCount, 6));
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${APP_NAME} — ${title}`;
  titleCell.font = TITLE_FONT;

  sheet.getCell(2, 1).value = `Generated: ${new Date().toLocaleString("en-US")}`;
  sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF78716C" } };
  sheet.getCell(3, 1).value = scopeLabel;
  sheet.getCell(3, 1).font = { italic: true, color: { argb: "FF78716C" } };
}

function writeTable(
  sheet: ExcelJS.Worksheet,
  columns: ColumnDef[],
  items: InventoryItemWithRelations[],
  headerRow: number
) {
  sheet.columns = columns.map((c) => ({ key: c.key, width: c.width }));

  const header = sheet.getRow(headerRow);
  columns.forEach((col, idx) => {
    const cell = header.getCell(idx + 1);
    cell.value = col.header;
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
  });
  header.height = 20;

  items.forEach((item, rowIdx) => {
    const row = sheet.getRow(headerRow + 1 + rowIdx);
    columns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      const raw = col.get(item);
      if (raw instanceof Date) {
        cell.value = raw;
      } else if (typeof raw === "boolean") {
        cell.value = raw ? "Yes" : "No";
      } else {
        cell.value = (raw as string | number | null | undefined) ?? "";
      }
      applyCellFormat(cell, col.format, raw);
    });
    if (rowIdx % 2 === 1) {
      row.eachCell((cell) => {
        if (!cell.fill) cell.fill = ALT_ROW_FILL;
      });
    }
  });

  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: columns.length },
  };
  sheet.views = [{ state: "frozen", ySplit: headerRow }];
}

export async function buildInventoryWorkbook(userId: string, ids?: string[]): Promise<ExcelJS.Workbook> {
  const items = await prisma.inventoryItem.findMany({
    where: { userId, ...(ids && ids.length > 0 ? { id: { in: ids } } : {}) },
    include: inventoryItemInclude(),
    orderBy: { inventoryNumber: "asc" },
  });

  const isFiltered = !!ids && ids.length > 0;
  const scopeLabel = isFiltered ? `Scope: Filtered results (${items.length} of your inventory)` : "Scope: All Inventory";

  const activeItems = items.filter((i) => !INACTIVE_STATUSES.includes(i.status as (typeof INACTIVE_STATUSES)[number]));
  const soldItems = items.filter((i) => i.status === "SOLD");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = APP_NAME;
  workbook.created = new Date();
  workbook.properties.date1904 = false;

  const columns = buildColumns();

  const inventorySheet = workbook.addWorksheet("Inventory");
  writeInfoBlock(inventorySheet, "Inventory Export", scopeLabel, columns.length);
  writeTable(inventorySheet, columns, items, 5);

  const activeSheet = workbook.addWorksheet("Active Collection");
  writeInfoBlock(activeSheet, "Active Collection", scopeLabel, columns.length);
  writeTable(activeSheet, columns, activeItems, 5);

  const soldSheet = workbook.addWorksheet("Sold Sneakers");
  writeInfoBlock(soldSheet, "Sold Sneakers", scopeLabel, columns.length);
  writeTable(soldSheet, columns, soldItems, 5);

  buildCollectionSummarySheet(workbook, items, activeItems, soldItems, scopeLabel);
  buildStorageSummarySheet(workbook, activeItems, scopeLabel);

  return workbook;
}

function buildCollectionSummarySheet(
  workbook: ExcelJS.Workbook,
  allItems: InventoryItemWithRelations[],
  activeItems: InventoryItemWithRelations[],
  soldItems: InventoryItemWithRelations[],
  scopeLabel: string
) {
  const sheet = workbook.addWorksheet("Collection Summary");
  writeInfoBlock(sheet, "Collection Summary", scopeLabel, 4);
  sheet.columns = [{ width: 32 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const totalPairs = activeItems.reduce((s, i) => s + i.quantity, 0);
  const uniqueModels = new Set(activeItems.map((i) => `${i.sneakerProduct.brand}::${i.sneakerProduct.name}`)).size;
  const totalPurchasePrice = activeItems.reduce((s, i) => s + (i.purchaseRecord?.purchasePrice ?? 0), 0);
  const totalAcquisition = activeItems.reduce((s, i) => s + totalAcquisitionCost(i.purchaseRecord), 0);
  const totalEstValue = activeItems.reduce((s, i) => s + currentValueOf(i) * i.quantity, 0);
  const unrealizedPnl = totalEstValue - totalAcquisition;
  const totalSoldRevenue = soldItems.reduce((s, i) => s + (i.saleRecord?.salePrice ?? 0), 0);
  const totalSellingFees = soldItems.reduce(
    (s, i) =>
      s +
      (i.saleRecord?.marketplaceFees ?? 0) +
      (i.saleRecord?.sellerPaidShipping ?? 0) +
      (i.saleRecord?.otherSellingExpenses ?? 0),
    0
  );
  const totalNetProceeds = soldItems.reduce((s, i) => s + netProceeds(i.saleRecord), 0);
  const totalRealizedPnl = soldItems.reduce((s, i) => s + profitOrLoss(i.purchaseRecord, i.saleRecord), 0);

  let row = 5;
  const metric = (label: string, value: number, isCurrency = true) => {
    sheet.getCell(row, 1).value = label;
    sheet.getCell(row, 1).font = { bold: true };
    const cell = sheet.getCell(row, 2);
    cell.value = value;
    if (isCurrency) cell.numFmt = '"$"#,##0.00';
    row++;
  };

  metric("Total Physical Pairs (Active)", totalPairs, false);
  metric("Total Unique Models (Active)", uniqueModels, false);
  metric("Total Purchase Price (Active)", totalPurchasePrice);
  metric("Total Acquisition Cost (Active)", totalAcquisition);
  metric("Total Estimated Current Value (Active)", totalEstValue);
  metric("Estimated Unrealized Profit / Loss", unrealizedPnl);
  metric("Total Sold Revenue", totalSoldRevenue);
  metric("Total Selling Fees", totalSellingFees);
  metric("Total Net Proceeds (Sold)", totalNetProceeds);
  metric("Total Realized Profit / Loss (Sold)", totalRealizedPnl);

  row += 1;
  row = writeCountTable(
    sheet,
    row,
    "Count by Brand",
    countBy(activeItems, (i) => i.sneakerProduct.brand)
  );
  row += 1;
  row = writeCountTable(
    sheet,
    row,
    "Count by Condition",
    countBy(activeItems, (i) => labelFor(CONDITIONS, i.condition))
  );
  row += 1;
  writeCountTable(
    sheet,
    row,
    "Count by Status",
    countBy(allItems, (i) => labelFor(OWNERSHIP_STATUSES, i.status))
  );
}

function countBy(items: InventoryItemWithRelations[], keyFn: (i: InventoryItemWithRelations) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + item.quantity);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function writeCountTable(sheet: ExcelJS.Worksheet, startRow: number, title: string, entries: [string, number][]) {
  sheet.getCell(startRow, 1).value = title;
  sheet.getCell(startRow, 1).font = { bold: true, size: 12 };
  let row = startRow + 1;
  const header = sheet.getRow(row);
  header.getCell(1).value = "Name";
  header.getCell(2).value = "Count";
  header.getCell(1).font = HEADER_FONT;
  header.getCell(2).font = HEADER_FONT;
  header.getCell(1).fill = HEADER_FILL;
  header.getCell(2).fill = HEADER_FILL;
  row++;
  for (const [name, count] of entries) {
    sheet.getCell(row, 1).value = name;
    sheet.getCell(row, 2).value = count;
    row++;
  }
  return row;
}

function buildStorageSummarySheet(workbook: ExcelJS.Workbook, activeItems: InventoryItemWithRelations[], scopeLabel: string) {
  const sheet = workbook.addWorksheet("Storage Summary");
  writeInfoBlock(sheet, "Storage Summary", scopeLabel, 4);
  sheet.columns = [
    { key: "location", width: 24 },
    { key: "pairs", width: 16 },
    { key: "cost", width: 20 },
    { key: "value", width: 20 },
  ];

  const headerRow = 5;
  const header = sheet.getRow(headerRow);
  const headers = ["Storage Location", "Number of Pairs", "Total Acquisition Cost", "Estimated Current Value"];
  headers.forEach((h, idx) => {
    const cell = header.getCell(idx + 1);
    cell.value = h;
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
  });

  const byLocation = new Map<string, { pairs: number; cost: number; value: number }>();
  for (const item of activeItems) {
    const key = item.storageLocation || "Unassigned";
    const entry = byLocation.get(key) ?? { pairs: 0, cost: 0, value: 0 };
    entry.pairs += item.quantity;
    entry.cost += totalAcquisitionCost(item.purchaseRecord);
    entry.value += currentValueOf(item) * item.quantity;
    byLocation.set(key, entry);
  }

  let row = headerRow + 1;
  for (const [location, data] of Array.from(byLocation.entries()).sort((a, b) => b[1].pairs - a[1].pairs)) {
    sheet.getCell(row, 1).value = location;
    sheet.getCell(row, 2).value = data.pairs;
    const costCell = sheet.getCell(row, 3);
    costCell.value = data.cost;
    costCell.numFmt = '"$"#,##0.00';
    const valueCell = sheet.getCell(row, 4);
    valueCell.value = data.value;
    valueCell.numFmt = '"$"#,##0.00';
    if ((row - headerRow) % 2 === 0) {
      sheet.getRow(row).eachCell((cell) => (cell.fill = ALT_ROW_FILL));
    }
    row++;
  }

  sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: 4 } };
  sheet.views = [{ state: "frozen", ySplit: headerRow }];
}
