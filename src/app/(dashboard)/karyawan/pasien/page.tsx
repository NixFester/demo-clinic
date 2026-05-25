'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/Pagination';
import { SearchInput } from '@/components/shared/SearchInput';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, Plus } from 'lucide-react';
import { formatDate } from '@/lib/helpers';

interface Pasien {
  id: number;
  no_rekam_medis: string;
  nik: string;
  nama_lengkap: string;
  no_telepon: string;
  no_whatsapp: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
}

export default function KaryawanPasienPage() {
  const router = useRouter();
  const [data, setData] = useState<Pasien[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async (p = page, q = search) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set('q', q);
      const res = await fetch(`/api/pasien?${params}`);
      const result = await res.json();
      setData(result.data || []);
      setTotal(result.total || 0);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[KaryawanPasien] Error:', err);
      setError('Gagal memuat data pasien');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchData(1, value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daftar Pasien</h1>
        <Button
          onClick={() => router.push('/karyawan/pasien/buat')}
          className="bg-emerald-600 hover:bg-emerald-700"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Tambah Pasien
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Total: {total} pasien</CardTitle>
          <SearchInput value={search} onChange={handleSearch} placeholder="Cari nama/NIK..." />
        </CardHeader>
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
                    <TableHead>No. RM</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>WA</TableHead>
                    <TableHead>Tgl Lahir</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">Tidak ada data pasien</TableCell>
                    </TableRow>
                  ) : (
                    data.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.no_rekam_medis}</TableCell>
                        <TableCell>{p.nik}</TableCell>
                        <TableCell className="font-medium">{p.nama_lengkap}</TableCell>
                        <TableCell>{p.no_telepon || '-'}</TableCell>
                        <TableCell>{p.no_whatsapp || '-'}</TableCell>
                        <TableCell>{p.tanggal_lahir ? formatDate(p.tanggal_lahir) : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/karyawan/pasien/${p.id}`)}>
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
    </div>
  );
}
