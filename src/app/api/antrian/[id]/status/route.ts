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

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) return NextResponse.json({ error: "Status wajib diisi" }, { status: 422 });

    const validStatuses = ["menunggu", "dipanggil", "selesai", "batal"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 422 });
    }

    // Role-based status update rules
    const role = session.user.role;
    if (role === "karyawan" && status === "selesai") {
      return NextResponse.json({ error: "Karyawan tidak dapat mengubah ke selesai" }, { status: 403 });
    }

    const result = await callBridge("pendaftaran.updateStatus", { id: parseInt(id), status });
    console.log(`[API /antrian/${id}/status] Updated to ${status} by ${role}`);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /antrian/[id]/status] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
