import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin" && session.user.role !== "karyawan") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { diskon } = body;

    if (diskon === undefined) return NextResponse.json({ error: "Diskon wajib diisi" }, { status: 422 });

    // Karyawan discount validation
    if (session.user.role === "karyawan") {
      const pengaturan = await callBridge<Record<string, unknown>>("pengaturan.get", {});
      const invoice = await callBridge<Record<string, unknown>>("invoice.show", { id: parseInt(id) });
      const batasDiskon = Number(pengaturan.batas_diskon_karyawan) || 20;
      const subtotal = Number(invoice.subtotal) || 0;
      const maxDiskon = subtotal * (batasDiskon / 100);

      if (diskon > maxDiskon) {
        return NextResponse.json(
          { error: `Diskon melebihi batas ${batasDiskon}% (maks Rp ${maxDiskon.toLocaleString("id-ID")})` },
          { status: 422 }
        );
      }
    }

    console.log(`[API /invoice/${id}/diskon] Applying discount: ${diskon}`);
    const result = await callBridge("invoice.applyDiskon", { id: parseInt(id), diskon });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /invoice/[id]/diskon] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
