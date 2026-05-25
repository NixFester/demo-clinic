import { NextRequest, NextResponse } from 'next/server';
import { callBridge } from '@/lib/bridge';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[API /invoice/${id}/batal] Cancelling invoice`);
    const result = await callBridge('invoice.batal', { id: parseInt(id) });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /invoice/[id]/batal] Error:', error);
    return NextResponse.json({ error: 'Gagal membatalkan invoice' }, { status: 500 });
  }
}
