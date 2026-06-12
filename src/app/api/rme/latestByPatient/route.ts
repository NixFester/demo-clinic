import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id_pasien = searchParams.get("id_pasien");

    if (!id_pasien) {
      return NextResponse.json(
        { error: "id_pasien is required" },
        { status: 400 }
      );
    }

    const result = await callBridge("rme.latestByPatient", { id_pasien: parseInt(id_pasien), id_rme: searchParams.get("id_rme") ? parseInt(searchParams.get("id_rme")!) : undefined  });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /rme/latestByPatient] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
