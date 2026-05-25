'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PhoneCall, FileText, RefreshCw, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

interface AntrianItem {
  id: number;
  id_pendaftaran: number;
  no_antrian: number;
  status: string;
  keluhan_utama: string;
  nama_pasien: string;
  no_rekam_medis: string;
  nama_layanan: string;
  id_rme: number | null;
  status_rme: string | null;
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dipanggil: 'bg-blue-100 text-blue-800 border-blue-300',
    selesai: 'bg-green-100 text-green-800 border-green-300',
    batal: 'bg-red-100 text-red-800 border-red-300',
    draft: 'bg-gray-100 text-gray-800 border-gray-300',
    final: 'bg-green-100 text-green-800 border-green-300',
  };
  return map[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    menunggu: 'Menunggu',
    dipanggil: 'Dipanggil',
    selesai: 'Selesai',
    batal: 'Batal',
    draft: 'Draft',
    final: 'Final',
  };
  return map[status] || status;
}

export default function DokterAntrianPage() {
  const router = useRouter();
  const [data, setData] = useState<AntrianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/antrian');
      if (!res.ok) throw new Error('Gagal memuat data antrian');
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePanggil = async (id: number) => {
    setCallingId(id);
    try {
      const res = await fetch(`/api/antrian/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dipanggil' }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal memanggil pasien');
      }
      toast.success('Pasien berhasil dipanggil');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memanggil pasien');
    } finally {
      setCallingId(null);
    }
  };

  const handleBuatRME = (idPendaftaran: number) => {
    router.push(`/dokter/rme/buat/${idPendaftaran}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Antrian Saya Hari Ini</h1>
          <p className="text-sm text-gray-500">Auto-refresh setiap 30 detik</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-gray-500">Memuat data antrian...</span>
        </div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Tidak ada antrian hari ini</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Antrian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">No Antrian</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Keluhan</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="text-right w-48">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-mono font-bold text-lg">{item.no_antrian}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.nama_pasien}</p>
                          <p className="text-xs text-gray-500">{item.no_rekam_medis}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.nama_layanan}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.keluhan_utama || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'menunggu' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePanggil(item.id)}
                              disabled={callingId === item.id}
                            >
                              {callingId === item.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <PhoneCall className="h-3 w-3 mr-1" />
                              )}
                              Panggil
                            </Button>
                          )}
                          {item.status === 'dipanggil' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBuatRME(item.id_pendaftaran || item.id)}
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Buat RME
                            </Button>
                          )}
                          {item.status === 'selesai' && item.id_rme && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/dokter/rme/${item.id_rme}`)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Lihat RME
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
