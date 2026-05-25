'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Clock, Phone, CheckCircle, Wallet, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

interface DashboardStats {
  total_antrian: number;
  menunggu: number;
  dipanggil: number;
  selesai: number;
  pendapatan: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const [antrianRes, laporanRes] = await Promise.all([
        fetch('/api/antrian'),
        fetch('/api/laporan/harian'),
      ]);
      const antrianData = await antrianRes.json();
      const laporanData = await laporanRes.json();

      const antrianList = antrianData.data || [];
      const menunggu = antrianList.filter((a: { status: string }) => a.status === 'menunggu').length;
      const dipanggil = antrianList.filter((a: { status: string }) => a.status === 'dipanggil').length;
      const selesai = antrianList.filter((a: { status: string }) => a.status === 'selesai').length;

      setStats({
        total_antrian: antrianList.length,
        menunggu,
        dipanggil,
        selesai,
        pendapatan: laporanData.pendapatan || 0,
      });
      setError('');
    } catch (err) {
      console.error('[AdminDashboard] Error:', err);
      setError('Gagal memuat data dashboard');
      setStats({ total_antrian: 0, menunggu: 0, dipanggil: 0, selesai: 0, pendapatan: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const cards = [
    { title: 'Total Antrian', value: stats?.total_antrian ?? '-', icon: <ClipboardList className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50' },
    { title: 'Menunggu', value: stats?.menunggu ?? '-', icon: <Clock className="h-5 w-5" />, color: 'text-yellow-600 bg-yellow-50' },
    { title: 'Dipanggil', value: stats?.dipanggil ?? '-', icon: <Phone className="h-5 w-5" />, color: 'text-sky-600 bg-sky-50' },
    { title: 'Selesai', value: stats?.selesai ?? '-', icon: <CheckCircle className="h-5 w-5" />, color: 'text-green-600 bg-green-50' },
    { title: 'Pendapatan Hari Ini', value: stats ? formatCurrency(stats.pendapatan) : '-', icon: <Wallet className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <button
          onClick={fetchStats}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  {card.icon}
                </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Selamat datang di SIMKlinik. Gunakan menu di sebelah kiri untuk mengelola klinik Anda.
            Data antrian otomatis diperbarui setiap 30 detik.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
