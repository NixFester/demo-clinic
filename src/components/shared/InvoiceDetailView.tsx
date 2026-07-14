'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Plus, Trash2, Printer, Download } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import { useIsMobile } from "@/hooks/use-mobile";
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';


interface PembayaranItem {
  id: number;
  nominal: number;
  metode: string;
  kembalian: number;
  created_at: string;
}

export interface InvoiceDetail {
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
  no_whatsapp?: string;
  nama_karyawan?: string;
  nama_dokter?: string;
  items: {
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

interface InvoiceDetailViewProps {
  id: string;
  backHref: string;
}

const metodeOptions = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'qris', label: 'QRIS' },
  { value: 'debit', label: 'Kartu Debit' },
];

export default function InvoiceDetailView({ id, backHref }: InvoiceDetailViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diskonPersen, setDiskonPersen] = useState('');
  const [applyingDiskon, setApplyingDiskon] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([{ jumlah: '', metode: 'tunai' }]);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoice/${id}`);
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      console.error('[InvoiceDetailView] Error:', err);
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
    setApplyingDiskon(true);
    try {
      const res = await fetch(`/api/invoice/${id}/diskon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persen_diskon: parseFloat(diskonPersen) }),
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

  const addPayment = () => setPayments([...payments, { jumlah: '', metode: 'tunai' }]);

  const removePayment = (index: number) =>
    setPayments(payments.filter((_, i) => i !== index));

  const updatePayment = (index: number, field: keyof PaymentEntry, value: string) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
  // ✅ Correct: sisa tagihan = total - total_dibayar (not subtotal)
  const sisaTagihan = invoice ? invoice.total - (invoice.total_dibayar || 0) : 0;
  const kembalian = totalPayments - sisaTagihan;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      for (const payment of payments) {
        if (!payment.jumlah || parseFloat(payment.jumlah) <= 0) continue;
        // ✅ Correct field names: jumlah_bayar & metode_pembayaran
        const res = await fetch('/api/pembayaran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_invoice: invoice!.id,
            nominal: parseFloat(payment.jumlah),
            metode: payment.metode,
          }),
        });
        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.error || 'Gagal memproses pembayaran');
        }
      }
      toast.success('Pembayaran berhasil!');
      setPayments([{ jumlah: '', metode: 'tunai' }]);
      fetchInvoice();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses pembayaran');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCetak = () => {
    if (typeof window !== 'undefined' && invoice) {
      window.open(`/print/invoice/${invoice.id}`, '_blank', 'noopener,noreferrer');
    }
  };

  // ─── PDF Styles ─────────────────────────────────────────────────────────────
  const colors = {
    primary: '#059669',
    primaryLight: '#D1FAE5',
    dark: '#1F2937',
    gray: '#6B7280',
    light: '#F9FAFB',
    border: '#E5E7EB',
    white: '#FFFFFF',
    red: '#DC2626',
    yellow: '#D97706',
    blue: '#2563EB',
  };

  const s = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: colors.dark, backgroundColor: colors.white },
    header: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerLeft: { flex: 1 },
    clinicName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 3 },
    clinicAddress: { fontSize: 9, color: colors.gray },
    headerRight: { alignItems: 'flex-end' },
    title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.dark },
    subtitle: { fontSize: 10, color: colors.gray, marginTop: 2 },
    divider: { borderBottomWidth: 2, borderBottomColor: colors.primary, marginVertical: 12 },
    infoRow: { flexDirection: 'row', marginBottom: 4 },
    infoLabel: { width: 120, fontSize: 9, color: colors.gray },
    infoValue: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.dark },
    section: { marginTop: 16 },
    sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.white, backgroundColor: colors.primary, padding: 6, borderRadius: 4, marginBottom: 8 },
    table: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: colors.primary },
    tableHeaderCell: { padding: 6, fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.white },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
    tableCell: { padding: 6, fontSize: 9, color: colors.dark },
    tableCellRight: { padding: 6, fontSize: 9, color: colors.dark, textAlign: 'right' },
    summaryBox: { backgroundColor: colors.light, borderRadius: 6, padding: 12, marginTop: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    summaryLabel: { fontSize: 10, color: colors.gray },
    summaryValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.dark },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 2, borderTopColor: colors.primary, marginTop: 8 },
    totalLabel: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.primary },
    totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.primary },
    badgeGreen: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, backgroundColor: '#DCFCE7', color: '#166534', alignSelf: 'flex-start' },
    badgeYellow: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, backgroundColor: '#FEF9C3', color: '#854D0E', alignSelf: 'flex-start' },
    badgeRed: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, backgroundColor: '#FEE2E2', color: '#991B1B', alignSelf: 'flex-start' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerLine: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
    footerText: { fontSize: 8, color: colors.gray, textAlign: 'center', width: '100%' },
  });

  const fmtRp = (v: number) => 'Rp ' + v.toLocaleString('id-ID');
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const handleExportPDF = async () => {
    if (!invoice) return;
    try {
      const getStatusBadge = (status: string) => {
        if (status === 'lunas') return s.badgeGreen;
        if (status === 'belum_bayar') return s.badgeYellow;
        if (status === 'batal') return s.badgeRed;
        return {};
      };
      const getStatusLabel = (status: string) => {
        if (status === 'lunas') return 'LUNAS';
        if (status === 'belum_bayar') return 'BELUM LUNAS';
        if (status === 'batal') return 'BATAL';
        return status.toUpperCase();
      };

      const InvoicePDF = (
        <Document>
          <Page size="A4" style={s.page}>
            <View style={s.header}>
              <View style={s.headerLeft}>
                <Text style={s.clinicName}>Elrhea Clinic</Text>
                <Text style={s.clinicAddress}>Jl Bendo 3, Lempongsari, Gajahmungkur, Semarang, 50231</Text>
              </View>
              <View style={s.headerRight}>
                <Text style={s.title}>INVOICE</Text>
                <Text style={s.subtitle}>{invoice.no_invoice}</Text>
              </View>
            </View>
            <View style={s.divider} />

            <View style={{ marginBottom: 12 }}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Tanggal</Text>
                <Text style={s.infoValue}>{fmtDate(invoice.created_at)} {fmtTime(invoice.created_at)}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Pasien</Text>
                <Text style={s.infoValue}>{invoice.nama_pasien || '-'}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>No. RM</Text>
                <Text style={s.infoValue}>{invoice.no_rekam_medis || '-'}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Dokter</Text>
                <Text style={s.infoValue}>{invoice.nama_dokter || '-'}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Kasir</Text>
                <Text style={s.infoValue}>{invoice.nama_karyawan || '-'}</Text>
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Detail Transaksi</Text>
              <View style={s.table}>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { width: '5%' }]}>No</Text>
                  <Text style={[s.tableHeaderCell, { width: '35%' }]}>Nama Item</Text>
                  <Text style={[s.tableHeaderCell, { width: '15%' }]}>Jenis</Text>
                  <Text style={[s.tableHeaderCell, { width: '10%' }]}>Qty</Text>
                  <Text style={[s.tableHeaderCell, { width: '20%' }]}>Harga</Text>
                  <Text style={[s.tableHeaderCell, { width: '15%' }]}>Subtotal</Text>
                </View>
                {invoice.items.map((item, i) => (
                  <View key={item.id} style={s.tableRow}>
                    <Text style={[s.tableCell, { width: '5%' }]}>{i + 1}</Text>
                    <Text style={[s.tableCell, { width: '35%' }]}>{item.nama_item || '-'}</Text>
                    <Text style={[s.tableCell, { width: '15%' }]}>{item.jenis || '-'}</Text>
                    <Text style={[s.tableCellRight, { width: '10%' }]}>{item.qty ?? '-'}</Text>
                    <Text style={[s.tableCellRight, { width: '20%' }]}>{item.harga_satuan !== undefined ? fmtRp(item.harga_satuan) : '-'}</Text>
                    <Text style={[s.tableCellRight, { width: '15%' }]}>{item.subtotal !== undefined ? fmtRp(item.subtotal) : '-'}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.summaryBox}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal</Text>
                <Text style={s.summaryValue}>{fmtRp(invoice.subtotal || 0)}</Text>
              </View>
              {(invoice.diskon || 0) > 0 && (
                <View style={s.summaryRow}>
                  <Text style={[s.summaryLabel, { color: colors.yellow }]}>Diskon</Text>
                  <Text style={[s.summaryValue, { color: colors.yellow }]}>-{fmtRp(invoice.diskon || 0)}</Text>
                </View>
              )}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>TOTAL</Text>
                <Text style={s.totalValue}>{fmtRp(invoice.total || 0)}</Text>
              </View>
              {(invoice.total_dibayar || 0) > 0 && (
                <>
                  <View style={[s.summaryRow, { marginTop: 8 }]}>
                    <Text style={[s.summaryLabel, { color: colors.primary }]}>Sudah Dibayar</Text>
                    <Text style={[s.summaryValue, { color: colors.primary }]}>{fmtRp(invoice.total_dibayar || 0)}</Text>
                  </View>
                  <View style={s.summaryRow}>
                    <Text style={[s.summaryLabel, { color: colors.red }]}>Sisa Tagihan</Text>
                    <Text style={[s.summaryValue, { color: colors.red }]}>{fmtRp(invoice.total - (invoice.total_dibayar || 0))}</Text>
                  </View>
                </>
              )}
            </View>

            {invoice.pembayaran && invoice.pembayaran.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Riwayat Pembayaran</Text>
                {invoice.pembayaran.map((p) => (
                  <View key={p.id} style={[s.summaryRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <View>
                      <Text style={s.summaryValue}>{fmtRp(p.nominal)}</Text>
                      <Text style={{ fontSize: 8, color: colors.gray }}>{p.metode} - {fmtDate(p.created_at)}</Text>
                    </View>
                    {p.kembalian > 0 && (
                      <Text style={{ fontSize: 9, color: colors.primary }}>Kembalian: {fmtRp(p.kembalian)}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={[s.summaryBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }]}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>Status Pembayaran</Text>
              <Text style={[s.badgeGreen]}>{getStatusLabel(invoice.status)}</Text>
            </View>

            <View style={s.footer}>
              <View style={[s.footerLine, { width: '100%' }]}>
                <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
              </View>
            </View>
          </Page>
        </Document>
      );

      const asPdf = pdf(InvoicePDF);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.no_invoice}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export PDF berhasil');
    } catch (err) {
      console.error('[InvoiceDetailView] PDF export error:', err);
      toast.error('Gagal mengekspor PDF');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-2 text-gray-500">Memuat data invoice...</span>
    </div>
  );

  if (error || !invoice) return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push(backHref)}>
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(backHref)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Detail Invoice</h1>
          <p className="text-sm text-gray-500">
            {invoice.no_invoice} | {invoice.nama_pasien}
            {invoice.no_rekam_medis && ` | ${invoice.no_rekam_medis}`}
            {invoice.created_at && ` | ${formatDateTime(invoice.created_at)}`}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button size="sm" variant="outline" onClick={handleCetak}>
          <Printer className="h-4 w-4 mr-2" />
          Print Struk
        </Button>
        <StatusBadge status={invoice.status} />
      </div>

      {/* Invoice Items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detail Item</CardTitle></CardHeader>
        <CardContent>
          {invoice.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada item pada invoice ini</div>
          ) : isMobile ? (
  <div className="space-y-2">
    {invoice.items.map((item) => (
      <div key={item.id} className="flex justify-between items-start py-2 border-b last:border-0">
        <div className="flex-1 pr-2">
          <p className="text-sm font-medium">{item.nama_item}</p>
          <p className="text-xs text-gray-500">{item.jenis} · {item.qty ?? '-'} x {item.harga_satuan !== undefined ? formatCurrency(item.harga_satuan) : '-'}</p>
        </div>
        <p className="text-sm font-medium">{item.subtotal !== undefined ? formatCurrency(item.subtotal) : '-'}</p>
      </div>
    ))}
  </div>
) : (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 font-medium">Nama Item</th>
                    <th className="px-4 py-2 font-medium">Jenis</th>
                    <th className="px-4 py-2 font-medium">Jumlah</th>
                    <th className="px-4 py-2 font-medium">Harga Satuan</th>
                    <th className="px-4 py-2 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">{item.nama_item || '-'}</td>
                      <td className="px-4 py-2">{item.jenis}</td>
                      <td className="px-4 py-2">{item.qty ?? '-'}</td>
                      <td className="px-4 py-2">
                        {item.harga_satuan !== undefined ? formatCurrency(item.harga_satuan) : '-'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.subtotal !== undefined ? formatCurrency(item.subtotal) : '-'}
                      </td>
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
              {/* ✅ Show diskon as formatted currency, not raw percentage number */}
              <span>Diskon</span>
              <span>-{formatCurrency(invoice.diskon || 0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(invoice.total || 0)}</span>
          </div>
          {/* ✅ Correct: use total_dibayar, not subtotal */}
          {(invoice.total_dibayar || 0) > 0 && (
            <>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Sudah Dibayar</span>
                <span>{formatCurrency(invoice.total_dibayar || 0)}</span>
              </div>
              <div className="flex justify-between font-medium text-red-600">
                <span>Sisa Tagihan</span>
                <span>{formatCurrency(sisaTagihan)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
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
                    {p.kembalian > 0 && (
                      <span className="text-sm text-emerald-600 ml-4">
                        Kembalian: {formatCurrency(p.kembalian)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {p.created_at && formatDateTime(p.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diskon Form */}
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
                <div key={index} className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3 items-start`}>
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs">Metode</Label>
                    <select
                      value={payment.metode}
                      onChange={(e) => updatePayment(index, 'metode', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {metodeOptions.map((m) => (
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
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-red-500"
                      onClick={() => removePayment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {payments.some((p) => p.metode === 'tunai') && kembalian > 0 && (
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm">Kembalian</span>
                  <span className="font-medium text-emerald-700">{formatCurrency(kembalian)}</span>
                </div>
              )}

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg text-sm">
                <span>Total Pembayaran</span>
                <span className="font-bold">{formatCurrency(totalPayments)}</span>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={submittingPayment || totalPayments <= 0}
              >
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