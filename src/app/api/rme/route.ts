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
    const id_dokter = searchParams.get("id_dokter") ?? "";

    const data: Record<string, unknown> = { page: parseInt(page) };
    if (id_dokter) data.id_dokter = parseInt(id_dokter);
    // Dokter only sees own RME
    if (session.user.role === "dokter") data.filter_by_user = session.user.id;

    const result = await callBridge("rme.index", data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /rme] GET error:", error);
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
    if (session.user.role !== "dokter" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden — hanya dokter yang dapat membuat RME" }, { status: 403 });
    }

    const body = await req.json();
    console.log("[API /rme] POST creating RME for pendaftaran:", body.id_pendaftaran);
    const result = await callBridge("rme.store", body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /rme] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
