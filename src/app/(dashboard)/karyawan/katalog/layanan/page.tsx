'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/Pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Loader2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';

interface Layanan {
  id: number;
  nama_layanan: string;
  kategori: string;
  harga: number;
  durasi_menit: number;
  is_aktif: number;
}

const defaultForm = {
  nama_layanan: '',
  kategori: '',
  harga: '',
  durasi_menit: '',
  is_aktif: 1,
};

function getStatusBadge(isAktif: number) {
  return isAktif
    ? <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
    : <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Nonaktif</Badge>;
}

export default function KatalogLayananPage() {
  const [data, setData] = useState<Layanan[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/master/layanan?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (error) {
      console.error('[KatalogLayanan] Error:', error);
      toast.error('Gagal memuat data layanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item: Layanan) => {
    setEditId(item.id);
    setForm({
      nama_layanan: item.nama_layanan,
      kategori: item.kategori || '',
      harga: String(item.harga),
      durasi_menit: String(item.durasi_menit),
      is_aktif: item.is_aktif,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        nama_layanan: form.nama_layanan,
        kategori: form.kategori,
        harga: parseFloat(form.harga) || 0,
        durasi_menit: parseInt(form.durasi_menit) || 0,
        is_aktif: form.is_aktif,
      };

      const res = editId
        ? await fetch(`/api/master/layanan/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/master/layanan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal menyimpan layanan');
      }
      toast.success(editId ? 'Layanan berhasil diperbarui' : 'Layanan berhasil ditambahkan');
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan layanan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/master/layanan/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Layanan berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus layanan');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleAktif = async (item: Layanan) => {
    try {
      const res = await fetch(`/api/master/layanan/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, is_aktif: item.is_aktif ? 0 : 1 }),
      });
      if (!res.ok) throw new Error();
      toast.success(item.is_aktif ? 'Layanan dinonaktifkan' : 'Layanan diaktifkan');
      fetchData();
    } catch (err) {
      toast.error('Gagal mengubah status layanan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Katalog Layanan</h1>
        <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Layanan
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Layanan</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Tidak ada data layanan</TableCell></TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nama_layanan}</TableCell>
                        <TableCell>{item.kategori || '-'}</TableCell>
                        <TableCell>{formatCurrency(item.harga)}</TableCell>
                        <TableCell>{item.durasi_menit} mnt</TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Layanan' : 'Tambah Layanan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Layanan *</Label>
              <Input value={form.nama_layanan} onChange={(e) => setForm({ ...form, nama_layanan: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} placeholder="Cth: Konsultasi, Tindakan" />
              </div>
              <div className="space-y-2">
                <Label>Durasi (menit)</Label>
                <Input type="number" value={form.durasi_menit} onChange={(e) => setForm({ ...form, durasi_menit: e.target.value })} placeholder="30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga *</Label>
                <Input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required />
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
                {editId ? 'Simpan Perubahan' : 'Tambah Layanan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
