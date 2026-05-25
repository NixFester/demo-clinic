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

    const role = session.user.role;
    if (role !== "admin" && role !== "superadmin" && role !== "karyawan") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    console.log(`[API /pendaftaran/${id}/batal] PATCH cancelling registration by ${role}`);
    const result = await callBridge("pendaftaran.batal", { id: parseInt(id) });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /pendaftaran/[id]/batal] PATCH error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    const status = msg.includes("tidak dapat dibatalkan") ? 422 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
