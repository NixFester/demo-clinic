'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';
import { formatDateTime } from '@/lib/helpers';
import { RMEListItem } from '@/types/api-items';

export default function RMEListPage() {
  const [data, setData] = useState<RMEListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/rme?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[RMEListPage] Error:', err);
      setError('Gagal memuat data RME');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rekam Medis Elektronik</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Daftar RME</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data</TableCell></TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_pasien}</TableCell>
                      <TableCell>{item.nama_dokter}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell>{(item.updated_at && formatDateTime(item.updated_at) || item.created_at && formatDateTime(item.created_at))}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/rme/view?id=${item.id}`)}>
                          <Eye className="h-4 w-4 mr-1" /> Lihat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
