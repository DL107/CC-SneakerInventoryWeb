import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildInventoryWorkbook } from "@/lib/excel-export";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const idsParam = request.nextUrl.searchParams.get("ids");
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  const workbook = await buildInventoryWorkbook(session.userId, ids);
  const buffer = await workbook.xlsx.writeBuffer();

  const today = new Date().toISOString().slice(0, 10);
  const filename = `Sneaker_Shelf_Inventory_${today}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
