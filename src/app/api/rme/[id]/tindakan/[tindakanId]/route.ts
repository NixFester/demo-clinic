import { NextRequest, NextResponse } from 'next/server';
import { callBridge } from '@/lib/bridge';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tindakanId: string }> }
) {
  try {
    const { id, tindakanId } = await params;
    console.log(`[API /rme/${id}/tindakan/${tindakanId}] Deleting tindakan`);
    const result = await callBridge('tindakan.delete', { id: parseInt(tindakanId), id_rme: parseInt(id) });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /rme/[id]/tindakan/[tindakanId]] Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus tindakan' }, { status: 500 });
  }
}
