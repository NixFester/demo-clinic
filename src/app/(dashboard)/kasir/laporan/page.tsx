'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Loader2, Eye } from 'lucide-react';
import type { PendaftaranListItem } from '@/types/api-items';
import { toast } from 'sonner';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Pembayaran</h1>
          <p className="text-sm text-gray-500">Daftar pendaftaran lunas untuk laporan kasir.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pendaftaran Lunas</CardTitle>
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
                        Tidak ada laporan pembayaran.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item,index) => (
                      <TableRow key={item.id ?? index}>
                        <TableCell className="font-mono">{item.no_antrian}</TableCell>
                        <TableCell>{item.nama_pasien}</TableCell>
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
