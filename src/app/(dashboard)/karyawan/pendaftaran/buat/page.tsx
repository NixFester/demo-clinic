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
import { Loader2, ArrowLeft, ArrowRight, UserPlus, PackagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface DokterOption {
  id: number;
  nama_lengkap: string;
}

interface LayananOption {
  id: number;
  nama_layanan: string;
  harga: number;
}

interface PaketLayananOption {
  id: number;
  nama_paket: string;
  id_layanan: number;
  harga_total: number;
  total_kunjungan: number;
}

interface PasienOption {
  id?: number;
  nama_lengkap?: string;
  no_rekam_medis?: string;
  nik?: string;
}

type Step = 1 | 2;

export default function KaryawanPendaftaranBuatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>(1);
  const [dokterList, setDokterList] = useState<DokterOption[]>([]);
  const [layananList, setLayananList] = useState<LayananOption[]>([]);
  const [selectedPasien, setSelectedPasien] = useState<PasienOption>({});
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingPasien, setCreatingPasien] = useState(false);
  const [createPaketDialogOpen, setCreatePaketDialogOpen] = useState(false);
  const [creatingPaket, setCreatingPaket] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [usePaket, setUsePaket] = useState(false);
  const [paketLayananList, setPaketLayananList] = useState<PaketLayananOption[]>([]);
  const [loadingPaket, setLoadingPaket] = useState(false);

  const [form, setForm] = useState({
    id_dokter: '',
    id_layanan: '',
    keluhan_utama: '',
    jenis_kunjungan: 'baru',
    catatan: '',
  });

  const [newPasienForm, setNewPasienForm] = useState({
    nama_lengkap: '',
    nik: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    alamat: '',
    no_telepon: '',
    no_whatsapp: '',
  });

  const [newPaketForm, setNewPaketForm] = useState({
    nama_paket: '',
    id_layanan: '',
    harga_total: '',
    total_kunjungan: '1',
    produk: [] as { id_produk: number, jumlah: number }[],
  });

  const [produkList, setProdukList] = useState<any[]>([]);

  useEffect(() => {
    if (usePaket && paketLayananList.length === 0) {
      const fetchPaket = async () => {
        setLoadingPaket(true);
        try {
          const res = await fetch('/api/master/paket-layanan?aktif=true');
          const data = await res.json();
          setPaketLayananList(data.data || []);
        } catch (err) {
          toast.error('Gagal memuat paket layanan');
        } finally {
          setLoadingPaket(false);
        }
      };
      fetchPaket();
    }
  }, [usePaket, paketLayananList.length]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [dokterRes, layananRes, produkRes] = await Promise.all([
          fetch('/api/master/dokter?aktif=true'),
          fetch('/api/master/layanan?aktif=true&page=1'),
          fetch('/api/master/produk?aktif=true'),
        ]);
        const dokterData = await dokterRes.json();
        const layananData = await layananRes.json();
        const produkData = await produkRes.json();
        setDokterList((dokterData.data || []).map((d: { id: number; nama_lengkap: string }) => ({ id: d.id, nama_lengkap: d.nama_lengkap })));
        setLayananList(layananData.data || []);
        setProdukList(produkData.data || []);
      } catch (err) {
        console.error('[PendaftaranBuat] Options error:', err);
        toast.error('Gagal memuat opsi dokter/layanan');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleCreatePasien = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPasien(true);
    try {
      const res = await fetch('/api/pasien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPasienForm),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal membuat pasien');
      setSelectedPasien({
        id: result.data?.id || result.id,
        nama_lengkap: newPasienForm.nama_lengkap,
        no_rekam_medis: result.no_rekam_medis || result.data?.no_rekam_medis,
      });
      setCreateDialogOpen(false);
      toast.success('Pasien baru berhasil didaftarkan');
      setNewPasienForm({ nama_lengkap: '', nik: '', tanggal_lahir: '', jenis_kelamin: 'L', alamat: '', no_telepon: '', no_whatsapp: '' });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat pasien');
    } finally {
      setCreatingPasien(false);
    }
  };

  const handleCreatePaket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaketForm.id_layanan) {
      toast.error('Pilih layanan dasar untuk paket');
      return;
    }
    setCreatingPaket(true);
    try {
      const res = await fetch('/api/master/paket-layanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_paket: newPaketForm.nama_paket,
          id_layanan: parseInt(newPaketForm.id_layanan),
          harga_total: parseFloat(newPaketForm.harga_total),
          total_kunjungan: parseInt(newPaketForm.total_kunjungan),
          produk: newPaketForm.produk,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal membuat paket layanan');
      toast.success('Paket layanan baru berhasil dibuat');
      setCreatePaketDialogOpen(false);
      setNewPaketForm({ nama_paket: '', id_layanan: '', harga_total: '', total_kunjungan: '1', produk: [] });
      // Refresh paket list
      const pRes = await fetch('/api/master/paket-layanan?aktif=true');
      const pData = await pRes.json();
      setPaketLayananList(pData.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat paket layanan');
    } finally {
      setCreatingPaket(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPasien.id) {
      toast.error('Pilih pasien terlebih dahulu');
      return;
    }
    if (!form.id_dokter || !form.id_layanan) {
      toast.error('Pilih dokter dan layanan');
      return;
    }

    setLoading(true);
    try {
      const userId = (session?.user as unknown as { id?: string })?.id;
      
      const payload: any = {
        id_pasien: selectedPasien.id,
        id_dokter: parseInt(form.id_dokter),
        id_karyawan: userId ? parseInt(userId) : 0,
        keluhan_utama: form.keluhan_utama,
        jenis_kunjungan: form.jenis_kunjungan,
        catatan: form.catatan,
      };

      if (usePaket) {
        const paket = paketLayananList.find(p => p.id === parseInt(form.id_layanan));
        payload.id_layanan = paket?.id_layanan || 0;
        payload.id_paket_layanan = parseInt(form.id_layanan);
      } else {
        payload.id_layanan = parseInt(form.id_layanan);
      }

      const res = await fetch('/api/pendaftaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Pendaftaran berhasil! No. Antrian: ${result.no_antrian}`);
        router.push('/karyawan/antrian');
      } else {
        toast.error(result.error || 'Gagal membuat pendaftaran');
      }
    } catch (err) {
      toast.error('Gagal membuat pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  const selectedLayananInfo = usePaket 
    ? paketLayananList.find(p => p.id === parseInt(form.id_layanan)) 
    : layananList.find(l => l.id === parseInt(form.id_layanan));

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

            <Button variant="outline" className="w-full" onClick={() => router.push('/karyawan/pasien/buat')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Daftarkan Pasien Baru
            </Button>

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

      {/* Step 2: Pilih Layanan & Dokter */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pilih Layanan & Dokter</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Memuat opsi...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                  Pasien: <span className="font-medium">{selectedPasien.nama_lengkap}</span> ({selectedPasien.nik})
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="use-paket" checked={usePaket} onCheckedChange={(val) => { setUsePaket(val); setForm({ ...form, id_layanan: '' }); }} />
                  <Label htmlFor="use-paket">Daftar dari Paket Layanan</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dokter *</Label>
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
                    <div className="flex items-center justify-between">
                      <Label>{usePaket ? 'Paket Layanan *' : 'Layanan *'}</Label>
                      {!usePaket && (
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => setCreatePaketDialogOpen(true)}>
                          <PackagePlus className="h-3 w-3 mr-1" /> Buat Paket
                        </Button>
                      )}
                    </div>
                    <select
                      value={form.id_layanan}
                      onChange={(e) => setForm({ ...form, id_layanan: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      {usePaket ? (
                        <>
                          <option value="">Pilih paket layanan...</option>
                          {loadingPaket ? (
                            <option value="" disabled>Memuat paket...</option>
                          ) : (
                            paketLayananList.map((p) => (
                              <option key={p.id} value={p.id}>{p.nama_paket}</option>
                            ))
                          )}
                        </>
                      ) : (
                        <>
                          <option value="">Pilih layanan...</option>
                          {layananList.map((l) => (
                            <option key={l.id} value={l.id}>{l.nama_layanan}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {selectedLayananInfo && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-500">Harga {usePaket ? 'paket' : 'layanan'}:</span>{' '}
                    <span className="font-medium">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
                        usePaket ? (selectedLayananInfo as PaketLayananOption).harga_total : (selectedLayananInfo as LayananOption).harga
                      )}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Jenis Kunjungan *</Label>
                  <select
                    value={form.jenis_kunjungan}
                    onChange={(e) => setForm({ ...form, jenis_kunjungan: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="baru">Kunjungan Baru</option>
                    <option value="lama">Kunjungan Lama</option>
                    <option value="kontrol">Kontrol</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Keluhan Utama *</Label>
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Buat Pasien Baru */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Daftarkan Pasien Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePasien} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input value={newPasienForm.nama_lengkap} onChange={(e) => setNewPasienForm({ ...newPasienForm, nama_lengkap: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>NIK *</Label>
              <Input value={newPasienForm.nik} onChange={(e) => setNewPasienForm({ ...newPasienForm, nik: e.target.value })} required maxLength={16} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Lahir *</Label>
                <Input type="date" value={newPasienForm.tanggal_lahir} onChange={(e) => setNewPasienForm({ ...newPasienForm, tanggal_lahir: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin *</Label>
                <select value={newPasienForm.jenis_kelamin} onChange={(e) => setNewPasienForm({ ...newPasienForm, jenis_kelamin: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input value={newPasienForm.alamat} onChange={(e) => setNewPasienForm({ ...newPasienForm, alamat: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input value={newPasienForm.no_telepon} onChange={(e) => setNewPasienForm({ ...newPasienForm, no_telepon: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>No. WhatsApp</Label>
                <Input value={newPasienForm.no_whatsapp} onChange={(e) => setNewPasienForm({ ...newPasienForm, no_whatsapp: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={creatingPasien}>
              {creatingPasien && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Daftarkan Pasien
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Buat Paket Layanan */}
      <Dialog open={createPaketDialogOpen} onOpenChange={setCreatePaketDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Paket Layanan Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePaket} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Paket *</Label>
              <Input value={newPaketForm.nama_paket} onChange={(e) => setNewPaketForm({ ...newPaketForm, nama_paket: e.target.value })} placeholder="Contoh: Paket Fisioterapi 5x" required />
            </div>
            <div className="space-y-2">
              <Label>Layanan Dasar *</Label>
              <select
                value={newPaketForm.id_layanan}
                onChange={(e) => setNewPaketForm({ ...newPaketForm, id_layanan: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Pilih layanan...</option>
                {layananList.map((l) => (
                  <option key={l.id} value={l.id}>{l.nama_layanan}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Harga Total (Rp) *</Label>
              <Input type="number" value={newPaketForm.harga_total} onChange={(e) => setNewPaketForm({ ...newPaketForm, harga_total: e.target.value })} min="0" required />
            </div>
            <div className="space-y-2">
              <Label>Total Kunjungan *</Label>
              <Input type="number" value={newPaketForm.total_kunjungan} onChange={(e) => setNewPaketForm({ ...newPaketForm, total_kunjungan: e.target.value })} min="1" required />
            </div>
            
            {/* Produk Tambahan */}
            <div className="space-y-2 border-t pt-4">
              <Label>Produk Tambahan (Per Kunjungan)</Label>
              <div className="flex gap-2">
                <select id="paket-produk-select" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Pilih produk...</option>
                  {produkList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama_produk}</option>
                  ))}
                </select>
                <Input id="paket-produk-qty" type="number" defaultValue="1" min="1" className="w-20" />
                <Button type="button" variant="outline" onClick={() => {
                  const select = document.getElementById('paket-produk-select') as HTMLSelectElement;
                  const qty = document.getElementById('paket-produk-qty') as HTMLInputElement;
                  if (!select.value) return;
                  const id = parseInt(select.value);
                  const jumlah = parseInt(qty.value || '1');
                  const existing = newPaketForm.produk.find(p => p.id_produk === id);
                  if (existing) {
                    setNewPaketForm({
                      ...newPaketForm,
                      produk: newPaketForm.produk.map(p => p.id_produk === id ? { ...p, jumlah: p.jumlah + jumlah } : p)
                    });
                  } else {
                    setNewPaketForm({
                      ...newPaketForm,
                      produk: [...newPaketForm.produk, { id_produk: id, jumlah }]
                    });
                  }
                  select.value = '';
                  qty.value = '1';
                }}>Tambah</Button>
              </div>
              {newPaketForm.produk.length > 0 && (
                <div className="mt-2 space-y-2 bg-gray-50 p-2 rounded-md">
                  {newPaketForm.produk.map((p, idx) => {
                    const prodInfo = produkList.find(x => x.id === p.id_produk);
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm border-b pb-1 last:border-0 last:pb-0">
                        <span>{prodInfo?.nama_produk || 'Produk'}</span>
                        <div className="flex items-center gap-2">
                          <span>{p.jumlah}x</span>
                          <button type="button" className="text-red-500 hover:text-red-700" onClick={() => {
                            setNewPaketForm({
                              ...newPaketForm,
                              produk: newPaketForm.produk.filter((_, i) => i !== idx)
                            });
                          }}>Hapus</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={creatingPaket}>
              {creatingPaket && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Paket Layanan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
