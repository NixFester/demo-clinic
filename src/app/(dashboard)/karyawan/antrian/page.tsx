'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/Pagination';
import { Phone, RefreshCw, Loader2, Plus, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AntrianItem {
  id: number;
  no_antrian: number;
  status: string;
  nama_pasien: string;
  no_rekam_medis: string;
  nama_dokter: string;
  nama_layanan: string;
  keluhan_utama: string;
}

function getStatusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    menunggu: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    dipanggil: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
    selesai: { variant: 'secondary', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    batal: { variant: 'secondary', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  };
  const config = map[status] || { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
  return <Badge variant={config.variant} className={config.className}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

export default function KaryawanAntrianPage() {
  const router = useRouter();
  const [data, setData] = useState<AntrianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/antrian');
      const result = await res.json();
      setData(result.data || []);
      setError('');
    } catch (err) {
      console.error('[KaryawanAntrian] Error:', err);
      setError('Gagal memuat data antrian');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStatusUpdate = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/antrian/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Antrian berhasil diupdate ke "${status}"`);
      fetchData();
    } catch (err) {
      toast.error('Gagal mengupdate status antrian');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Antrian Hari Ini</h1>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            onClick={() => router.push('/karyawan/pendaftaran/buat')}
            className="bg-emerald-600 hover:bg-emerald-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Buat Pendaftaran
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Antrian</CardTitle>
          <p className="text-sm text-gray-500">Auto-refresh setiap 30 detik</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data antrian...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada antrian hari ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">No Antrian</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Dokter</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-bold text-lg">{item.no_antrian}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.nama_pasien}</p>
                          <p className="text-xs text-gray-500">{item.no_rekam_medis}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.nama_dokter}</TableCell>
                      <TableCell>{item.nama_layanan}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'menunggu' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(item.id, 'dipanggil')}
                              disabled={updatingId === item.id}
                            >
                              {updatingId === item.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Phone className="h-3 w-3 mr-1" />
                              )}
                              Panggil
                            </Button>
                          )}
                          {item.status === 'dipanggil' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(item.id, 'selesai')}
                              disabled={updatingId === item.id}
                            >
                              {updatingId === item.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : null}
                              Selesai
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
