import { NextRequest, NextResponse } from 'next/server';
import { callBridge } from '@/lib/bridge';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resepItemId: string }> }
) {
  try {
    const { id, resepItemId } = await params;
    console.log(`[API /rme/${id}/resep/${resepItemId}] Deleting resep item`);
    const result = await callBridge('resep.deleteItem', { id: parseInt(resepItemId), id_rme: parseInt(id) });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /rme/[id]/resep/[resepItemId]] Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus item resep' }, { status: 500 });
  }
}
