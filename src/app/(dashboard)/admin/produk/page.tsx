'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { Plus, Pencil, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/helpers';
import { Produk } from '@/types/api-items';

const kategoriOptions = [
  { value: 'skincare', label: 'Skincare' },
  { value: 'obat', label: 'Obat' },
  { value: 'suplemen', label: 'Suplemen' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function ProdukPage() {
  const [data, setData] = useState<Produk[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Produk | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_produk: '', kategori: 'skincare', satuan: '', harga_jual: '', stok: '0', stok_minimum: '5', is_aktif: true });

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/master/produk?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[ProdukPage] Error:', err);
      setError('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        nama_produk: form.nama_produk,
        kategori: form.kategori,
        satuan: form.satuan,
        harga_jual: parseFloat(form.harga_jual),
        stok: parseInt(form.stok),
        stok_minimum: parseInt(form.stok_minimum),
        is_aktif: form.is_aktif ? 1 : 0,
      };
      if (editItem) {
        const res = await fetch(`/api/master/produk/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Produk berhasil diupdate');
      } else {
        const res = await fetch('/api/master/produk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Produk berhasil ditambahkan');
      }
      setDialogOpen(false);
      setEditItem(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item: Produk) => {
    setEditItem(item);
    setForm({
      nama_produk: item.nama_produk,
      kategori: item.kategori,
      satuan: item.satuan,
      harga_jual: String(item.harga_jual),
      stok: String(item.stok),
      stok_minimum: String(item.stok_minimum),
      is_aktif: !!item.is_aktif,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ nama_produk: '', kategori: 'skincare', satuan: '', harga_jual: '', stok: '0', stok_minimum: '5', is_aktif: true });
    setDialogOpen(true);
  };

  const getKategoriLabel = (val: string) => kategoriOptions.find(k => k.value === val)?.label || val;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Produk</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Produk</Label>
                <Input value={form.nama_produk} onChange={(e) => setForm({ ...form, nama_produk: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {kategoriOptions.map(k => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Satuan</Label>
                  <Input value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Harga Jual (Rp)</Label>
                  <Input type="number" value={form.harga_jual} onChange={(e) => setForm({ ...form, harga_jual: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Stok</Label>
                  <Input type="number" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Stok Minimum</Label>
                  <Input type="number" value={form.stok_minimum} onChange={(e) => setForm({ ...form, stok_minimum: e.target.value })} />
                </div>
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
        <CardHeader><CardTitle className="text-base">Daftar Produk</CardTitle></CardHeader>
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
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Tidak ada data</TableCell></TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_produk}</TableCell>
                      <TableCell>{getKategoriLabel(item.kategori)}</TableCell>
                      <TableCell>{item.satuan}</TableCell>
                      <TableCell>{formatCurrency(item.harga_jual)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {item.stok}
                          {Number(item.stok) < Number(item.stok_minimum) && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              <AlertTriangle className="h-3 w-3 mr-0.5" />
                              Rendah
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{item.stok_minimum}</TableCell>
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
