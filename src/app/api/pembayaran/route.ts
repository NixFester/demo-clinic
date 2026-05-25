import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin" && session.user.role !== "karyawan") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    body.id_karyawan = parseInt(session.user.id);
    console.log(`[API /pembayaran] Processing payment for invoice: ${body.id_invoice}`);

    const result = await callBridge("pembayaran.store", body);

    // Check if invoice is now lunas, trigger stock deduction
    if (result.success || result.id) {
      const invoice = await callBridge<Record<string, unknown>>("invoice.show", { id: body.id_invoice });
      if (invoice.status === "lunas" && invoice.detail_invoice) {
        const produkItems = (invoice.detail_invoice as Array<Record<string, unknown>>)
          .filter((d: Record<string, unknown>) => d.jenis === "produk" && d.id_referensi)
          .map((d: Record<string, unknown>) => ({
            id_produk: d.id_referensi,
            qty: d.qty,
          }));

        if (produkItems.length > 0) {
          console.log(`[API /pembayaran] Deducting stock for ${produkItems.length} product items`);
          await callBridge("produk.deductStok", { items: produkItems });
        }
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /pembayaran] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
