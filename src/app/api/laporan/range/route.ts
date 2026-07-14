import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tanggal_mulai = searchParams.get("tanggal_mulai") ?? new Date().toISOString().split("T")[0];
    const tanggal_selesai = searchParams.get("tanggal_selesai") ?? new Date().toISOString().split("T")[0];

    console.log(`[API /laporan/range] Getting range report from ${tanggal_mulai} to ${tanggal_selesai}`);
    const result = await callBridge("laporan.range", { tanggal_mulai, tanggal_selesai });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /laporan/range] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
