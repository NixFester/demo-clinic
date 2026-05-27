import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from "@/lib/bridge";
import { generateWALink } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? "1";

    const result = await callBridge("followup.index", { page: parseInt(page) });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API /followup] GET error:", error);
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
    if (session.user.role !== "admin" && session.user.role !== "superadmin" && session.user.role !== "karyawan") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id_pasien, id_pendaftaran, no_whatsapp, pesan, jenis } = body;

    // Generate wa.me link
    const wa_link = generateWALink(no_whatsapp, pesan);

    const data = {
      id_pasien: parseInt(id_pasien),
      id_pendaftaran: parseInt(id_pendaftaran),
      id_pengguna: parseInt(session.user.id),
      no_whatsapp,
      pesan,
      wa_link,
      jenis,
    };

    console.log(`[API /followup] Creating follow-up WA for pasien: ${id_pasien}`);
    const result = await callBridge("followup.store", data);
    return NextResponse.json({ ...result, wa_link }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /followup] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
