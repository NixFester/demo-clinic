import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from '@/lib/bridge';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tindakanId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "dokter" && session.user.role !== "superadmin" && session.user.role !== "karyawan") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, tindakanId } = await params;
    console.log(`[API /rme/${id}/tindakan/${tindakanId}] Deleting tindakan`);
    const result = await callBridge('tindakan.delete', { id: parseInt(tindakanId), id_rme: parseInt(id) });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /rme/[id]/tindakan/[tindakanId]] Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus tindakan' }, { status: 500 });
  }
}
