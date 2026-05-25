import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id_dokter = searchParams.get("id_dokter") ?? "";

    const data: Record<string, unknown> = {};
    if (id_dokter) data.id_dokter = parseInt(id_dokter);

    const result = await callBridge("jadwal.index", data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /master/jadwal] GET error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin" && session.user.role !== "karyawan") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    console.log("[API /master/jadwal] POST creating jadwal for dokter:", body.id_dokter);
    const result = await callBridge("jadwal.store", body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /master/jadwal] POST error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
