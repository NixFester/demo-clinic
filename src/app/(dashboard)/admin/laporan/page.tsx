'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, getTodayISO } from '@/lib/helpers';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LaporanHarian {
  total_pendaftaran: number;
  pasien_baru: number;
  pasien_lama: number;
  menunggu: number;
  dipanggil: number;
  selesai: number;
  batal: number;
  pendapatan: number;
  breakdown_metode?: Array<{
    metode_pembayaran: string;
    total: number;
  }>;
}

interface LaporanBulanan {
  total_pendaftaran: number;
  pasien_baru: number;
  pasien_lama: number;
  pendapatan: number;
  breakdown_metode?: Array<{
    metode_pembayaran: string;
    total: number;
  }>;
}

const bulanOptions = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

export default function LaporanPage() {
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
      const res = await fetch(`/api/laporan/harian?tanggal=${t}`);
      const data = await res.json();
      setHarianData(data);
    } catch (err) {
      console.error('[LaporanPage] Harian error:', err);
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
    } finally {
      setLoadingBulanan(false);
    }
  };

  useEffect(() => { fetchHarian(); }, []);

  const handleExport = () => {
    toast.info('Fitur export akan segera tersedia');
  };

  const getMetodeLabel = (metode: string) => {
    const map: Record<string, string> = {
      tunai: 'Tunai',
      transfer: 'Transfer',
      qris: 'QRIS',
      debit: 'Kartu Debit',
      credit: 'Kartu Kredit',
    };
    return map[metode] || metode;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Laporan</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
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
                <div className="flex gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Tanggal</Label>
                    <Input type="date" value={tanggal} onChange={(e) => { setTanggal(e.target.value); fetchHarian(e.target.value); }} className="w-auto" />
                  </div>
                </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Total Pasien</p>
                      <p className="text-2xl font-bold text-blue-700">{harianData.total_pendaftaran || 0}</p>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Pasien Baru</p>
                      <p className="text-2xl font-bold text-teal-700">{harianData.pasien_baru || 0}</p>
                    </div>
                    <div className="p-4 bg-cyan-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Pasien Lama</p>
                      <p className="text-2xl font-bold text-cyan-700">{harianData.pasien_lama || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Selesai</p>
                      <p className="text-2xl font-bold text-green-700">{harianData.selesai || 0}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Pendapatan</p>
                      <p className="text-xl font-bold text-emerald-700">{formatCurrency(harianData.pendapatan || 0)}</p>
                    </div>
                  </div>

                  {harianData.breakdown_metode && harianData.breakdown_metode.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Breakdown Metode Pembayaran</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metode</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {harianData.breakdown_metode.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell>{getMetodeLabel(item.metode_pembayaran)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
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
                  <div className="space-y-1">
                    <Label className="text-xs">Bulan</Label>
                    <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {bulanOptions.map(b => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tahun</Label>
                    <Input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-24" />
                  </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Total Pasien</p>
                      <p className="text-2xl font-bold text-blue-700">{bulananData.total_pendaftaran || 0}</p>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Pasien Baru</p>
                      <p className="text-2xl font-bold text-teal-700">{bulananData.pasien_baru || 0}</p>
                    </div>
                    <div className="p-4 bg-cyan-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Pasien Lama</p>
                      <p className="text-2xl font-bold text-cyan-700">{bulananData.pasien_lama || 0}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Total Pendapatan</p>
                      <p className="text-xl font-bold text-emerald-700">{formatCurrency(bulananData.pendapatan || 0)}</p>
                    </div>
                  </div>

                  {bulananData.breakdown_metode && bulananData.breakdown_metode.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Breakdown Metode Pembayaran</CardTitle></CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metode</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bulananData.breakdown_metode.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell>{getMetodeLabel(item.metode_pembayaran)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">Klik &quot;Lihat&quot; untuk menampilkan laporan bulanan</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
