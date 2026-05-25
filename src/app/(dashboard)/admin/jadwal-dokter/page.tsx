'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Jadwal {
  id: number;
  id_dokter: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  is_aktif: number;
  nama_dokter: string;
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
];

export default function JadwalDokterPage() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [dokterList, setDokterList] = useState<DokterOption[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Jadwal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ id_dokter: '', hari: 'senin', jam_mulai: '08:00', jam_selesai: '12:00', kuota: '20', is_aktif: true });

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/master/jadwal?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[JadwalDokterPage] Error:', err);
      setError('Gagal memuat data jadwal');
    } finally {
      setLoading(false);
    }
  };

  const fetchDokter = async () => {
    try {
      const res = await fetch('/api/master/dokter?aktif=true');
      const result = await res.json();
      setDokterList((result.data || []).map((d: { id: number; nama_lengkap: string }) => ({ id: d.id, nama_lengkap: d.nama_lengkap })));
    } catch (err) {
      console.error('[JadwalDokterPage] Dokter error:', err);
    }
  };

  useEffect(() => { fetchData(); fetchDokter(); }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        id_dokter: parseInt(form.id_dokter),
        hari: form.hari,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        kuota: parseInt(form.kuota),
        is_aktif: form.is_aktif ? 1 : 0,
      };
      if (editItem) {
        await fetch(`/api/master/jadwal/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Jadwal berhasil diupdate');
      } else {
        await fetch('/api/master/jadwal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast.success('Jadwal berhasil ditambahkan');
      }
      setDialogOpen(false);
      setEditItem(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan jadwal');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item: Jadwal) => {
    setEditItem(item);
    setForm({
      id_dokter: String(item.id_dokter),
      hari: item.hari,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      kuota: String(item.kuota),
      is_aktif: !!item.is_aktif,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ id_dokter: '', hari: 'senin', jam_mulai: '08:00', jam_selesai: '12:00', kuota: '20', is_aktif: true });
    setDialogOpen(true);
  };

  const getHariLabel = (val: string) => hariOptions.find(h => h.value === val)?.label || val;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Jadwal Dokter</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Dokter</Label>
                <select value={form.id_dokter} onChange={(e) => setForm({ ...form, id_dokter: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required disabled={!!editItem}>
                  <option value="">Pilih dokter...</option>
                  {dokterList.map((d) => (
                    <option key={d.id} value={d.id}>{d.nama_lengkap}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Hari</Label>
                <select value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {hariOptions.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jam Mulai</Label>
                  <Input type="time" value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Jam Selesai</Label>
                  <Input type="time" value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kuota</Label>
                <Input type="number" value={form.kuota} onChange={(e) => setForm({ ...form, kuota: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Jadwal</CardTitle></CardHeader>
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
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Tidak ada data</TableCell></TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_dokter}</TableCell>
                      <TableCell>{getHariLabel(item.hari)}</TableCell>
                      <TableCell>{item.jam_mulai}</TableCell>
                      <TableCell>{item.jam_selesai}</TableCell>
                      <TableCell>{item.kuota}</TableCell>
                      <TableCell><StatusBadge status={item.is_aktif ? 'final' : 'batal'} /></TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
