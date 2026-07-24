'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/helpers';
import { RMEDetail } from '@/types/api-items';

export default function RMEDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id') as string;
  const [rme, setRme] = useState<RMEDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRme = async () => {
      try {
        const res = await fetch(`/api/rme/${id}`);
        const data = await res.json();
        setRme(data);
      } catch (err) {
        console.error('[RMEDetailPage] Error:', err);
        setError('Gagal memuat data RME');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRme();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-2 text-gray-500">Memuat data RME...</span>
    </div>
  );

  if (error || !rme) return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
      </Button>
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error || 'RME tidak ditemukan'}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">RME - {rme.nama_pasien}</h1>
            <p className="text-sm text-gray-500">Dokter: {rme.nama_dokter} | {(rme.updated_at && formatDateTime(rme.updated_at))}</p>
          </div>
        </div>
        <StatusBadge status={rme.status} />
      </div>

      {/* SOAP Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Catatan SOAP</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">S - Subjektif</h4>
            <p className="text-sm whitespace-pre-wrap">{rme.subjektif || '-'}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">O - Objektif</h4>
            <p className="text-sm whitespace-pre-wrap">{rme.objektif || '-'}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">A - Assesment</h4>
            <p className="text-sm whitespace-pre-wrap">{rme.assesment || '-'}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">P - Plan</h4>
            <p className="text-sm whitespace-pre-wrap">{rme.plan || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosa */}
      <Card>
        <CardHeader><CardTitle className="text-base">Diagnosa (ICD-10)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Diagnosa Utama: </span>
            <span className="text-sm font-medium">
              {rme.kode_diagnosa_utama ? `${rme.kode_diagnosa_utama} - ${rme.nama_diagnosa_utama}` : '-'}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Diagnosa Sekunder: </span>
            <span className="text-sm font-medium">
              {rme.kode_diagnosa_sekunder ? `${rme.kode_diagnosa_sekunder} - ${rme.nama_diagnosa_sekunder}` : '-'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Kondisi & Tindak Lanjut */}
      <Card>
        <CardHeader><CardTitle className="text-base">Kondisi & Tindak Lanjut</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Kondisi Masuk:</span>
              <p className="text-sm font-medium">{rme.kondisi_masuk || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Kondisi Keluar:</span>
              <p className="text-sm font-medium">{rme.kondisi_keluar || '-'}</p>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Instruksi Tindak Lanjut:</span>
            <p className="text-sm font-medium whitespace-pre-wrap">{rme.instruksi_tindak_lanjut || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tindakan */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tindakan</CardTitle></CardHeader>
        <CardContent>
          {!rme.tindakan || rme.tindakan.length === 0 ? (
            <p className="text-center py-4 text-gray-500 text-sm">Tidak ada tindakan</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rme.tindakan.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.nama_layanan}</TableCell>
                    <TableCell>{t.keterangan || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.harga_saat_itu)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resep */}
      <Card>
        <CardHeader><CardTitle className="text-base">Resep</CardTitle></CardHeader>
        <CardContent>
          {!rme.resep || rme.resep.items.length === 0 ? (
            <p className="text-center py-4 text-gray-500 text-sm">Tidak ada resep</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Aturan Pakai</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rme.resep.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nama_produk}</TableCell>
                    <TableCell>{item.jumlah}</TableCell>
                    <TableCell>{item.dosis || '-'}</TableCell>
                    <TableCell>{item.aturan_pakai || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.harga_jual)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.harga_jual * item.jumlah)}</TableCell>
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
