'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { Pengaturan } from '@/types/api-items';

export default function PengaturanPage() {
  const [form, setForm] = useState<Pengaturan>({
    id: 0,
    nama_klinik: '',
    alamat_klinik: '',
    no_telepon_klinik: '',
    batas_diskon_karyawan: 20,
    footer_invoice: '',
    created_at: '',
    updated_at: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const data = await res.json();
        if (data && data.id) {
          setForm({
            id: data.id || 0,
            nama_klinik: data.nama_klinik || '',
            alamat_klinik: data.alamat_klinik || '',
            no_telepon_klinik: data.no_telepon_klinik || '',
            batas_diskon_karyawan: data.batas_diskon_karyawan || 20,
            footer_invoice: data.footer_invoice || '',
            created_at: data.created_at || '',
            updated_at: data.updated_at || '',
          });
        }
      } catch (err) {
        console.error('[PengaturanPage] Error:', err);
        setError('Gagal memuat pengaturan');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-2 text-gray-500">Memuat pengaturan...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Informasi Klinik</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Klinik</Label>
              <Input value={form.nama_klinik} onChange={(e) => setForm({ ...form, nama_klinik: e.target.value })} placeholder="Masukkan nama klinik..." />
            </div>
            <div className="space-y-2">
              <Label>Alamat Klinik</Label>
              <Textarea value={form.alamat_klinik} onChange={(e) => setForm({ ...form, alamat_klinik: e.target.value })} placeholder="Masukkan alamat klinik..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon Klinik</Label>
              <Input value={form.no_telepon_klinik} onChange={(e) => setForm({ ...form, no_telepon_klinik: e.target.value })} placeholder="Masukkan nomor telepon..." />
            </div>
            <div className="space-y-2">
              <Label>Footer Invoice</Label>
              <Textarea value={form.footer_invoice} onChange={(e) => setForm({ ...form, footer_invoice: e.target.value })} placeholder="Terima kasih atas kunjungan Anda..." rows={2} />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
