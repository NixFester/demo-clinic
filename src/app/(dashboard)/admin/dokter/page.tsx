'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Plus, Pencil, ToggleLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Dokter {
  id: number;
  no_sip: string;
  is_aktif: number;
  nama_lengkap: string;
  id_pengguna: number;
  nama_spesialisasi: string;
  id_spesialisasi: number;
}

interface Spesialisasi {
  id: number;
  nama_spesialisasi: string;
}

interface PenggunaOption {
  id: number;
  nama_lengkap: string;
  username: string;
  role: string;
  is_aktif: number;
}

type Step = 'pengguna' | 'dokter';

export default function DokterPage() {
  const [data, setData] = useState<Dokter[]>([]);
  const [spesialisasiList, setSpesialisasiList] = useState<Spesialisasi[]>([]);
  const [penggunaList, setPenggunaList] = useState<PenggunaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDokter, setEditDokter] = useState<Dokter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('pengguna');
  const [createdPenggunaId, setCreatedPenggunaId] = useState<number | null>(null);

  const [penggunaForm, setPenggunaForm] = useState({ nama_lengkap: '', username: '', password: '' });
  const [dokterForm, setDokterForm] = useState({ id_pengguna: '', id_spesialisasi: '', no_sip: '' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/master/dokter');
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      console.error('[DokterPage] Error:', err);
      setError('Gagal memuat data dokter');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [specRes, pengRes] = await Promise.all([
        fetch('/api/master/spesialisasi'),
        fetch('/api/master/pengguna?page=1'),
      ]);
      const specData = await specRes.json();
      const pengData = await pengRes.json();
      setSpesialisasiList(specData.data || []);
      setPenggunaList((pengData.data || []).filter((p: PenggunaOption) => p.role === 'dokter'));
    } catch (err) {
      console.error('[DokterPage] Options error:', err);
    }
  };

  useEffect(() => { fetchData(); fetchOptions(); }, []);

  const handleCreatePengguna = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/master/pengguna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...penggunaForm, role: 'dokter' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal membuat pengguna');
      setCreatedPenggunaId(result.data?.id || result.id);
      setDokterForm(f => ({ ...f, id_pengguna: String(result.data?.id || result.id) }));
      setStep('dokter');
      toast.success('Pengguna dokter berhasil dibuat. Lanjutkan mengisi data dokter.');
      fetchOptions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectExistingPengguna = (id: string) => {
    setDokterForm(f => ({ ...f, id_pengguna: id }));
    setCreatedPenggunaId(parseInt(id));
    setStep('dokter');
  };

  const handleSubmitDokter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editDokter) {
        await fetch(`/api/master/dokter/${editDokter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_spesialisasi: parseInt(dokterForm.id_spesialisasi), no_sip: dokterForm.no_sip }),
        });
        toast.success('Dokter berhasil diupdate');
      } else {
        await fetch('/api/master/dokter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_pengguna: parseInt(dokterForm.id_pengguna),
            id_spesialisasi: parseInt(dokterForm.id_spesialisasi),
            no_sip: dokterForm.no_sip,
          }),
        });
        toast.success('Dokter berhasil ditambahkan');
      }
      setDialogOpen(false);
      setEditDokter(null);
      setStep('pengguna');
      setPenggunaForm({ nama_lengkap: '', username: '', password: '' });
      setDokterForm({ id_pengguna: '', id_spesialisasi: '', no_sip: '' });
      setCreatedPenggunaId(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan data dokter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await fetch(`/api/master/dokter/${id}/toggle`, { method: 'PATCH' });
      toast.success('Status berhasil diubah');
      fetchData();
    } catch (err) {
      toast.error('Gagal mengubah status');
    }
  };

  const openEdit = (dokter: Dokter) => {
    setEditDokter(dokter);
    setDokterForm({
      id_pengguna: String(dokter.id_pengguna),
      id_spesialisasi: String(dokter.id_spesialisasi),
      no_sip: dokter.no_sip,
    });
    setStep('dokter');
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditDokter(null);
    setStep('pengguna');
    setPenggunaForm({ nama_lengkap: '', username: '', password: '' });
    setDokterForm({ id_pengguna: '', id_spesialisasi: '', no_sip: '' });
    setCreatedPenggunaId(null);
    setDialogOpen(true);
  };

  const availablePengguna = penggunaList.filter(p => !data.some(d => d.id_pengguna === p.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Dokter</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Dokter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editDokter ? 'Edit Dokter' : 'Tambah Dokter'}</DialogTitle>
            </DialogHeader>

            {!editDokter && step === 'pengguna' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Langkah 1: Buat akun pengguna untuk dokter, atau pilih pengguna yang sudah ada.</p>
                <form onSubmit={handleCreatePengguna} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input value={penggunaForm.nama_lengkap} onChange={(e) => setPenggunaForm({ ...penggunaForm, nama_lengkap: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={penggunaForm.username} onChange={(e) => setPenggunaForm({ ...penggunaForm, username: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={penggunaForm.password} onChange={(e) => setPenggunaForm({ ...penggunaForm, password: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Buat Pengguna & Lanjutkan
                  </Button>
                </form>

                {availablePengguna.length > 0 && (
                  <div className="border-t pt-4">
                    <Label className="text-sm text-gray-500">Atau pilih pengguna yang sudah ada:</Label>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {availablePengguna.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectExistingPengguna(String(p.id))}
                          className="w-full text-left px-3 py-2 rounded-md border hover:bg-emerald-50 text-sm"
                        >
                          {p.nama_lengkap} ({p.username})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(step === 'dokter' || editDokter) && (
              <form onSubmit={handleSubmitDokter} className="space-y-4">
                {!editDokter && (
                  <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                    Pengguna: {penggunaForm.nama_lengkap || penggunaList.find(p => p.id === createdPenggunaId)?.nama_lengkap || `ID #${createdPenggunaId}`}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Spesialisasi</Label>
                  <select value={dokterForm.id_spesialisasi} onChange={(e) => setDokterForm({ ...dokterForm, id_spesialisasi: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="">Pilih spesialisasi...</option>
                    {spesialisasiList.map((s) => (
                      <option key={s.id} value={s.id}>{s.nama_spesialisasi}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>No. SIP</Label>
                  <Input value={dokterForm.no_sip} onChange={(e) => setDokterForm({ ...dokterForm, no_sip: e.target.value })} required />
                </div>
                <div className="flex gap-2">
                  {!editDokter && (
                    <Button type="button" variant="outline" onClick={() => setStep('pengguna')}>
                      Kembali
                    </Button>
                  )}
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Simpan
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Dokter</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Spesialisasi</TableHead>
                  <TableHead>No. SIP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data</TableCell></TableRow>
                ) : (
                  data.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.nama_lengkap}</TableCell>
                      <TableCell>{d.nama_spesialisasi}</TableCell>
                      <TableCell>{d.no_sip}</TableCell>
                      <TableCell><StatusBadge status={d.is_aktif ? 'final' : 'batal'} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(d)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggle(d.id)}>
                            <ToggleLeft className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
