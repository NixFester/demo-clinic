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

    // Allow all roles to view resep (dokter, karyawan, kasir, admin)
    const allowedRoles = ["dokter", "superadmin", "admin", "karyawan", "kasir"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    console.log(`[API /rme/${id}/resep] Fetching resep items`);
    const result = await callBridge("resep.getByRme", { id_rme: parseInt(id) });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /rme/[id]/resep] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "dokter" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    console.log(`[API /rme/${id}/resep] Adding resep item`);
    const result = await callBridge("resep.storeItem", { ...body, id_rme: parseInt(id) });
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /rme/[id]/resep] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
