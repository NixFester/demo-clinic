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
    const status = searchParams.get("status") ?? "";

    const data: Record<string, unknown> = { page: parseInt(page) };
    if (status) data.status = status;

    const result = await callBridge("invoice.index", data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /invoice] GET error:", error);
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
    if (
      session.user.role !== "admin" &&
      session.user.role !== "superadmin" &&
      session.user.role !== "karyawan" &&
      session.user.role !== "kasir"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate id_pendaftaran if generating for specific pendaftaran
    if (!body.generate_from_pendaftaran && !body.id_pendaftaran) {
      return NextResponse.json(
        { error: "Missing required field: id_pendaftaran" },
        { status: 400 }
      );
    }

    // Add id_karyawan to the request
    body.id_karyawan = parseInt(session.user.id);

    // Ensure id_pendaftaran is a number if provided
    if (body.id_pendaftaran) {
      body.id_pendaftaran = parseInt(body.id_pendaftaran);
    }

    console.log("[API /invoice] POST generating invoice with data:", {
      id_pendaftaran: body.id_pendaftaran,
      generate_from_pendaftaran: body.generate_from_pendaftaran,
      id_karyawan: body.id_karyawan
    });

    if (body.generate_from_pendaftaran) {
      const result = await callBridge("invoice.generateMissing", body);
      return NextResponse.json(result, { status: 201 });
    } else {
      const result = await callBridge("invoice.generate", body);
      return NextResponse.json(result, { status: 201 });
    }

  } catch (error: unknown) {
    console.error("[API /invoice] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
