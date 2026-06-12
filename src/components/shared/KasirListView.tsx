'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, FileText, Plus, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';

interface InvoiceListItem {
  id: number;
  no_invoice: string;
  total: number;
  // API field name differs between admin (total_dibayar) and karyawan (dibayar);
  // we normalise both at fetch time into total_dibayar.
  total_dibayar: number;
  status: string;
  created_at: string;
  nama_pasien: string;
}

interface PendaftaranSelesai {
  id: number;
  no_antrian: number;
  nama_pasien: string;
  nama_layanan: string;
}

interface KasirListViewProps {
  /** Base path for the detail page, e.g. "/admin/kasir" or "/karyawan/kasir" */
  basePath: string;
  /**
   * When true (karyawan), the Generate button opens a dialog that lets the
   * user pick a specific pendaftaran or auto-generate all.
   * When false (admin), the button immediately auto-generates all.
   */
  showGenerateDialog?: boolean;
}

export default function KasirListView({ basePath, showGenerateDialog = true }: KasirListViewProps) {
  const router = useRouter();

  const [data, setData] = useState<InvoiceListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Generate dialog state (only used when showGenerateDialog=true)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendaftaranList, setPendaftaranList] = useState<PendaftaranSelesai[]>([]);
  const [selectedPendaftaran, setSelectedPendaftaran] = useState('');
  const [loadingPendaftaran, setLoadingPendaftaran] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/invoice?page=${p}`);
      const result = await res.json();
      // Normalise field name: karyawan API returns `dibayar`, admin returns `total_dibayar`
      const normalised = (result.data || []).map((item: Record<string, unknown>) => ({
        ...item,
        total_dibayar: (item.total_dibayar ?? item.dibayar ?? 0) as number,
      }));
      setData(normalised);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[KasirListView] Error:', err);
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
      console.error('[KasirListView] Pendaftaran error:', err);
      toast.error('Gagal memuat daftar pendaftaran');
    } finally {
      setLoadingPendaftaran(false);
    }
  };

  // ─── Generate handlers ────────────────────────────────────────────────────

  /** Auto-generate all pending invoices (used directly by admin, and as a
   *  secondary option inside the karyawan dialog). */
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
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error(result.error || 'Tidak ada pendaftaran yang memerlukan invoice');
      }
    } catch {
      toast.error('Gagal generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  /** Generate invoice for a specific pendaftaran (karyawan dialog only). */
  const handleGenerateSelected = async () => {
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
        setDialogOpen(false);
        setSelectedPendaftaran('');
        fetchData();
      } else {
        toast.error(result.error || 'Gagal generate invoice');
      }
    } catch {
      toast.error('Gagal generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateButtonClick = () => {
    if (showGenerateDialog) {
      setDialogOpen(true);
      fetchPendaftaran();
    } else {
      handleAutoGenerate();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kasir</h1>
        <Button
          onClick={handleGenerateButtonClick}
          disabled={generating && !showGenerateDialog}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {generating && !showGenerateDialog
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            : <FileText className="h-4 w-4 mr-2" />
          }
          Generate Invoice
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
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
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Tidak ada invoice
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.no_invoice}</TableCell>
                        <TableCell className="font-medium">{item.nama_pasien}</TableCell>
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                        <TableCell>{formatCurrency(item.total_dibayar)}</TableCell>
                        <TableCell><StatusBadge status={item.status} /></TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={
                              item.total_dibayar > 0
                                ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
                                : 'text-green-600 hover:bg-green-50 hover:text-green-700 cursor-pointer'
                            }
                            onClick={() => router.push(`${basePath}/${item.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {item.total_dibayar > 0 ? 'Lihat' : 'Bayar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.open(`/print/invoice/${item.id}`, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Cetak
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

      {/* Generate Invoice Dialog — karyawan only */}
      {showGenerateDialog && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                {generating
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <Plus className="h-4 w-4 mr-2" />
                }
                Auto Generate Semua
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleGenerateSelected}
                  disabled={!selectedPendaftaran || generating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
