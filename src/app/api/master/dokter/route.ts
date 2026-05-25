import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const aktif = searchParams.get("aktif") ?? "";

    const data: Record<string, unknown> = {};
    if (aktif === "true") data.aktif = true;

    const result = await callBridge("dokter.index", data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /master/dokter] GET error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    console.log("[API /master/dokter] POST creating dokter");
    const result = await callBridge("dokter.store", body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /master/dokter] POST error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
