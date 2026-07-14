'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, getTodayISO } from '@/lib/helpers';
import {
  Download, Loader2, Users, Receipt, UserPlus, CheckCircle,
  FileText, Calendar, Printer, XCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  LaporanHarian, LaporanBulanan, LaporanLayanan, LaporanProduk,
  LaporanDokter, LaporanRME, LaporanRange
} from '@/types/api-items';
import {
  LaporanHarianPDF,
  LaporanBulananPDF,
  LaporanLayananPDF,
  LaporanProdukPDF,
  LaporanDokterPDF,
  LaporanRMEPDF,
  LaporanRangePDF,
} from '@/components/shared/LaporanPDF';

const bulanOptions = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4', '#eab308'];

const getKategoriLabel = (k: string) => {
  const map: Record<string, string> = {
    kecantikan: 'Kecantikan', medis: 'Medis', konsultasi: 'Konsultasi',
    skincare: 'Skincare', obat: 'Obat', suplemen: 'Suplemen', lainnya: 'Lainnya'
  };
  return map[k] || k;
};

const getMetodeLabel = (m: string) => {
  const map: Record<string, string> = { tunai: 'Tunai', transfer: 'Transfer', qris: 'QRIS', debit: 'Debit' };
  return map[m] || m;
};

// ============================================================
// COMPONENTS
// ============================================================

function StatCard({ title, value, icon, color }: {
  title: string; value: string | number; icon: React.ReactNode; color: string;
}) {
  return (
    <Card className={`border ${color.replace('bg-', 'border-').replace('-50', '-200')}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
          <div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-3 text-gray-500">Memuat data...</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    lunas: 'bg-green-100 text-green-700',
    belum_bayar: 'bg-yellow-100 text-yellow-700',
    batal: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-700',
    final: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState('harian');
  
  // Harian
  const [harianData, setHarianData] = useState<LaporanHarian | null>(null);
  const [tanggal, setTanggal] = useState(getTodayISO());
  const [loadingHarian, setLoadingHarian] = useState(true);

  // Bulanan
  const [bulananData, setBulananData] = useState<LaporanBulanan | null>(null);
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [loadingBulanan, setLoadingBulanan] = useState(false);

  // Layanan
  const [layananData, setLayananData] = useState<LaporanLayanan | null>(null);
  const [tanggalLayanan, setTanggalLayanan] = useState(getTodayISO());
  const [loadingLayanan, setLoadingLayanan] = useState(false);

  // Produk
  const [produkData, setProdukData] = useState<LaporanProduk | null>(null);
  const [tanggalProduk, setTanggalProduk] = useState(getTodayISO());
  const [loadingProduk, setLoadingProduk] = useState(false);

  // Dokter
  const [dokterData, setDokterData] = useState<LaporanDokter | null>(null);
  const [tanggalDokter, setTanggalDokter] = useState(getTodayISO());
  const [loadingDokter, setLoadingDokter] = useState(false);

  // RME
  const [rmeData, setRmeData] = useState<LaporanRME | null>(null);
  const [tanggalRme, setTanggalRme] = useState(getTodayISO());
  const [loadingRme, setLoadingRme] = useState(false);

  // Range
  const [rangeData, setRangeData] = useState<LaporanRange | null>(null);
  const [tanggalMulai, setTanggalMulai] = useState(getTodayISO());
  const [tanggalSelesai, setTanggalSelesai] = useState(getTodayISO());
  const [loadingRange, setLoadingRange] = useState(false);

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  const fetchHarian = async (t = tanggal) => {
    setLoadingHarian(true);
    try {
      const res = await fetch(`/api/laporan/harian?tanggal=${t}`);
      const data = await res.json();
      setHarianData(data);
    } catch (err) {
      console.error('[LaporanPage] Harian error:', err);
      toast.error('Gagal memuat laporan harian');
    } finally {
      setLoadingHarian(false);
    }
  };

  const fetchBulanan = async () => {
    setLoadingBulanan(true);
    try {
      const res = await fetch(`/api/laporan/bulanan?bulan=${bulan}&tahun=${tahun}`);
      const data = await res.json();
      setBulananData(data);
    } catch (err) {
      console.error('[LaporanPage] Bulanan error:', err);
      toast.error('Gagal memuat laporan bulanan');
    } finally {
      setLoadingBulanan(false);
    }
  };

  const fetchLayanan = async (t = tanggalLayanan) => {
    setLoadingLayanan(true);
    try {
      const res = await fetch(`/api/laporan/layanan?tanggal=${t}`);
      const data = await res.json();
      setLayananData(data);
    } catch (err) {
      console.error('[LaporanPage] Layanan error:', err);
      toast.error('Gagal memuat laporan layanan');
    } finally {
      setLoadingLayanan(false);
    }
  };

  const fetchProduk = async (t = tanggalProduk) => {
    setLoadingProduk(true);
    try {
      const res = await fetch(`/api/laporan/produk?tanggal=${t}`);
      const data = await res.json();
      setProdukData(data);
    } catch (err) {
      console.error('[LaporanPage] Produk error:', err);
      toast.error('Gagal memuat laporan produk');
    } finally {
      setLoadingProduk(false);
    }
  };

  const fetchDokter = async (t = tanggalDokter) => {
    setLoadingDokter(true);
    try {
      const res = await fetch(`/api/laporan/dokter?tanggal=${t}`);
      const data = await res.json();
      setDokterData(data);
    } catch (err) {
      console.error('[LaporanPage] Dokter error:', err);
      toast.error('Gagal memuat laporan dokter');
    } finally {
      setLoadingDokter(false);
    }
  };

  const fetchRme = async (t = tanggalRme) => {
    setLoadingRme(true);
    try {
      const res = await fetch(`/api/laporan/rme?tanggal=${t}`);
      const data = await res.json();
      setRmeData(data);
    } catch (err) {
      console.error('[LaporanPage] RME error:', err);
      toast.error('Gagal memuat laporan RME');
    } finally {
      setLoadingRme(false);
    }
  };

  const fetchRange = async () => {
    setLoadingRange(true);
    try {
      const res = await fetch(`/api/laporan/range?tanggal_mulai=${tanggalMulai}&tanggal_selesai=${tanggalSelesai}`);
      const data = await res.json();
      setRangeData(data);
    } catch (err) {
      console.error('[LaporanPage] Range error:', err);
      toast.error('Gagal memuat laporan range');
    } finally {
      setLoadingRange(false);
    }
  };

  useEffect(() => { fetchHarian(); }, []);

  const handleExportPDF = async (tab: string) => {
    try {
      let doc = null;
      let filename = '';

      if (tab === 'harian' && harianData) {
        doc = <LaporanHarianPDF data={harianData} tanggal={tanggal} />;
        filename = `laporan-harian-${tanggal}`;
      } else if (tab === 'bulanan' && bulananData) {
        doc = <LaporanBulananPDF data={bulananData} bulan={bulan} tahun={tahun} />;
        filename = `laporan-bulanan-${bulan}-${tahun}`;
      } else if (tab === 'layanan' && layananData) {
        doc = <LaporanLayananPDF data={layananData} tanggal={tanggalLayanan} />;
        filename = `laporan-layanan-${tanggalLayanan}`;
      } else if (tab === 'produk' && produkData) {
        doc = <LaporanProdukPDF data={produkData} tanggal={tanggalProduk} />;
        filename = `laporan-produit-${tanggalProduk}`;
      } else if (tab === 'dokter' && dokterData) {
        doc = <LaporanDokterPDF data={dokterData} tanggal={tanggalDokter} />;
        filename = `laporan-dokter-${tanggalDokter}`;
      } else if (tab === 'rme' && rmeData) {
        doc = <LaporanRMEPDF data={rmeData} tanggal={tanggalRme} />;
        filename = `laporan-rme-${tanggalRme}`;
      } else if (tab === 'range' && rangeData) {
        doc = <LaporanRangePDF data={rangeData} mulai={tanggalMulai} selesai={tanggalSelesai} />;
        filename = `laporan-range-${tanggalMulai}-${tanggalSelesai}`;
      }

      if (!doc) {
        toast.info('Tidak ada data untuk diexport. Tampilkan data terlebih dahulu.');
        return;
      }

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export PDF berhasil');
    } catch (err) {
      console.error('[LaporanPage] export error:', err);
      toast.error('Gagal mengekspor PDF');
    }
  };

  const handlePrint = (tab: string) => {
    if (tab === 'harian' && !harianData) {
      toast.info('Tampilkan data harian terlebih dahulu.');
      return;
    }
    if (tab === 'bulanan' && !bulananData) {
      toast.info('Tampilkan data bulanan terlebih dahulu.');
      return;
    }
    if (tab === 'range' && !rangeData) {
      toast.info('Tampilkan data range terlebih dahulu.');
      return;
    }
    if (tab === 'layanan' && !layananData) {
      toast.info('Tampilkan data layanan terlebih dahulu.');
      return;
    }
    if (tab === 'produk' && !produkData) {
      toast.info('Tampilkan data produk terlebih dahulu.');
      return;
    }
    if (tab === 'dokter' && !dokterData) {
      toast.info('Tampilkan data dokter terlebih dahulu.');
      return;
    }
    if (tab === 'rme' && !rmeData) {
      toast.info('Tampilkan data RME terlebih dahulu.');
      return;
    }
    // Open print dialog with the PDF preview in new tab
    handleExportPDF(tab);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold">Laporan & Analisis</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportPDF(activeTab)}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handlePrint(activeTab)}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-1">
          <TabsTrigger value="harian">Harian</TabsTrigger>
          <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
          <TabsTrigger value="layanan">Layanan</TabsTrigger>
          <TabsTrigger value="produk">Produk</TabsTrigger>
          <TabsTrigger value="dokter">Dokter</TabsTrigger>
          <TabsTrigger value="rme">RME</TabsTrigger>
          <TabsTrigger value="range">Custom</TabsTrigger>
        </TabsList>

﻿        {/* ============================================================ */}
        {/* TAB: HARIAN */}
        {/* ============================================================ */}
        <TabsContent value="harian" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan Harian</CardTitle>
                <Input type="date" value={tanggal} onChange={(e) => { setTanggal(e.target.value); fetchHarian(e.target.value); }} className="w-auto" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingHarian ? <LoadingSkeleton /> : harianData ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard title="Total Pasien" value={harianData.total_pasien || 0} icon={<Users className="h-5 w-5" />} color="bg-blue-50" />
                    <StatCard title="Transaksi" value={harianData.total_invoice || 0} icon={<Receipt className="h-5 w-5" />} color="bg-purple-50" />
                    <StatCard title="Pasien Baru" value={harianData.pasien_baru || 0} icon={<UserPlus className="h-5 w-5" />} color="bg-teal-50" />
                    <StatCard title="Pasien Lama" value={harianData.pasien_lama || 0} icon={<Users className="h-5 w-5" />} color="bg-cyan-50" />
                  </div>

                  {/* Income Card */}
                  <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-emerald-600 uppercase font-medium">Total Pendapatan</p>
                        <p className="text-3xl font-bold text-emerald-700">{formatCurrency(harianData.total_pendapatan || 0)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transactions */}
                  {harianData.invoices && harianData.invoices.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Daftar Transaksi</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>No. Invoice</TableHead><TableHead>Pasien</TableHead><TableHead>Dokter</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {harianData.invoices.map((inv, i) => (<TableRow key={i}><TableCell className="font-mono">{inv.no_invoice}</TableCell><TableCell>{inv.nama_pasien}</TableCell><TableCell>{inv.nama_dokter || '-'}</TableCell><TableCell className="text-right">{formatCurrency(inv.total)}</TableCell><TableCell><StatusBadge status={inv.status} /></TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : <p className="text-center py-8 text-gray-500">Tidak ada data</p>}
            </CardContent>
          </Card>
        </TabsContent>

﻿        {/* TAB: BULANAN */}
        <TabsContent value="bulanan" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan Bulanan</CardTitle>
                <div className="flex gap-2 items-end">
                  <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {bulanOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                  <Input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-24" />
                  <Button size="sm" onClick={fetchBulanan} disabled={loadingBulanan}>
                    {loadingBulanan ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lihat"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBulanan ? <LoadingSkeleton /> : bulananData ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard title="Total Pasien" value={bulananData.total_pasien || 0} icon={<Users className="h-5 w-5" />} color="bg-blue-50" />
                    <StatCard title="Transaksi" value={bulananData.total_invoice || 0} icon={<Receipt className="h-5 w-5" />} color="bg-purple-50" />
                    <StatCard title="Pasien Baru" value={bulananData.pasien_baru || 0} icon={<UserPlus className="h-5 w-5" />} color="bg-teal-50" />
                    <StatCard title="Pasien Lama" value={(bulananData.total_pasien || 0) - (bulananData.pasien_baru || 0)} icon={<Users className="h-5 w-5" />} color="bg-cyan-50" />
                  </div>

                  {/* Income Card */}
                  <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-emerald-600 uppercase font-medium">Total Pendapatan</p>
                        <p className="text-3xl font-bold text-emerald-700">{formatCurrency(bulananData.total_pendapatan || 0)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transactions */}
                  {bulananData.invoices && bulananData.invoices.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Daftar Transaksi</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Pasien</TableHead><TableHead>Dokter</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {bulananData.invoices.map((inv: any, i: number) => (<TableRow key={i}><TableCell>{inv.tanggal || '-'}</TableCell><TableCell>{inv.nama_pasien}</TableCell><TableCell>{inv.nama_dokter || '-'}</TableCell><TableCell className="text-right">{formatCurrency(inv.total)}</TableCell><TableCell><StatusBadge status={inv.status} /></TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : <p className="text-center py-8 text-gray-500">Klik "Lihat" untuk menampilkan data</p>}
            </CardContent>
          </Card>
        </TabsContent>

﻿        {/* TAB: LAYANAN */}
        <TabsContent value="layanan" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan Layanan</CardTitle>
                <Input type="date" value={tanggalLayanan} onChange={(e) => { setTanggalLayanan(e.target.value); fetchLayanan(e.target.value); }} className="w-auto" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingLayanan ? <LoadingSkeleton /> : layananData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard title="Total Pendapatan" value={formatCurrency(layananData.total_pendapatan || 0)} icon={<Wallet className="h-5 w-5" />} color="bg-emerald-50" />
                  </div>
                  {layananData.per_kategori && layananData.per_kategori.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Per Kategori</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {layananData.per_kategori.map((k, i) => (<TableRow key={i}><TableCell>{getKategoriLabel(k.kategori)}</TableCell><TableCell className="text-right">{k.jumlah}</TableCell><TableCell className="text-right">{formatCurrency(k.total)}</TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                  {layananData.top_layanan && layananData.top_layanan.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Top Layanan</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Layanan</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {layananData.top_layanan.map((l, i) => (<TableRow key={i}><TableCell>{l.nama}</TableCell><TableCell className="text-right">{l.jumlah}</TableCell><TableCell className="text-right">{formatCurrency(l.total)}</TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : <p className="text-center py-8 text-gray-500">Tidak ada data</p>}
            </CardContent>
          </Card>
        </TabsContent>

﻿        {/* TAB: PRODUK */}
        <TabsContent value="produk" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan Produk</CardTitle>
                <Input type="date" value={tanggalProduk} onChange={(e) => { setTanggalProduk(e.target.value); fetchProduk(e.target.value); }} className="w-auto" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingProduk ? <LoadingSkeleton /> : produkData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard title="Total Pendapatan" value={formatCurrency(produkData.total_pendapatan || 0)} icon={<Wallet className="h-5 w-5" />} color="bg-emerald-50" />
                  </div>
                  {produkData.per_kategori && produkData.per_kategori.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Per Kategori</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {produkData.per_kategori.map((k, i) => (<TableRow key={i}><TableCell>{getKategoriLabel(k.kategori)}</TableCell><TableCell className="text-right">{k.jumlah}</TableCell><TableCell className="text-right">{formatCurrency(k.total)}</TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                  {produkData.top_produk && produkData.top_produk.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Top Produk</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {produkData.top_produk.map((p, i) => (<TableRow key={i}><TableCell>{p.nama}</TableCell><TableCell className="text-right">{p.jumlah}</TableCell><TableCell className="text-right">{formatCurrency(p.total)}</TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : <p className="text-center py-8 text-gray-500">Tidak ada data</p>}
            </CardContent>
          </Card>
        </TabsContent>

﻿        {/* TAB: DOKTER */}
        <TabsContent value="dokter" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan Dokter</CardTitle>
                <Input type="date" value={tanggalDokter} onChange={(e) => { setTanggalDokter(e.target.value); fetchDokter(e.target.value); }} className="w-auto" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingDokter ? <LoadingSkeleton /> : dokterData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard title="Total Pasien" value={dokterData.total_pasien || 0} icon={<Users className="h-5 w-5" />} color="bg-blue-50" />
                    <StatCard title="Total Pendapatan" value={formatCurrency(dokterData.total_pendapatan || 0)} icon={<Wallet className="h-5 w-5" />} color="bg-emerald-50" />
                  </div>
                  {dokterData.per_dokter && dokterData.per_dokter.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Performa Dokter</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Dokter</TableHead><TableHead className="text-right">Pasien</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Rata-rata</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {dokterData.per_dokter.map((d, i) => (<TableRow key={i}><TableCell>{d.nama_dokter}</TableCell><TableCell className="text-right">{d.jumlah_pasien}</TableCell><TableCell className="text-right">{formatCurrency(d.total_pendapatan)}</TableCell><TableCell className="text-right">{formatCurrency(d.rata_rata)}</TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : <p className="text-center py-8 text-gray-500">Tidak ada data</p>}
            </CardContent>
          </Card>
        </TabsContent>

﻿        {/* TAB: RME */}
        <TabsContent value="rme" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan RME</CardTitle>
                <Input type="date" value={tanggalRme} onChange={(e) => { setTanggalRme(e.target.value); fetchRme(e.target.value); }} className="w-auto" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingRme ? <LoadingSkeleton /> : rmeData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard title="Total RME" value={rmeData.total || 0} icon={<FileText className="h-5 w-5" />} color="bg-blue-50" />
                  </div>
                  {rmeData.per_status && rmeData.per_status.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Status RME</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {rmeData.per_status.map((s, i) => (<TableRow key={i}><TableCell className="capitalize">{s.status}</TableCell><TableCell className="text-right">{s.jumlah}</TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                  {rmeData.per_dokter && rmeData.per_dokter.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">RME per Dokter</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader><TableRow><TableHead>Dokter</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {rmeData.per_dokter.map((d, i) => (<TableRow key={i}><TableCell>{d.nama_dokter}</TableCell><TableCell className="text-right">{d.jumlah}</TableCell></TableRow>))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : <p className="text-center py-8 text-gray-500">Tidak ada data</p>}
            </CardContent>
          </Card>
        </TabsContent>

﻿        {/* TAB: CUSTOM RANGE */}
        <TabsContent value="range" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan Custom Range</CardTitle>
                <div className="flex gap-2 items-end">
                  <Input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-auto" />
                  <span className="text-gray-500">s/d</span>
                  <Input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-auto" />
                  <Button size="sm" onClick={fetchRange} disabled={loadingRange}>
                    {loadingRange ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lihat"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRange ? <LoadingSkeleton /> : rangeData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard title="Total Pasien" value={rangeData.total_pasien || 0} icon={<Users className="h-5 w-5" />} color="bg-blue-50" />
                    <StatCard title="Pasien Baru" value={rangeData.pasien_baru || 0} icon={<UserPlus className="h-5 w-5" />} color="bg-teal-50" />
                    <StatCard title="Total Invoice" value={rangeData.total_invoice || 0} icon={<Receipt className="h-5 w-5" />} color="bg-purple-50" />
                    <StatCard title="Total Pendapatan" value={formatCurrency(rangeData.total_pendapatan || 0)} icon={<Wallet className="h-5 w-5" />} color="bg-emerald-50" />
                  </div>
                  {rangeData.per_hari && rangeData.per_hari.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Pendapatan Harian</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={rangeData.per_hari}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hari" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={(v) => "Rp " + (v/1000000).toFixed(1) + "M"} />
                            <Tooltip  />
                            <Bar dataKey="pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : <p className="text-center py-8 text-gray-500">Klik "Lihat" untuk menampilkan data</p>}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}