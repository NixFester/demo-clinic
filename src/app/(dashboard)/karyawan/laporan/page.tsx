'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, getTodayISO } from '@/lib/helpers';
import { Download, Loader2, Users, Wallet, Receipt, UserPlus, CheckCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import type { LaporanHarian, LaporanBulanan } from '@/types/api-items';
import { LaporanHarianPDF, LaporanBulananPDF } from '@/components/shared/LaporanPDF';

const bulanOptions = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
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

function StatusBadge({ status }: { status: string }) {
  const styles = {
    lunas: 'bg-green-100 text-green-700',
    belum_bayar: 'bg-yellow-100 text-yellow-700',
    batal: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
      {status === 'lunas' ? 'Lunas' : status === 'belum_bayar' ? 'Belum Lunas' : status}
    </span>
  );
}

export default function KaryawanLaporanPage() {
  const [activeTab, setActiveTab] = useState('harian');
  const [harianData, setHarianData] = useState<LaporanHarian | null>(null);
  const [tanggal, setTanggal] = useState(getTodayISO());
  const [loadingHarian, setLoadingHarian] = useState(true);

  const [bulananData, setBulananData] = useState<LaporanBulanan | null>(null);
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [loadingBulanan, setLoadingBulanan] = useState(false);

  const fetchHarian = async (t = tanggal) => {
    setLoadingHarian(true);
    try {
      const res = await fetch("/api/laporan/harian?tanggal=" + t);
      const data = await res.json();
      setHarianData(data);
    } catch (err) {
      console.error('[KaryawanLaporan] Harian error:', err);
      toast.error('Gagal memuat laporan harian');
    } finally {
      setLoadingHarian(false);
    }
  };

  const fetchBulanan = async () => {
    setLoadingBulanan(true);
    try {
      const res = await fetch("/api/laporan/bulanan?bulan=" + bulan + "&tahun=" + tahun);
      const data = await res.json();
      setBulananData(data);
    } catch (err) {
      console.error('[KaryawanLaporan] Bulanan error:', err);
      toast.error('Gagal memuat laporan bulanan');
    } finally {
      setLoadingBulanan(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'harian') fetchHarian();
    if (activeTab === 'bulanan') fetchBulanan();
  }, [activeTab]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'bulanan') fetchBulanan();
  }, [bulan, tahun]);

  const handleExportPDF = async () => {
    if (activeTab === 'harian' && harianData) {
      try {
        const doc = <LaporanHarianPDF data={harianData} tanggal={tanggal} />;
        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-harian-${tanggal}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Export PDF berhasil');
      } catch (err) {
        console.error('[KaryawanLaporan] export error:', err);
        toast.error('Gagal mengekspor PDF');
      }
    } else if (activeTab === 'bulanan' && bulananData) {
      try {
        const doc = <LaporanBulananPDF data={bulananData} bulan={bulan} tahun={tahun} />;
        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-bulanan-${bulan}-${tahun}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Export PDF berhasil');
      } catch (err) {
        console.error('[KaryawanLaporan] export error:', err);
        toast.error('Gagal mengekspor PDF');
      }
    } else {
      toast.info('Tampilkan data terlebih dahulu sebelum export.');
    }
  };

  const handlePrint = () => {
    handleExportPDF();
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold">Laporan</h1>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="harian">Harian</TabsTrigger>
          <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value="harian" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan Harian</CardTitle>
                <Input type="date" value={tanggal} onChange={(e) => { setTanggal(e.target.value); fetchHarian(e.target.value); }} className="w-auto" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingHarian ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Memuat data...</span>
                </div>
              ) : harianData ? (
                <div className="space-y-6">
                  {/* Main Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard title="Total Pasien" value={harianData.total_pasien || 0} icon={<Users className="h-5 w-5" />} color="bg-blue-50" />
                    <StatCard title="Transaksi" value={harianData.total_invoice || 0} icon={<Receipt className="h-5 w-5" />} color="bg-purple-50" />
                    <StatCard title="Selesai" value={harianData.selesai || 0} icon={<CheckCircle className="h-5 w-5" />} color="bg-green-50" />
                    <StatCard title="Pasien Baru" value={harianData.pasien_baru || 0} icon={<UserPlus className="h-5 w-5" />} color="bg-teal-50" />
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

                  {/* Transactions List */}
                  {harianData.invoices && harianData.invoices.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Daftar Transaksi</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Pasien</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {harianData.invoices.map((inv, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-mono text-xs">{inv.no_invoice}</TableCell>
                                <TableCell>{inv.nama_pasien}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                                <TableCell><StatusBadge status={inv.status} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">Tidak ada data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulanan" className="space-y-4 mt-4">
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
                    {loadingBulanan ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lihat'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBulanan ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Memuat data...</span>
                </div>
              ) : bulananData ? (
                <div className="space-y-6">
                  {/* Main Stats */}
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
                        <p className="text-sm text-emerald-600 uppercase font-medium">Total Pendapatan Bulan Ini</p>
                        <p className="text-3xl font-bold text-emerald-700">{formatCurrency(bulananData.total_pendapatan || 0)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">Klik "Lihat" untuk menampilkan laporan bulanan</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
