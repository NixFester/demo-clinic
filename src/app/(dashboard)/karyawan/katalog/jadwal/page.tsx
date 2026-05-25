'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface JadwalItem {
  id: number;
  id_dokter: number;
  nama_dokter: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  is_aktif: number;
}

interface DokterOption {
  id: number;
  nama_lengkap: string;
}

const hariOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'minggu', label: 'Minggu' },
];

const defaultForm = {
  id_dokter: '',
  hari: 'senin',
  jam_mulai: '08:00',
  jam_selesai: '12:00',
  kuota: '20',
  is_aktif: 1,
};

function getStatusBadge(isAktif: number) {
  return isAktif
    ? <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
    : <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Nonaktif</Badge>;
}

export default function KatalogJadwalPage() {
  const [data, setData] = useState<JadwalItem[]>([]);
  const [dokterList, setDokterList] = useState<DokterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDokter, setLoadingDokter] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/jadwal');
      const result = await res.json();
      setData(result.data || []);
    } catch (error) {
      console.error('[KatalogJadwal] Error:', error);
      toast.error('Gagal memuat data jadwal');
    } finally {
      setLoading(false);
    }
  };

  const fetchDokter = async () => {
    setLoadingDokter(true);
    try {
      const res = await fetch('/api/master/dokter?aktif=true');
      const result = await res.json();
      setDokterList((result.data || []).map((d: { id: number; nama_lengkap: string }) => ({ id: d.id, nama_lengkap: d.nama_lengkap })));
    } catch (error) {
      console.error('[KatalogJadwal] Dokter error:', error);
    } finally {
      setLoadingDokter(false);
    }
  };

  useEffect(() => { fetchData(); fetchDokter(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item: JadwalItem) => {
    setEditId(item.id);
    setForm({
      id_dokter: String(item.id_dokter),
      hari: item.hari,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      kuota: String(item.kuota),
      is_aktif: item.is_aktif,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        id_dokter: parseInt(form.id_dokter),
        hari: form.hari,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        kuota: parseInt(form.kuota) || 0,
        is_aktif: form.is_aktif,
      };

      const res = editId
        ? await fetch(`/api/master/jadwal/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/master/jadwal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal menyimpan jadwal');
      }
      toast.success(editId ? 'Jadwal berhasil diperbarui' : 'Jadwal berhasil ditambahkan');
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan jadwal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/master/jadwal/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Jadwal berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus jadwal');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleAktif = async (item: JadwalItem) => {
    try {
      const res = await fetch(`/api/master/jadwal/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_dokter: item.id_dokter,
          hari: item.hari,
          jam_mulai: item.jam_mulai,
          jam_selesai: item.jam_selesai,
          kuota: item.kuota,
          is_aktif: item.is_aktif ? 0 : 1,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(item.is_aktif ? 'Jadwal dinonaktifkan' : 'Jadwal diaktifkan');
      fetchData();
    } catch (err) {
      toast.error('Gagal mengubah status jadwal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jadwal Dokter</h1>
        <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Jadwal
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Jadwal Praktik</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data...</span>
            </div>
          ) : data.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Tidak ada jadwal</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dokter</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam Mulai</TableHead>
                    <TableHead>Jam Selesai</TableHead>
                    <TableHead>Kuota</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_dokter}</TableCell>
                      <TableCell className="capitalize">{item.hari}</TableCell>
                      <TableCell>{item.jam_mulai}</TableCell>
                      <TableCell>{item.jam_selesai}</TableCell>
                      <TableCell>{item.kuota}</TableCell>
                      <TableCell>
                        <button onClick={() => handleToggleAktif(item)} className="cursor-pointer">
                          {getStatusBadge(item.is_aktif)}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}>
                            {deleting === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Dokter *</Label>
              {loadingDokter ? (
                <div className="flex items-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Memuat dokter...</span>
                </div>
              ) : (
                <select value={form.id_dokter} onChange={(e) => setForm({ ...form, id_dokter: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  <option value="">Pilih dokter...</option>
                  {dokterList.map((d) => (
                    <option key={d.id} value={d.id}>{d.nama_lengkap}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Hari *</Label>
              <select value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                {hariOptions.map(h => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jam Mulai *</Label>
                <Input type="time" value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Jam Selesai *</Label>
                <Input type="time" value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kuota *</Label>
                <Input type="number" value={form.kuota} onChange={(e) => setForm({ ...form, kuota: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.is_aktif} onChange={(e) => setForm({ ...form, is_aktif: parseInt(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value={1}>Aktif</option>
                  <option value={0}>Nonaktif</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Batal</Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editId ? 'Simpan Perubahan' : 'Tambah Jadwal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
