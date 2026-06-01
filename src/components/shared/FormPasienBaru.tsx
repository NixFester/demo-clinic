'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function FormPasienBaru() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nik: '',
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    alamat: '',
    no_telepon: '',
    no_whatsapp: '',
    golongan_darah: 'tidak_diketahui',
    alergi: '',
    catatan_kulit: '',
  });
  const { data: session } = useSession();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/pasien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Pasien berhasil ditambahkan! No. RM: ${result.no_rekam_medis}`);
         if (
              session?.user?.role === 'admin' ||
              session?.user?.role === 'superadmin'
            ) {
              router.push('/admin/pendaftaran/pasien');
            } else if (session?.user?.role === 'karyawan') {
              router.push('/karyawan/pendaftaran/pasien');
            }
      } else {
        toast.error(result.error || 'Gagal menambahkan pasien');
      }
    } catch (error) {
      toast.error('Gagal menambahkan pasien');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
        <CardHeader><CardTitle className="text-base">Form Pasien</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIK *</Label>
                <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} required maxLength={16} placeholder="16 digit NIK" />
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} required placeholder="Nama lengkap pasien" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tempat Lahir</Label>
                <Input value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} placeholder="Kota kelahiran" />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir *</Label>
                <Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin *</Label>
                <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alamat</Label>
              <Textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat lengkap" rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input value={form.no_telepon} onChange={(e) => setForm({ ...form, no_telepon: e.target.value })} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label>No. WhatsApp</Label>
                <Input value={form.no_whatsapp} onChange={(e) => setForm({ ...form, no_whatsapp: e.target.value })} placeholder="08xxxxxxxxxx" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Golongan Darah</Label>
                <select value={form.golongan_darah} onChange={(e) => setForm({ ...form, golongan_darah: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="tidak_diketahui">Tidak Diketahui</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Alergi</Label>
                <Input value={form.alergi} onChange={(e) => setForm({ ...form, alergi: e.target.value })} placeholder="Cth: Penisilin, Debu" />
              </div>
              <div className="space-y-2">
                <Label>Catatan Kulit</Label>
                <Input value={form.catatan_kulit} onChange={(e) => setForm({ ...form, catatan_kulit: e.target.value })} placeholder="Catatan kondisi kulit" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {loading ? 'Menyimpan...' : 'Simpan Pasien'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}