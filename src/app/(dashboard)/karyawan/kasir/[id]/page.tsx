'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/helpers';

interface ResepItem {
  id: number;
  nama_produk: string;
  jumlah: number;
  harga_jual: number;
  dosis: string;
  aturan_pakai: string;
}

interface PembayaranItem {
  id: number;
  nominal: number;
  metode: string;
  kembalian: number;
  created_at: string;
}

interface InvoiceData {
  id: number;
  no_invoice: string;
  id_pendaftaran: number;
  id_karyawan: number;
  subtotal: number;
  diskon: number;
  total: number;
  total_dibayar: number;
  status: string;
  created_at: string;
  updated_at: string;
  nama_pasien?: string;
  no_rekam_medis?: string;
  alamat_pasien?: string;
  no_whatsapp: string;
  nama_karyawan?: string;
  nama_dokter?: string;
  items : {
    id: number;
    id_invoice: number;
    id_referensi: number;
    jenis: string;
    nama_item?: string;
    qty?: number;
    harga_satuan?: number;
    subtotal?: number;
  }[];
  pembayaran?: PembayaranItem[];
}

interface PaymentEntry {
  jumlah: string;
  metode: string;
}

function getStatusBadge(status: string) {
  const map: Record<string, { className: string }> = {
    belum_bayar: { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    lunas: { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    batal: { className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    draft: { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
    final: { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  };
  const config = map[status] || { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
  const label = status === 'belum_bayar' ? 'Belum Bayar' : status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant="secondary" className={config.className}>{label}</Badge>;
}

export default function KaryawanKasirDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diskonPersen, setDiskonPersen] = useState('');
  const [applyingDiskon, setApplyingDiskon] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([{ jumlah: '', metode: 'tunai' }]);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [nominalDiterima, setNominalDiterima] = useState('');

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoice/${id}`);
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      console.error('[KaryawanKasirDetail] Error:', err);
      setError('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const handleApplyDiskon = async () => {
    if (!diskonPersen) return;
    const persen = parseFloat(diskonPersen);
    setApplyingDiskon(true);
    try {
      const res = await fetch(`/api/invoice/${id}/diskon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persen_diskon: persen }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal menerapkan diskon');
      }
      toast.success('Diskon berhasil diterapkan');
      setDiskonPersen('');
      fetchInvoice();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menerapkan diskon');
    } finally {
      setApplyingDiskon(false);
    }
  };

  const addPayment = () => {
    setPayments([...payments, { jumlah: '', metode: 'tunai' }]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, field: keyof PaymentEntry, value: string) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
    // Auto-fill nominal diterima for tunai
    if (field === 'jumlah' && updated[index].metode === 'tunai' && index === 0) {
      setNominalDiterima(value);
    }
  };

  const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
  const sisaTagihan = invoice ? invoice.total - (invoice.subtotal || 0) : 0;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      for (const payment of payments) {
        if (!payment.jumlah || parseFloat(payment.jumlah) <= 0) continue;
        const res = await fetch('/api/pembayaran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_invoice: invoice!.id,
            nominal: parseFloat(payment.jumlah),
            metode: payment.metode,
            kembalian: payment.metode === 'tunai' ? (parseFloat(nominalDiterima) - sisaTagihan) : 0,
          }),
        });
        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.error || 'Gagal memproses pembayaran');
        }
      }
      toast.success('Pembayaran berhasil!');
      setPayments([{ jumlah: '', metode: 'tunai' }]);
      setNominalDiterima('');
      fetchInvoice();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses pembayaran');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Kembalian calculation for tunai
  const tunaiPayment = payments.find(p => p.metode === 'tunai');
  const nominalDiterimaNum = parseFloat(nominalDiterima) || 0;
  const kembalian = tunaiPayment ? nominalDiterimaNum - sisaTagihan : 0;

  const metodeOptions = [
    { value: 'tunai', label: 'Tunai' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'qris', label: 'QRIS' },
    { value: 'debit', label: 'Kartu Debit' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-2 text-gray-500">Memuat data invoice...</span>
    </div>
  );

  if (error || !invoice) return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push('/karyawan/kasir')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
      </Button>
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error || 'Invoice tidak ditemukan'}
      </div>
    </div>
  );

  const isBelumBayar = invoice.status === 'belum_bayar';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/karyawan/kasir')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Detail Invoice</h1>
          <p className="text-sm text-gray-500">{invoice.no_invoice} | {invoice.nama_pasien} | {formatDateTime(invoice.created_at)} | {invoice.no_rekam_medis}</p>
        </div>
        {getStatusBadge(invoice.status)}
      </div>

      {/* Invoice Items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detail Item</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {invoice.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada item pada invoice ini</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Nama Item</th>
                    <th className="px-4 py-2">Jenis</th>
                    <th className="px-4 py-2">Jumlah</th>
                    <th className="px-4 py-2">Harga Satuan</th>
                    <th className="px-4 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map(item => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">{item.nama_item || '-'}</td>
                      <td className="px-4 py-2">{item.jenis}</td>
                      <td className="px-4 py-2">{item.qty ?? '-'}</td>
                      <td className="px-4 py-2">{item.harga_satuan !== undefined ? formatCurrency(item.harga_satuan) : '-'}</td>
                      <td className="px-4 py-2">{item.subtotal !== undefined ? formatCurrency(item.subtotal) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ringkasan Pembayaran</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal || 0)}</span>
          </div>
          {(invoice.diskon || 0) > 0 && (
            <div className="flex justify-between text-sm text-yellow-600">
              <span>Diskon ({invoice.diskon}%)</span>
              <span>-{formatCurrency(invoice.diskon || 0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(invoice.total || 0)}</span>
          </div>
          {(invoice.subtotal || 0) > 0 && (
            <>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Sudah Dibayar</span>
                <span>{formatCurrency(invoice.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between font-medium text-red-600">
                <span>Sisa Tagihan</span>
                <span>{formatCurrency(sisaTagihan)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Existing Payments */}
      {invoice.pembayaran && invoice.pembayaran.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Riwayat Pembayaran</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.pembayaran.map((p) => (
                <div key={p.id} className="flex justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{formatCurrency(p.nominal)}</span>
                    <span className="text-sm text-gray-500 ml-2">({p.metode})</span>
                    <span className={`text-sm ml-2 ${p.kembalian >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {p.kembalian >= 0 ? `Kembalian: ${formatCurrency(p.kembalian)}` : `Kurang: ${formatCurrency(-p.kembalian)}`}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDateTime(p.created_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diskon Form - karyawan limited by batas_diskon_karyawan */}
      {isBelumBayar && (
        <Card>
          <CardHeader><CardTitle className="text-base">Terapkan Diskon</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="space-y-2 flex-1">
                <Label>Diskon (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={diskonPersen}
                  onChange={(e) => setDiskonPersen(e.target.value)}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleApplyDiskon} disabled={!diskonPersen || applyingDiskon}>
                {applyingDiskon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Terapkan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
      {isBelumBayar && sisaTagihan > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Proses Pembayaran</CardTitle>
              <Button size="sm" variant="outline" onClick={addPayment}>
                <Plus className="h-3 w-3 mr-1" /> Tambah Pembayaran
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Sisa Tagihan</span>
                <span className="text-lg font-bold text-red-600">{formatCurrency(sisaTagihan)}</span>
              </div>

              {payments.map((payment, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs">Metode</Label>
                    <select
                      value={payment.metode}
                      onChange={(e) => updatePayment(index, 'metode', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {metodeOptions.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs">Jumlah Bayar</Label>
                    <Input
                      type="number"
                      value={payment.jumlah}
                      onChange={(e) => updatePayment(index, 'jumlah', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  {payments.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-red-500" onClick={() => removePayment(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Tunai: input nominal diterima, auto-calculate kembalian */}
              {payments.some(p => p.metode === 'tunai') && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-xs">Nominal Diterima (Tunai)</Label>
                    <Input
                      type="number"
                      value={nominalDiterima}
                      onChange={(e) => setNominalDiterima(e.target.value)}
                      placeholder="Masukkan nominal yang diterima"
                    />
                  </div>
                  {nominalDiterimaNum > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Kembalian</span>
                      <span className={`font-medium ${kembalian >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(kembalian))}
                        {kembalian < 0 && ' (kurang)'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg text-sm">
                <span>Total Pembayaran</span>
                <span className="font-bold">{formatCurrency(totalPayments)}</span>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submittingPayment || totalPayments <= 0}>
                {submittingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Bayar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
