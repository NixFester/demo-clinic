'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Loader2, Eye, Download, Printer } from 'lucide-react';
import type { PendaftaranListItem } from '@/types/api-items';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

export default function KasirLaporanPage() {
  const router = useRouter();
  const [data, setData] = useState<PendaftaranListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async (pageNumber = page) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/pendaftaran/lunas?page=${pageNumber}`);
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Gagal memuat laporan pembayaran');
      }
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[KasirLaporanPage] error:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

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
  };

  const s = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: colors.dark },
    header: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerLeft: { flex: 1 },
    clinicName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 2 },
    clinicAddress: { fontSize: 9, color: colors.gray },
    headerRight: { alignItems: 'flex-end' },
    title: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.dark },
    date: { fontSize: 9, color: colors.gray },
    divider: { borderBottomWidth: 2, borderBottomColor: colors.primary, marginVertical: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: { width: '48%', backgroundColor: colors.light, borderRadius: 6, padding: 12, borderLeftWidth: 4, borderLeftColor: colors.primary },
    statLabel: { fontSize: 8, color: colors.gray, marginBottom: 2, textTransform: 'uppercase' },
    statValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.dark },
    incomeCard: { backgroundColor: colors.primaryLight, borderRadius: 8, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.primary },
    table: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
    tableHeader: { flexDirection: 'row', backgroundColor: colors.primary },
    tableHeaderCell: { padding: 6, fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.white },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
    tableCell: { padding: 6, fontSize: 9, color: colors.dark },
    badgeGreen: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, backgroundColor: '#DCFCE7', color: '#166534', alignSelf: 'flex-start' },
    badgeYellow: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, backgroundColor: '#FEF9C3', color: '#854D0E', alignSelf: 'flex-start' },
    badgeRed: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, backgroundColor: '#FEE2E2', color: '#991B1B', alignSelf: 'flex-start' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40 },
    footerLine: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
    footerText: { fontSize: 8, color: colors.gray, textAlign: 'center', width: '100%' },
  });

  const fmtRp = (v: number) => 'Rp ' + v.toLocaleString('id-ID');
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleExportPDF = async () => {
    if (data.length === 0) {
      toast.info('Tidak ada data untuk diexport');
      return;
    }
    try {
      const totalAmount = data.reduce((sum, item) => sum + (item.total_harga || 0), 0);

      const KasirPDF = (
        <Document>
          <Page size="A4" style={s.page}>
            <View style={s.header}>
              <View style={s.headerLeft}>
                <Text style={s.clinicName}>Elrhea Clinic</Text>
                <Text style={s.clinicAddress}>Jl Bendo 3, Lempongsari, Gajahmungkur, Semarang, 50231</Text>
              </View>
              <View style={s.headerRight}>
                <Text style={s.title}>Laporan Pembayaran Kasir</Text>
                <Text style={s.date}>{fmtDate(new Date().toISOString())}</Text>
              </View>
            </View>
            <View style={s.divider} />

            {/* Summary Stats */}
            <View style={s.statsGrid}>
              <View style={s.statCard}>
                <Text style={s.statLabel}>Total Transaksi</Text>
                <Text style={s.statValue}>{data.length}</Text>
              </View>
            </View>

            {/* Income Card */}
            <View style={s.incomeCard}>
              <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>Total Pendapatan</Text>
              <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{fmtRp(totalAmount)}</Text>
            </View>

            {/* Transactions Table */}
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: '15%' }]}>No. Antrian</Text>
                <Text style={[s.tableHeaderCell, { width: '25%' }]}>Nama Pasien</Text>
                <Text style={[s.tableHeaderCell, { width: '20%' }]}>Tanggal</Text>
                <Text style={[s.tableHeaderCell, { width: '25%' }]}>Layanan</Text>
                <Text style={[s.tableHeaderCell, { width: '15%' }]}>Status</Text>
              </View>
              {data.map((item, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={[s.tableCell, { width: '15%' }]}>{item.no_antrian}</Text>
                  <Text style={[s.tableCell, { width: '25%' }]}>{item.nama_pasien}</Text>
                  <Text style={[s.tableCell, { width: '20%' }]}>{item.tanggal ? fmtDate(item.tanggal) : '-'}</Text>
                  <Text style={[s.tableCell, { width: '25%' }]}>{item.nama_layanan || '-'}</Text>
                  <View style={{ width: '15%', padding: 6 }}>
                    <Text style={[s.badgeGreen]}>{item.status_invoice === 'lunas' ? 'LUNAS' : item.status_invoice?.toUpperCase() || 'N/A'}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.footer}>
              <View style={[s.footerLine, { width: '100%' }]}>
                <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
              </View>
            </View>
          </Page>
        </Document>
      );
      const asPdf = pdf(KasirPDF);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-kasir-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export PDF berhasil');
    } catch (err) {
      console.error('[KasirLaporan] export error:', err);
      toast.error('Gagal mengekspor PDF');
    }
  };

  const handlePrint = () => {
    handleExportPDF();
    setTimeout(() => window.print(), 500);
  };

  const totalAmount = data.reduce((sum, item) => sum + (item.total_harga || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Pembayaran</h1>
          <p className="text-sm text-gray-500">Daftar pendaftaran lunas untuk laporan kasir.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-emerald-600 uppercase font-medium">Total Pendapatan</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase font-medium">Total Transaksi</p>
              <p className="text-2xl font-bold">{data.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Transaksi Lunas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Antrian</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow key="empty">
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Tidak ada laporan pembayaran.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item, index) => (
                      <TableRow key={item.id ?? index}>
                        <TableCell className="font-mono">{item.no_antrian}</TableCell>
                        <TableCell>{item.nama_pasien}</TableCell>
                        <TableCell>{item.tanggal ? formatDateTime(item.tanggal) : '-'}</TableCell>
                        <TableCell>{item.nama_layanan || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total_harga || 0)}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status_invoice || 'lunas'} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="inline-flex items-center gap-2"
                            onClick={() => {
                              if (item.id_invoice) router.push(`/kasir/${item.id_invoice}`);
                              else toast.error('Invoice tidak tersedia');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
