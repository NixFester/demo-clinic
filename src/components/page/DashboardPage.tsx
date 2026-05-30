'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, Phone, PhoneCall, CheckCircle, Wallet, FileText, RefreshCw, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/helpers';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AntrianRaw {
  status: string;
}

interface DashboardStats {
  total_antrian:    number;
  menunggu:         number;
  dipanggil:        number;
  selesai:          number;
  // karyawan + admin
  total_pendapatan: number;
  // karyawan only
  invoice_menunggu: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────


function isAdmin(role: string)  { return role === 'admin' || role === 'superadmin'; }
function isDokter(role: string) { return role === 'dokter'; }

const EMPTY: DashboardStats = {
  total_antrian: 0, menunggu: 0, dipanggil: 0,
  selesai: 0, total_pendapatan: 0, invoice_menunggu: 0,
};

function formatTime(date: Date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session }  = useSession();
  const role: string       = (session?.user as unknown as { role?: string })?.role ?? '';
  const name: string       = session?.user?.name ?? '';

  const [stats,       setStats]       = useState<DashboardStats>(EMPTY);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      setError('');

      // Always fetch antrian
      const fetches: Promise<Response>[] = [fetch('/api/antrian')];

      // Admin + karyawan need laporan
      if (!isDokter(role)) fetches.push(fetch('/api/laporan/harian'));

      // Karyawan also needs invoice
      if (role === 'karyawan') fetches.push(fetch('/api/invoice?status=belum_bayar'));

      const responses = await Promise.all(fetches);
      const [antrianRes, laporanRes, invoiceRes] = responses;

      const antrianData = await antrianRes.json();
      const antrianList: AntrianRaw[] = antrianData.data ?? [];

      const menunggu  = antrianList.filter((a) => a.status === 'menunggu').length;
      const dipanggil = antrianList.filter((a) => a.status === 'dipanggil').length;
      const selesai   = antrianList.filter((a) => a.status === 'selesai').length;

      let total_pendapatan = 0;
      let invoice_menunggu = 0;

      if (laporanRes) {
        const laporanData = await laporanRes.json();
        total_pendapatan = laporanData.total_pendapatan ?? 0;
      }
      if (invoiceRes) {
        const invoiceData = await invoiceRes.json();
        invoice_menunggu = (invoiceData.data ?? []).length;
      }

      setStats({ total_antrian: antrianList.length, menunggu, dipanggil, selesai, total_pendapatan, invoice_menunggu });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[Dashboard] Error:', err);
      setError('Gagal memuat data dashboard');
      setStats(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (!role) return; // wait for session
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats, role]);

  // ── Card definitions (role-aware) ─────────────────────────────────────────

  type StatCard = { title: string; value: string | number; icon: React.ReactNode; color: string; border?: string };

  const baseCards: StatCard[] = [
    { title: 'Total Antrian' + (isDokter(role) ? ' Saya' : ''), value: stats.total_antrian, icon: <ClipboardList className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50',    border: 'border-blue-200' },
    { title: 'Menunggu',                                          value: stats.menunggu,      icon: <Clock         className="h-5 w-5" />, color: 'text-yellow-600 bg-yellow-50', border: 'border-yellow-200' },
    { title: 'Dipanggil',                                         value: stats.dipanggil,     icon: isDokter(role) ? <PhoneCall className="h-5 w-5" /> : <Phone className="h-5 w-5" />, color: 'text-sky-600 bg-sky-50', border: 'border-sky-200' },
    { title: 'Selesai',                                           value: stats.selesai,       icon: <CheckCircle   className="h-5 w-5" />, color: 'text-green-600 bg-green-50',  border: 'border-green-200' },
  ];

  // Karyawan extra cards
  const karyawanCards: StatCard[] = role === 'karyawan' ? [
    { title: 'Invoice Menunggu Bayar', value: stats.invoice_menunggu,               icon: <FileText className="h-5 w-5" />, color: 'text-orange-600 bg-orange-50', border: 'border-orange-200' },
    { title: 'Pendapatan Hari Ini',    value: formatCurrency(stats.total_pendapatan), icon: <Wallet   className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-200' },
  ] : [];

  // Admin extra card
  const adminCards: StatCard[] = isAdmin(role) ? [
    { title: 'Pendapatan Hari Ini', value: formatCurrency(stats.total_pendapatan), icon: <Wallet className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-200' },
  ] : [];

  const cards: StatCard[] = [...baseCards, ...karyawanCards, ...adminCards];

  // ── Grid cols ─────────────────────────────────────────────────────────────
  // admin: 5 cards → lg:grid-cols-5
  // dokter: 4 cards → lg:grid-cols-4
  // karyawan: 6 cards → lg:grid-cols-3
  const gridCols = isAdmin(role)
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
    : isDokter(role)
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  // ── Title / greeting ──────────────────────────────────────────────────────
  const title = isAdmin(role) ? 'Dashboard Admin'
    : isDokter(role)          ? 'Dashboard Dokter'
    :                           'Dashboard Karyawan';

  const greeting = isDokter(role) || role === 'karyawan'
    ? `Selamat datang, ${name || (isDokter(role) ? 'Dokter' : 'Karyawan')}`
    : null;

  // ── Info blurb ────────────────────────────────────────────────────────────
  const infoCopy = isDokter(role)
    ? <>Data antrian diperbarui otomatis setiap 30 detik. Anda memiliki{' '}
        <span className="font-semibold text-yellow-600">{stats.menunggu} antrian menunggu</span> dan{' '}
        <span className="font-semibold text-blue-600">{stats.dipanggil} antrian dipanggil</span>.</>
    : isAdmin(role)
      ? 'Selamat datang di SIMKlinik. Gunakan menu di sebelah kiri untuk mengelola klinik Anda. Data antrian otomatis diperbarui setiap 30 detik.'
      : 'Data antrian dan invoice otomatis diperbarui setiap 30 detik. Gunakan menu di sebelah kiri untuk mengelola klinik.';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {greeting && <p className="text-gray-500">{greeting}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Dokter shows last-refresh timestamp */}
          {isDokter(role) && (
            <Badge variant="outline" className="text-xs text-gray-500">
              <RefreshCw className="h-3 w-3 mr-1" />
              Terakhir: {formatTime(lastRefresh)}
            </Badge>
          )}

          <button
            onClick={fetchStats}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            {!isDokter(role) && 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stat cards */}
      {loading && !stats.total_antrian ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Memuat data dashboard...</span>
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-4`}>
          {cards.map((card) => (
            <Card key={card.title} className={card.border ? `border ${card.border}` : undefined}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>{card.icon}</div>
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : card.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info blurb */}
      <Card>
        {isAdmin(role) && (
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan Hari Ini</CardTitle>
          </CardHeader>
        )}
        <CardContent className={isAdmin(role) ? undefined : 'p-6'}>
          <div className={isDokter(role) ? 'flex items-start gap-3' : undefined}>
            {isDokter(role) && <ClipboardList className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />}
            <div>
              {isDokter(role) && <h3 className="font-medium text-gray-900">Antrian Hari Ini</h3>}
              <p className={`text-gray-500 ${isDokter(role) ? 'text-sm mt-1' : 'text-sm'}`}>{infoCopy}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}