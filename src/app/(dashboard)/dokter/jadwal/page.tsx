'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CalendarDays, AlertCircle } from 'lucide-react';

interface JadwalItem {
  id: number;
  nama_dokter: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  is_aktif: number;
}

function getHariLabel(hari: string): string {
  const map: Record<string, string> = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu',
  };
  return map[hari?.toLowerCase()] || hari;
}

const HARI_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DokterJadwalPage() {
  const [data, setData] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const res = await fetch('/api/master/jadwal');
        if (!res.ok) throw new Error('Gagal memuat data jadwal');
        const result = await res.json();
        // Sort by hari order
        const items: JadwalItem[] = result.data || [];
        items.sort((a, b) => {
          const aIdx = HARI_ORDER.indexOf(a.hari?.toLowerCase());
          const bIdx = HARI_ORDER.indexOf(b.hari?.toLowerCase());
          return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
        });
        setData(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalKuota = data.filter((d) => d.is_aktif).reduce((sum, d) => sum + d.kuota, 0);
  const aktifCount = data.filter((d) => d.is_aktif).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Jadwal Saya</h1>
        <p className="text-sm text-gray-500">Jadwal praktik Anda di klinik</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-gray-500">Memuat data jadwal...</span>
        </div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Belum ada jadwal praktik</p>
              <p className="text-sm text-gray-400 mt-1">Hubungi admin untuk mengatur jadwal Anda</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl text-emerald-600 bg-emerald-50">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hari Praktik Aktif</p>
                    <p className="text-2xl font-bold">{aktifCount} <span className="text-sm font-normal text-gray-400">hari</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl text-blue-600 bg-blue-50">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Kuota Per Minggu</p>
                    <p className="text-2xl font-bold">{totalKuota} <span className="text-sm font-normal text-gray-400">pasien</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jadwal Praktik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hari</TableHead>
                      <TableHead>Jam Mulai</TableHead>
                      <TableHead>Jam Selesai</TableHead>
                      <TableHead className="text-center">Kuota</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.id} className={!item.is_aktif ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{getHariLabel(item.hari)}</TableCell>
                        <TableCell>{item.jam_mulai}</TableCell>
                        <TableCell>{item.jam_selesai}</TableCell>
                        <TableCell className="text-center">{item.kuota}</TableCell>
                        <TableCell className="text-center">
                          {item.is_aktif ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                              Tidak Aktif
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
