'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Phone, XCircle, RefreshCw, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface AntrianItem {
  id: number;
  no_antrian: number;
  status: string;
  keluhan_utama: string;
  jenis_kunjungan: string;
  nama_pasien: string;
  no_rekam_medis: string;
  nama_dokter: string;
  nama_layanan: string;
  id_rme: number | null;
  status_rme: string | null;
}

export default function AntrianPage() {
  const { data: session } = useSession();
  const role = (session?.user as unknown as { role?: string })?.role || '';
  const [data, setData] = useState<AntrianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/antrian');
      const result = await res.json();
      setData(result.data || []);
      setError('');
    } catch (err) {
      console.error('[AntrianPage] Error fetching data:', err);
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
    try {
      await fetch(`/api/antrian/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast.success(status === 'dipanggil' ? 'Pasien berhasil dipanggil' : 'Antrian berhasil dibatalkan');
      fetchData();
    } catch (err) {
      toast.error('Gagal mengubah status antrian');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Antrian Hari Ini</h1>
        <button
          onClick={fetchData}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Antrian Aktif</CardTitle>
          <p className="text-sm text-gray-500">Auto-refresh setiap 30 detik</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data antrian...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada antrian hari ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">No. Antrian</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Dokter</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>RME</TableHead>
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
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell>
                        {item.id_rme ? <StatusBadge status={item.status_rme || 'draft'} /> : <span className="text-gray-400 text-sm">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'menunggu' && (role === 'admin' || role === 'karyawan' || role === 'superadmin') && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item.id, 'dipanggil')}>
                              <Phone className="h-3 w-3 mr-1" />
                              Panggil
                            </Button>
                          )}
                          {(item.status === 'menunggu' || item.status === 'dipanggil') && (role === 'admin' || role === 'superadmin') && (
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                              if (confirm('Batalkan antrian ini?')) handleStatusUpdate(item.id, 'batal');
                            }}>
                              <XCircle className="h-3 w-3 mr-1" />
                              Batalkan
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
