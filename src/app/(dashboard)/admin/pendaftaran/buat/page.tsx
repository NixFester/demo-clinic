'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PasienSearch } from '@/components/shared/PasienSearch';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, ArrowLeft, ArrowRight, UserPlus } from 'lucide-react';

interface DokterOption {
  id: number;
  nama_lengkap: string;
}

interface LayananOption {
  id: number;
  nama_layanan: string;
  harga: number;
}

interface PasienOption {
  id?: number;
  nama_lengkap?: string;
  no_rekam_medis?: string;
  nik?: string;
}

interface PaketOption {
  id: number;
  nama_paket: string;
  nama_layanan: string;
  harga_total: number;
  total_kunjungan: number;
  harga_layanan: number;
  produk?: Array<{ id_produk: number; nama_produk: string; jumlah: number; harga_satuan: number }>;
}

type Step = 1 | 2;

export default function PendaftaranBuatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>(1);
  const [dokterList, setDokterList] = useState<DokterOption[]>([]);
  const [layananList, setLayananList] = useState<LayananOption[]>([]);
  const [paketList, setPaketList] = useState<PaketOption[]>([]);
  const [selectedPasien, setSelectedPasien] = useState<PasienOption>({});
  const [loading, setLoading] = useState(false);
  const [isPaket, setIsPaket] = useState(false);

  const [form, setForm] = useState({
    id_dokter: '',
    id_layanan: '',
    id_paket_layanan: '',
    keluhan_utama: '',
    jenis_kunjungan: 'baru',
    catatan: '',
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [dokterRes, layananRes, paketRes] = await Promise.all([
          fetch('/api/master/dokter?aktif=true'),
          fetch('/api/master/layanan?aktif=true&page=1'),
          fetch('/api/master/paket-layanan?aktif=true&page=1'),
        ]);
        const dokterData = await dokterRes.json();
        const layananData = await layananRes.json();
        const paketData = await paketRes.json();
        setDokterList((dokterData.data || []).map((d: { id: number; nama_lengkap: string }) => ({ id: d.id, nama_lengkap: d.nama_lengkap })));
        setLayananList(layananData.data || []);
        setPaketList((paketData.data || []) as PaketOption[]);
      } catch (err) {
        console.error('[PendaftaranBuatPage] Options error:', err);
      }
    };
    fetchOptions();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPasien.id) {
      toast.error('Pilih pasien terlebih dahulu');
      return;
    }
    if (!form.id_dokter || (!isPaket && !form.id_layanan) || (isPaket && !form.id_paket_layanan)) {
      toast.error('Pilih dokter dan layanan/paket yang sesuai');
      return;
    }

    setLoading(true);
    try {
      const userId = (session?.user as unknown as { id?: string })?.id;
      const res = await fetch('/api/pendaftaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pasien: selectedPasien.id,
          id_dokter: parseInt(form.id_dokter),
          id_layanan: !isPaket ? (form.id_layanan ? parseInt(form.id_layanan) : null) : null,
          id_paket_layanan: isPaket ? (form.id_paket_layanan ? parseInt(form.id_paket_layanan) : null) : null,
          id_karyawan: userId ? parseInt(userId) : 0,
          keluhan_utama: form.keluhan_utama,
          jenis_kunjungan: form.jenis_kunjungan,
          catatan: form.catatan,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Pendaftaran berhasil! No. Antrian: ${result.no_antrian}`);
        router.push('/admin/antrian');
      } else {
        toast.error(result.error || 'Gagal membuat pendaftaran');
      }
    } catch (err) {
      toast.error('Gagal membuat pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  const selectedLayanan = layananList.find(l => l.id === parseInt(form.id_layanan));
  const selectedPaket = paketList.find(p => p.id === parseInt(form.id_paket_layanan));

  const toggleServiceMode = (value: boolean) => {
    setIsPaket(value);
    setForm((prev) => ({
      ...prev,
      id_layanan: value ? '' : prev.id_layanan,
      id_paket_layanan: value ? prev.id_paket_layanan : '',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pendaftaran Baru</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>1. Pasien</span>
          <span className="text-gray-400">→</span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>2. Layanan</span>
        </div>
      </div>

      {/* Step 1: Pilih/Buat Pasien */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pilih Pasien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cari Pasien yang Sudah Terdaftar</Label>
              <PasienSearch onSelect={setSelectedPasien} />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">atau</span>
              </div>
            </div>
            
            <Link href="/admin/pendaftaran/buat/pasienbaru" className="w-full">
              <Button variant="outline" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Daftarkan Pasien Baru
              </Button>
            </Link>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (!selectedPasien.id) {
                    toast.error('Pilih atau buat pasien terlebih dahulu');
                    return;
                  }
                  setStep(2);
                }}
                disabled={!selectedPasien.id}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Lanjutkan <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Pilih Layanan */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pilih Layanan & Dokter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                Pasien: {selectedPasien.nama_lengkap} ({selectedPasien.nik})
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dokter</Label>
                  <select
                    value={form.id_dokter}
                    onChange={(e) => setForm({ ...form, id_dokter: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Pilih dokter...</option>
                    {dokterList.map((d) => (
                      <option key={d.id} value={d.id}>{d.nama_lengkap}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Jenis Layanan</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={!isPaket ? 'default' : 'outline'} className="flex-1" onClick={() => toggleServiceMode(false)}>
                      Layanan Regular
                    </Button>
                    <Button type="button" variant={isPaket ? 'default' : 'outline'} className="flex-1" onClick={() => toggleServiceMode(true)}>
                      Paket Layanan
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isPaket ? 'Paket Layanan' : 'Layanan'}</Label>
                {isPaket ? (
                  <select
                    value={form.id_paket_layanan}
                    onChange={(e) => setForm({ ...form, id_paket_layanan: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Pilih paket...</option>
                    {paketList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama_paket}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={form.id_layanan}
                    onChange={(e) => setForm({ ...form, id_layanan: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Pilih layanan...</option>
                    {layananList.map((l) => (
                      <option key={l.id} value={l.id}>{l.nama_layanan}</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedLayanan && !isPaket && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-500">Harga layanan:</span>{' '}
                  <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedLayanan.harga)}</span>
                </div>
              )}

              {selectedPaket && isPaket && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm space-y-2">
                  <div className="font-medium text-amber-800">{selectedPaket.nama_paket}</div>
                  <div className="text-gray-600">Layanan dasar: {selectedPaket.nama_layanan}</div>
                  <div className="text-gray-600">Total kunjungan: {selectedPaket.total_kunjungan}x • Harga paket: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedPaket.harga_total)}</div>
                  {selectedPaket.produk && selectedPaket.produk.length > 0 && (
                    <ul className="list-disc pl-5 text-gray-600">
                      {selectedPaket.produk.map((produk) => (
                        <li key={produk.id_produk}>{produk.nama_produk} • {produk.jumlah}x</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Jenis Kunjungan</Label>
                <select
                  value={form.jenis_kunjungan}
                  onChange={(e) => setForm({ ...form, jenis_kunjungan: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="baru">Kunjungan Baru</option>
                  <option value="kontrol">Kontrol</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Keluhan Utama</Label>
                <Textarea
                  value={form.keluhan_utama}
                  onChange={(e) => setForm({ ...form, keluhan_utama: e.target.value })}
                  placeholder="Deskripsikan keluhan pasien..."
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan (Opsional)</Label>
                <Input
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Daftarkan Pasien
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
