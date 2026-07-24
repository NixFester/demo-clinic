'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Loader2, FileText } from 'lucide-react';
import type { PendaftaranListItem } from '@/types/api-items';
import { toast } from 'sonner';

export default function KasirDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<PendaftaranListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async (pageNumber = page) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/pendaftaran/belum-bayar?page=${pageNumber}`);
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Gagal memuat data pendaftaran');
      }
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[KasirDashboardPage] error:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const getStatusLabel = (item: PendaftaranListItem) => {
    if (!item.id_invoice) return 'belum generate invoice';
    if (item.status_invoice === 'belum_bayar') return 'belum bayar';
    return item.status_invoice || 'unknown';
  };

  const getActionLabel = (item: PendaftaranListItem) => {
    if (!item.id_invoice) return 'Generate Invoice';
    if (item.status_invoice === 'belum_bayar') return 'Bayar';
    return 'Lihat';
  };

  const handleAction = async (item: PendaftaranListItem) => {
    if (!item.id_invoice) {
      console.log('Generating invoice for:', item);
      setSubmitting(true);
      try {
        const res = await fetch('/api/invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_pendaftaran: item.id_pendaftaran }),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Gagal generate invoice');
        }
        toast.success('Invoice berhasil digenerate');
        fetchData(page);
      } catch (err) {
        console.error('[KasirDashboardPage] generate error:', err);
        toast.error(err instanceof Error ? err.message : 'Gagal generate invoice');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (item.status_invoice === 'belum_bayar') {
      router.push(`/kasir/view?id=${item.id_invoice}`);
      return;
    }

    router.push(`/kasir/view?id=${item.id_invoice}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kasir</h1>
          <p className="text-sm text-gray-500">Daftar pendaftaran siap proses pembayaran.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pendaftaran Belum Bayar</CardTitle>
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow key="empty">
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Tidak ada data pendaftaran belum bayar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item,index) => (
                      <TableRow key={item.id ?? index}>
                        <TableCell className="font-mono">{item.no_antrian}</TableCell>
                        <TableCell>{item.nama_pasien}</TableCell>
                        <TableCell>
                          <StatusBadge status={getStatusLabel(item)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="inline-flex items-center gap-2"
                            onClick={() => handleAction(item)}
                            disabled={submitting}
                          >
                            <FileText className="h-4 w-4" />
                            {getActionLabel(item)}
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
