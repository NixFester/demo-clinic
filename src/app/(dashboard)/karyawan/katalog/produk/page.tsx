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
import { AlertTriangle, Plus, Pencil, Loader2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';

interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
  satuan: string;
  harga_jual: number;
  stok: number;
  stok_minimum: number;
  is_aktif: number;
}

const defaultForm = {
  nama_produk: '',
  kategori: '',
  satuan: '',
  harga_jual: '',
  stok: '',
  stok_minimum: '',
  is_aktif: 1,
};

function getStatusBadge(isAktif: number) {
  return isAktif
    ? <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
    : <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Nonaktif</Badge>;
}

export default function KatalogProdukPage() {
  const [data, setData] = useState<Produk[]>([]);
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
      const res = await fetch(`/api/master/produk?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (error) {
      console.error('[KatalogProduk] Error:', error);
      toast.error('Gagal memuat data produk');
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

  const openEdit = (item: Produk) => {
    setEditId(item.id);
    setForm({
      nama_produk: item.nama_produk,
      kategori: item.kategori || '',
      satuan: item.satuan || '',
      harga_jual: String(item.harga_jual),
      stok: String(item.stok),
      stok_minimum: String(item.stok_minimum),
      is_aktif: item.is_aktif,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        nama_produk: form.nama_produk,
        kategori: form.kategori,
        satuan: form.satuan,
        harga_jual: parseFloat(form.harga_jual) || 0,
        stok: parseInt(form.stok) || 0,
        stok_minimum: parseInt(form.stok_minimum) || 0,
        is_aktif: form.is_aktif,
      };

      const res = editId
        ? await fetch(`/api/master/produk/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/master/produk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal menyimpan produk');
      }
      toast.success(editId ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/master/produk/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Produk berhasil dihapus');
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus produk');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleAktif = async (item: Produk) => {
    try {
      const res = await fetch(`/api/master/produk/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, is_aktif: item.is_aktif ? 0 : 1 }),
      });
      if (!res.ok) throw new Error();
      toast.success(item.is_aktif ? 'Produk dinonaktifkan' : 'Produk diaktifkan');
      fetchData();
    } catch (err) {
      toast.error('Gagal mengubah status produk');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Katalog Produk</h1>
        <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Produk</CardTitle></CardHeader>
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
                    <TableHead>Satuan</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Stok Min</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Tidak ada data produk</TableCell></TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nama_produk}</TableCell>
                        <TableCell>{item.kategori || '-'}</TableCell>
                        <TableCell>{item.satuan || '-'}</TableCell>
                        <TableCell>{formatCurrency(item.harga_jual)}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            {item.stok}
                            {item.stok <= item.stok_minimum && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                          </span>
                        </TableCell>
                        <TableCell>{item.stok_minimum}</TableCell>
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
        <DialogContent className="max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Produk *</Label>
              <Input value={form.nama_produk} onChange={(e) => setForm({ ...form, nama_produk: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} placeholder="Cth: Obat, Alkes" />
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Input value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} placeholder="Cth: Tablet, Botol" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga Jual *</Label>
                <Input type="number" value={form.harga_jual} onChange={(e) => setForm({ ...form, harga_jual: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Stok *</Label>
                <Input type="number" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stok Minimum</Label>
                <Input type="number" value={form.stok_minimum} onChange={(e) => setForm({ ...form, stok_minimum: e.target.value })} />
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
                {editId ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
