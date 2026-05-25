import { NextResponse } from 'next/server';
import { callBridge } from '@/lib/bridge';

export async function GET() {
  try {
    const result = await callBridge('spesialisasi.index');
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /master/spesialisasi] GET Error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data spesialisasi' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[API /master/spesialisasi] Creating:', body.nama_spesialisasi);

    const result = await callBridge('spesialisasi.store', body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API /master/spesialisasi] POST Error:', error);
    return NextResponse.json({ error: 'Gagal menambah spesialisasi' }, { status: 500 });
  }
}
