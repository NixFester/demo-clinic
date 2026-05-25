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
    console.log(`[API /followup/${id}/terkirim] Marking as sent`);
    const result = await callBridge("followup.tandaiTerkirim", { id: parseInt(id) });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /followup/[id]/terkirim] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
