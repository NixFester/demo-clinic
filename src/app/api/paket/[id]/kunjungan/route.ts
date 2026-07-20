import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin" && session.user.role !== "karyawan") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    console.log("[API /paket/[id]/kunjungan] POST pasien datang for paket pendaftaran:", id);
    const result = await callBridge("paket_layanan.pasien_datang", { id_pendaftaran: parseInt(id) });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /paket/[id]/kunjungan] POST error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
