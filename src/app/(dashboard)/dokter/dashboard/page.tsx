'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, PhoneCall, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface AntrianItem {
  id: number;
  no_antrian: number;
  status: string;
  keluhan_utama: string;
  nama_pasien: string;
  no_rekam_medis: string;
  nama_layanan: string;
}

interface DashboardStats {
  total: number;
  menunggu: number;
  dipanggil: number;
  selesai: number;
}

export default function DokterDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, menunggu: 0, dipanggil: 0, selesai: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/antrian');
      if (!res.ok) throw new Error('Gagal memuat data antrian');
      const data = await res.json();
      const items: AntrianItem[] = data.data || [];
      setStats({
        total: items.length,
        menunggu: items.filter((i) => i.status === 'menunggu').length,
        dipanggil: items.filter((i) => i.status === 'dipanggil').length,
        selesai: items.filter((i) => i.status === 'selesai').length,
      });
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const cards = [
    {
      title: 'Total Antrian Saya',
      value: stats.total,
      icon: <ClipboardList className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      title: 'Menunggu',
      value: stats.menunggu,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-yellow-600 bg-yellow-50',
      border: 'border-yellow-200',
    },
    {
      title: 'Dipanggil',
      value: stats.dipanggil,
      icon: <PhoneCall className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-50',
      border: 'border-blue-200',
    },
    {
      title: 'Selesai',
      value: stats.selesai,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-green-600 bg-green-50',
      border: 'border-green-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Dokter</h1>
          <p className="text-gray-500">Selamat datang, {session?.user?.name || 'Dokter'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs text-gray-500">
            <RefreshCw className="h-3 w-3 mr-1" />
            Terakhir: {formatTime(lastRefresh)}
          </Badge>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh data"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
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
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <Card key={card.title} className={`border ${card.border}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${card.color}`}>{card.icon}</div>
                    <div>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <ClipboardList className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Antrian Hari Ini</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Data antrian diperbarui otomatis setiap 30 detik. Anda memiliki{' '}
                    <span className="font-semibold text-yellow-600">{stats.menunggu} antrian menunggu</span> dan{' '}
                    <span className="font-semibold text-blue-600">{stats.dipanggil} antrian dipanggil</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
