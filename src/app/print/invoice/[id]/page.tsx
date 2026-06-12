'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { render } from 'react-thermal-printer';
import { Button } from '@/components/ui/button';
import { InvoiceThermalPrint, buildReceiptElement } from '@/components/shared/InvoiceThermalPrint';
import type { InvoiceDetail } from '@/types/api-items';

const PRINT_MODE: 'serial' | 'network' = 'serial';
const PRINTER_IP   = '192.168.1.100';
const PRINTER_PORT = 9100;

type PrintStatus = 'idle' | 'printing' | 'done' | 'error';

export default function PrintInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice,     setInvoice]     = useState<InvoiceDetail | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState('');
  const [printStatus, setPrintStatus] = useState<PrintStatus>('idle');
  const [printError,  setPrintError]  = useState('');

  // Tracks whether auto-print already ran (network mode only)
  const autoPrinted = useRef(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/invoice/${id}`);
        if (!res.ok) throw new Error('Gagal memuat invoice');
        setInvoice(await res.json());
      } catch (e: any) {
        setFetchError(e?.message ?? 'Gagal memuat data invoice');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = useCallback(async () => {
    if (!invoice || printStatus === 'printing') return;
    setPrintStatus('printing');
    setPrintError('');

    try {
      const data = await render(buildReceiptElement(invoice));

      if (PRINT_MODE === 'serial') {
        if (!('serial' in navigator)) {
          throw new Error(
            'Web Serial tidak didukung. Gunakan Chrome/Edge atau ganti ke mode network.'
          );
        }
        // ✅ Safe — this function is only ever called from a button onClick
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable?.getWriter();
        if (!writer) throw new Error('Tidak bisa menulis ke port serial');
        await writer.write(data);
        writer.releaseLock();
        await port.close();

      } else {
        const res = await fetch('/api/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip:   PRINTER_IP,
            port: PRINTER_PORT,
            data: Array.from(data),
          }),
        });
        if (!res.ok) throw new Error((await res.text()) || 'Gagal mengirim ke printer');
      }

      setPrintStatus('done');
    } catch (e: any) {
      // User cancelled the port picker — treat as idle, not a real error
      if (e?.name === 'NotFoundError') {
        setPrintStatus('idle');
        return;
      }
      console.error('[PrintInvoicePage]', e);
      setPrintError(e?.message ?? 'Terjadi kesalahan saat mencetak');
      setPrintStatus('error');
    }
  }, [invoice, printStatus]);

  // ── Auto-print: network only (no user gesture needed) ────────────────────
  // Serial CANNOT auto-print — requestPort() requires a real click.
  // In serial mode we just pre-select the print button so it's obvious.
  useEffect(() => {
    if (!invoice || autoPrinted.current) return;
    if (PRINT_MODE === 'network') {
      autoPrinted.current = true;
      handlePrint();
    }
    // serial: do nothing, user must click the button
  }, [invoice, handlePrint]);

  // ── Status config ─────────────────────────────────────────────────────────
  const statusConfig = {
    idle:     { color: 'text-gray-500',    bg: 'bg-gray-50',    icon: null,                                         label: PRINT_MODE === 'serial' ? 'Klik tombol Cetak untuk mulai mencetak' : 'Siap' },
    printing: { color: 'text-indigo-600',  bg: 'bg-indigo-50',  icon: <Loader2 className="h-4 w-4 animate-spin" />, label: 'Mengirim ke printer...' },
    done:     { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="h-4 w-4" />,          label: 'Cetak berhasil' },
    error:    { color: 'text-red-600',     bg: 'bg-red-50',     icon: <AlertCircle className="h-4 w-4" />,           label: printError },
  } as const;

  const sc = statusConfig[printStatus];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Topbar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-gray-900">Print Invoice</h1>
          <p className="text-xs text-gray-500">#{id}</p>
        </div>
        {invoice && (
          <Button
            size="sm"
            onClick={handlePrint}   // ← real user gesture, Serial works here ✓
            disabled={printStatus === 'printing'}
            className="gap-2"
          >
            {printStatus === 'printing' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : printStatus === 'done' ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
            {printStatus === 'done' ? 'Cetak Ulang' : 'Cetak'}
          </Button>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className={`${sc.bg} ${sc.color} px-4 py-2 flex items-center gap-2 text-sm font-medium print:hidden`}>
        {sc.icon}
        <span>{sc.label}</span>
      </div>

      {/* ── Body ── */}
      <div className="py-6 px-4 flex justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Memuat invoice...</span>
          </div>
        ) : fetchError ? (
          <div className="max-w-xs w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {fetchError}
          </div>
        ) : invoice ? (
          <div className="w-[302px] bg-white rounded shadow-md p-4">
            <InvoiceThermalPrint invoice={invoice} />
          </div>
        ) : null}
      </div>
    </div>
  );
}