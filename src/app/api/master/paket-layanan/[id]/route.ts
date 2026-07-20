import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await callBridge("paket_layanan.show", { id: parseInt(id) });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /master/paket-layanan/[id]] GET error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    console.log("[API /master/paket-layanan/[id]] PUT updating paket:", id);
    const result = await callBridge("paket_layanan.update", { id: parseInt(id), ...body });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /master/paket-layanan/[id]] PUT error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    console.log("[API /master/paket-layanan/[id]] DELETE paket:", id);
    const result = await callBridge("paket_layanan.delete", { id: parseInt(id) });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /master/paket-layanan/[id]] DELETE error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
