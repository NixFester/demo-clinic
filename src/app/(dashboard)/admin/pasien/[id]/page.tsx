'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/helpers';

interface PasienDetail {
  id: number;
  no_rekam_medis: string;
  nik: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  alamat: string;
  no_telepon: string;
  no_whatsapp: string;
  golongan_darah: string;
  alergi: string;
  catatan_kulit: string;
}

interface RiwayatItem {
  id: number;
  tanggal: string;
  no_antrian: number;
  status: string;
  jenis_kunjungan: string;
  keluhan_utama: string;
  nama_dokter: string;
  nama_layanan: string;
  total: number;
  status_invoice: string;
}

export default function PasienDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [pasien, setPasien] = useState<PasienDetail | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/pasien/${id}`);
        const data = await res.json();
        setPasien(data);
        setRiwayat(data.riwayat_kunjungan || data.kunjungan || []);
      } catch (err) {
        console.error('[PasienDetailPage] Error:', err);
        setError('Gagal memuat data pasien');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-2 text-gray-500">Memuat data pasien...</span>
    </div>
  );

  if (error) return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push('/admin/pasien')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
      </Button>
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
    </div>
  );

  if (!pasien) return (
    <div className="text-center py-16 text-gray-500">Pasien tidak ditemukan</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/pasien')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Pasien</h1>
          <p className="text-sm text-gray-500">{pasien.no_rekam_medis} - {pasien.nama_lengkap}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Pribadi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="No. Rekam Medis" value={pasien.no_rekam_medis} />
            <InfoRow label="NIK" value={pasien.nik} />
            <InfoRow label="Nama Lengkap" value={pasien.nama_lengkap} />
            <InfoRow label="Tempat, Tanggal Lahir" value={`${pasien.tempat_lahir || '-'}, ${pasien.tanggal_lahir ? formatDate(pasien.tanggal_lahir) : '-'}`} />
            <InfoRow label="Jenis Kelamin" value={pasien.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
            <InfoRow label="Alamat" value={pasien.alamat || '-'} />
            <InfoRow label="No. Telepon" value={pasien.no_telepon || '-'} />
            <InfoRow label="No. WhatsApp" value={pasien.no_whatsapp || '-'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Medis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Golongan Darah" value={pasien.golongan_darah || '-'} />
            <InfoRow label="Alergi" value={pasien.alergi || '-'} />
            <InfoRow label="Catatan Kulit" value={pasien.catatan_kulit || '-'} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Riwayat Kunjungan</CardTitle></CardHeader>
        <CardContent>
          {riwayat.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Belum ada riwayat kunjungan</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Antrian</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Keluhan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riwayat.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.tanggal ? formatDateTime(item.tanggal) : '-'}</TableCell>
                    <TableCell className="font-mono">{item.no_antrian}</TableCell>
                    <TableCell>{item.nama_dokter || '-'}</TableCell>
                    <TableCell>{item.nama_layanan || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.keluhan_utama || '-'}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell>{item.total ? formatCurrency(item.total) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
