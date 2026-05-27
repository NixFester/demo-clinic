'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Clock, Phone, CheckCircle, Wallet, RefreshCw, Loader2, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/helpers';

interface DashboardStats {
  total_antrian: number;
  menunggu: number;
  dipanggil: number;
  selesai: number;
  invoice_menunggu: number;
  total_pendapatan: number;
}

export default function KaryawanDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const [antrianRes, invoiceRes, laporanRes] = await Promise.all([
        fetch('/api/antrian'),
        fetch('/api/invoice?status=belum_bayar'),
        fetch('/api/laporan/harian'),
      ]);
      const antrianData = await antrianRes.json();
      const invoiceData = await invoiceRes.json();
      const laporanData = await laporanRes.json();

      const antrianList = antrianData.data || [];
      const menunggu = antrianList.filter((a: { status: string }) => a.status === 'menunggu').length;
      const dipanggil = antrianList.filter((a: { status: string }) => a.status === 'dipanggil').length;
      const selesai = antrianList.filter((a: { status: string }) => a.status === 'selesai').length;

      const invoiceList = invoiceData.data || [];

      setStats({
        total_antrian: antrianList.length,
        menunggu,
        dipanggil,
        selesai,
        invoice_menunggu: invoiceList.length,
        total_pendapatan: laporanData.total_pendapatan || 0,
      });
      setError('');
    } catch (err) {
      console.error('[KaryawanDashboard] Error:', err);
      setError('Gagal memuat data dashboard');
      setStats({ total_antrian: 0, menunggu: 0, dipanggil: 0, selesai: 0, invoice_menunggu: 0, total_pendapatan: 0 });
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
    { title: 'Invoice Menunggu Bayar', value: stats?.invoice_menunggu ?? '-', icon: <FileText className="h-5 w-5" />, color: 'text-orange-600 bg-orange-50' },
    { title: 'Pendapatan Hari Ini', value: stats ? formatCurrency(stats.total_pendapatan) : '-', icon: <Wallet className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Karyawan</h1>
          <p className="text-gray-500">Selamat datang, {session?.user?.name || 'Karyawan'}</p>
        </div>
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

      {loading && !stats ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Memuat data dashboard...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.title}>
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
      )}

      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-sm">
            Data antrian dan invoice otomatis diperbarui setiap 30 detik. Gunakan menu di sebelah kiri untuk mengelola klinik.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
