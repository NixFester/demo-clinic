import { NextRequest, NextResponse } from 'next/server';
import { callBridge } from '@/lib/bridge';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[API /master/pengguna/${id}/toggle] Toggling aktif status`);
    const result = await callBridge('pengguna.toggleAktif', { id: parseInt(id) });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /master/pengguna/[id]/toggle] Error:', error);
    return NextResponse.json({ error: 'Gagal mengubah status pengguna' }, { status: 500 });
  }
}
