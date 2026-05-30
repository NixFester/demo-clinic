'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Phone, PhoneCall, XCircle, FileText, RefreshCw, Loader2, ClipboardList, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { AntrianItem } from '@/types/api-items';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  menunggu:  'bg-yellow-100 text-yellow-800 border-yellow-300',
  dipanggil: 'bg-blue-100   text-blue-800   border-blue-300',
  selesai:   'bg-green-100  text-green-800  border-green-300',
  batal:     'bg-red-100    text-red-800    border-red-300',
  draft:     'bg-gray-100   text-gray-800   border-gray-300',
  final:     'bg-green-100  text-green-800  border-green-300',
};

const STATUS_LABEL: Record<string, string> = {
  menunggu:  'Menunggu',
  dipanggil: 'Dipanggil',
  selesai:   'Selesai',
  batal:     'Batal',
  draft:     'Draft',
  final:     'Final',
};

function StatusChip({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-800 border-gray-300'}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function isAdmin(role: string)      { return role === 'admin' || role === 'superadmin'; }
function isStaff(role: string)      { return role === 'karyawan' || isAdmin(role); }
function isDokter(role: string)     { return role === 'dokter'; }

// ─── Component ──────────────────────────────────────────────────────────────

export default function AntrianPage() {
  const router                  = useRouter();
  const { data: session }       = useSession();
  const role: string            = (session?.user as unknown as { role?: string })?.role ?? '';

  const [data,       setData]       = useState<AntrianItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [busyId,     setBusyId]     = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const res    = await fetch('/api/antrian');
      if (!res.ok) throw new Error('Gagal memuat data antrian');
      const result = await res.json();
      setData(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/antrian/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Gagal mengubah status');
      }
      const labels: Record<string, string> = {
        dipanggil: 'Pasien berhasil dipanggil',
        selesai:   'Antrian selesai',
        batal:     'Antrian dibatalkan',
      };
      toast.success(labels[status] ?? 'Status diperbarui');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status antrian');
    } finally {
      setBusyId(null);
    }
  };

  const goToRME = (id: string) => router.push(`/dokter/rme/${parseInt(id)}`);

  // ── Row actions (role-aware) ──────────────────────────────────────────────

  function RowActions({ item }: { item: AntrianItem }) {
    const busy = busyId === item.id;

    return (
      <div className="flex items-center justify-end gap-2">

        {/* PANGGIL — admin / karyawan / dokter on 'menunggu' */}
        {item.status === 'menunggu' && (isStaff(role) || isDokter(role)) && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => updateStatus(item.id, 'dipanggil')}
          >
            {busy
              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              : isDokter(role)
                ? <PhoneCall className="h-3 w-3 mr-1" />
                : <Phone     className="h-3 w-3 mr-1" />}
            Panggil
          </Button>
        )}

        {/* SELESAI — karyawan only on 'dipanggil' */}
        {item.status === 'dipanggil' && role === 'karyawan' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => updateStatus(item.id, 'selesai')}
          >
            {busy && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Selesai
          </Button>
        )}

        {/* BUAT RME — dokter only on 'dipanggil' */}
        {item.status === 'dipanggil' && isDokter(role) && (
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            onClick={() => goToRME(item.id_pendaftaran ?? item.id)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Buat RME
          </Button>
        )}

        {/* LIHAT RME — dokter only on 'selesai' */}
        {item.status === 'selesai' && isDokter(role) && item.id_rme && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/dokter/rme/${item.id_rme}`)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Lihat RME
          </Button>
        )}

        {/* BATALKAN — admin / superadmin only */}
        {(item.status === 'menunggu' || item.status === 'dipanggil') && isAdmin(role) && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={busy}
            onClick={() => {
              if (confirm('Batalkan antrian ini?')) updateStatus(item.id, 'batal');
            }}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Batalkan
          </Button>
        )}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const showRMEColumn  = isAdmin(role);
  const showDokterCol  = !isDokter(role);   // doctor already knows who they are
  const showKeluhan    = isDokter(role);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isDokter(role) ? 'Antrian Saya Hari Ini' : 'Antrian Hari Ini'}
          </h1>
          <p className="text-sm text-gray-500">Auto-refresh setiap 30 detik</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            {loading
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <RefreshCw className="h-4 w-4 mr-1" />}
            Refresh
          </Button>

          {/* Karyawan shortcut */}
          {role === 'karyawan' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push('/karyawan/pendaftaran/buat')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Buat Pendaftaran
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isDokter(role) ? 'Daftar Antrian' : 'Antrian Aktif'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data antrian...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada antrian hari ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">No. Antrian</TableHead>
                    <TableHead>Pasien</TableHead>
                    {showDokterCol  && <TableHead>Dokter</TableHead>}
                    <TableHead>Layanan</TableHead>
                    {showKeluhan    && <TableHead>Keluhan</TableHead>}
                    <TableHead>Status</TableHead>
                    {showRMEColumn  && <TableHead>RME</TableHead>}
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-bold text-lg">{item.no_antrian}</TableCell>

                      <TableCell>
                        <p className="font-medium">{item.nama_pasien}</p>
                        <p className="text-xs text-gray-500">{item.no_rekam_medis}</p>
                      </TableCell>

                      {showDokterCol  && <TableCell>{item.nama_dokter}</TableCell>}
                      <TableCell>{item.nama_layanan}</TableCell>
                      {showKeluhan    && (
                        <TableCell className="max-w-[200px] truncate">
                          {item.keluhan_utama ?? '-'}
                        </TableCell>
                      )}

                      <TableCell>
                        <StatusChip status={item.status} />
                      </TableCell>

                      {showRMEColumn && (
                        <TableCell>
                          {item.id_rme
                            ? <StatusBadge status={item.status_rme ?? 'draft'} />
                            : <span className="text-gray-400 text-sm">-</span>}
                        </TableCell>
                      )}

                      <TableCell className="text-right">
                        <RowActions item={item} />
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