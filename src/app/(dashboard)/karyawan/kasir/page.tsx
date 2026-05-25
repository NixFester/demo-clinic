'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/Pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, FileText, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';

interface InvoiceItem {
  id: number;
  no_invoice: string;
  total: number;
  dibayar: number;
  status: string;
  created_at: string;
  nama_pasien: string;
}

interface PendaftaranSelesai {
  id: number;
  no_antrian: number;
  nama_pasien: string;
  nama_layanan: string;
  nama_dokter: string;
  total: number;
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

export default function KaryawanKasirPage() {
  const router = useRouter();
  const [data, setData] = useState<InvoiceItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [pendaftaranList, setPendaftaranList] = useState<PendaftaranSelesai[]>([]);
  const [selectedPendaftaran, setSelectedPendaftaran] = useState('');
  const [loadingPendaftaran, setLoadingPendaftaran] = useState(false);

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/invoice?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[KaryawanKasir] Error:', err);
      setError('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const fetchPendaftaran = async () => {
    setLoadingPendaftaran(true);
    try {
      const res = await fetch('/api/pendaftaran?status=selesai&tanpa_invoice=true');
      const result = await res.json();
      setPendaftaranList(result.data || []);
    } catch (err) {
      console.error('[KaryawanKasir] Pendaftaran error:', err);
      toast.error('Gagal memuat daftar pendaftaran');
    } finally {
      setLoadingPendaftaran(false);
    }
  };

  const handleOpenGenerate = () => {
    setGenerateDialogOpen(true);
    fetchPendaftaran();
  };

  const handleGenerateInvoice = async () => {
    if (!selectedPendaftaran) {
      toast.error('Pilih pendaftaran terlebih dahulu');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pendaftaran: parseInt(selectedPendaftaran) }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Invoice berhasil digenerate');
        setGenerateDialogOpen(false);
        setSelectedPendaftaran('');
        fetchData();
      } else {
        toast.error(result.error || 'Gagal generate invoice');
      }
    } catch (err) {
      toast.error('Gagal generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate_from_pendaftaran: true }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Invoice berhasil digenerate');
        setGenerateDialogOpen(false);
        fetchData();
      } else {
        toast.error(result.error || 'Tidak ada pendaftaran yang memerlukan invoice');
      }
    } catch (err) {
      toast.error('Gagal generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kasir</h1>
        <Button onClick={handleOpenGenerate} className="bg-emerald-600 hover:bg-emerald-700">
          <FileText className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Invoice</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Dibayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">Tidak ada invoice</TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.no_invoice}</TableCell>
                        <TableCell className="font-medium">{item.nama_pasien}</TableCell>
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                        <TableCell>{formatCurrency(item.dibayar || 0)}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/karyawan/kasir/${item.id}`)}>
                            <Eye className="h-4 w-4 mr-1" /> Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Generate Invoice Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Pendaftaran yang Selesai</label>
              {loadingPendaftaran ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Memuat...</span>
                </div>
              ) : pendaftaranList.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
                  Tidak ada pendaftaran selesai tanpa invoice
                </div>
              ) : (
                <select
                  value={selectedPendaftaran}
                  onChange={(e) => setSelectedPendaftaran(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih pendaftaran...</option>
                  {pendaftaranList.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.no_antrian} - {p.nama_pasien} ({p.nama_layanan})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">atau</span>
              </div>
            </div>

            <Button
              onClick={handleAutoGenerate}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={generating}
            >
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Auto Generate Semua
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handleGenerateInvoice}
                disabled={!selectedPendaftaran || generating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Generate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
