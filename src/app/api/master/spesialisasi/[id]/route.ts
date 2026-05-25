import { NextRequest, NextResponse } from 'next/server';
import { callBridge } from '@/lib/bridge';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await callBridge('spesialisasi.update', { ...body, id: parseInt(id) });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /master/spesialisasi/[id]] PUT Error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate spesialisasi' }, { status: 500 });
  }
}
