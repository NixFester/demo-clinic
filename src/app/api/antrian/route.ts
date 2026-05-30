import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id_dokter = searchParams.get("id_dokter");

    const data: Record<string, unknown> = {};
    if (session.user.role === "dokter") {
      // Dokter can only see own queue — we need to map user id to dokter id
      // For simplicity, pass the user id and let bridge handle it
      data.filter_by_user = session.user.id;
    }

    const result = await callBridge("antrian.hari_ini", data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /antrian] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
