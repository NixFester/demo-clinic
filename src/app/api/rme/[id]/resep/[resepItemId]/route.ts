import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callBridge } from '@/lib/bridge';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resepItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "dokter" && session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, resepItemId } = await params;
    console.log(`[API /rme/${id}/resep/${resepItemId}] Deleting resep item`);
    const result = await callBridge('resep.deleteItem', { id: parseInt(resepItemId), id_rme: parseInt(id) });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /rme/[id]/resep/[resepItemId]] Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus item resep' }, { status: 500 });
  }
}
