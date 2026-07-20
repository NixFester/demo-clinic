import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await callBridge<Record<string, any>>("pasien.show", { id: parseInt(id) });

    // Also get riwayat
    const riwayat = await callBridge("pasien.riwayat", { id_pasien: parseInt(id) });
    return NextResponse.json({ ...result, riwayat: riwayat });
  } catch (error: unknown) {
    console.error("[API /pasien/[id]] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const result = await callBridge("pasien.update", { ...body, id: parseInt(id) });
    console.log(`[API /pasien/${id}] PUT updated`);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /pasien/[id]] PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
