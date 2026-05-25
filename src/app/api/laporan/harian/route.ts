import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tanggal = searchParams.get("tanggal") ?? new Date().toISOString().split("T")[0];

    console.log(`[API /laporan/harian] Getting daily report for ${tanggal}`);
    const result = await callBridge("laporan.harian", { tanggal });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /laporan/harian] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
