import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? "1";
    const tanggal = searchParams.get("tanggal") ?? "";
    const status = searchParams.get("status") ?? "";
    const id_dokter = searchParams.get("id_dokter") ?? "";

    const data: Record<string, unknown> = { page: parseInt(page) };
    if (tanggal) data.tanggal = tanggal;
    if (status) data.status = status;
    if (id_dokter) data.id_dokter = parseInt(id_dokter);

    const result = await callBridge("pendaftaran.index", data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /pendaftaran] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (
      session.user.role !== "admin" &&
      session.user.role !== "superadmin" &&
      session.user.role !== "karyawan" &&
      session.user.role !== "kasir"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    // Add id_karyawan from session
    body.id_karyawan = parseInt(session.user.id);
    console.log("[API /pendaftaran] POST creating registration for pasien:", body.id_pasien);
    const result = await callBridge("pendaftaran.store", body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /pendaftaran] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
