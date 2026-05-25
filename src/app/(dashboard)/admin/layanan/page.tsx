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
import { formatCurrency } from '@/lib/helpers';

interface Layanan {
  id: number;
  nama_layanan: string;
  kategori: string;
  harga: number;
  durasi_menit: number;
  is_aktif: number;
}

const kategoriOptions = [
  { value: 'kecantikan', label: 'Kecantikan' },
  { value: 'medis', label: 'Medis' },
  { value: 'konsultasi', label: 'Konsultasi' },
];

export default function LayananPage() {
  const [data, setData] = useState<Layanan[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Layanan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_layanan: '', kategori: 'kecantikan', harga: '', durasi_menit: '30', is_aktif: true });

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/master/layanan?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[LayananPage] Error:', err);
      setError('Gagal memuat data layanan');
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
        nama_layanan: form.nama_layanan,
        kategori: form.kategori,
        harga: parseFloat(form.harga),
        durasi_menit: parseInt(form.durasi_menit),
        is_aktif: form.is_aktif ? 1 : 0,
      };
      if (editItem) {
        const res = await fetch(`/api/master/layanan/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Layanan berhasil diupdate');
      } else {
        const res = await fetch('/api/master/layanan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Layanan berhasil ditambahkan');
      }
      setDialogOpen(false);
      setEditItem(null);
      setForm({ nama_layanan: '', kategori: 'kecantikan', harga: '', durasi_menit: '30', is_aktif: true });
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan layanan');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item: Layanan) => {
    setEditItem(item);
    setForm({
      nama_layanan: item.nama_layanan,
      kategori: item.kategori,
      harga: String(item.harga),
      durasi_menit: String(item.durasi_menit),
      is_aktif: !!item.is_aktif,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ nama_layanan: '', kategori: 'kecantikan', harga: '', durasi_menit: '30', is_aktif: true });
    setDialogOpen(true);
  };

  const getKategoriLabel = (val: string) => kategoriOptions.find(k => k.value === val)?.label || val;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Layanan</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Layanan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Layanan' : 'Tambah Layanan'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Layanan</Label>
                <Input value={form.nama_layanan} onChange={(e) => setForm({ ...form, nama_layanan: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {kategoriOptions.map(k => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga (Rp)</Label>
                  <Input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Durasi (menit)</Label>
                  <Input type="number" value={form.durasi_menit} onChange={(e) => setForm({ ...form, durasi_menit: e.target.value })} />
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
        <CardHeader><CardTitle className="text-base">Daftar Layanan</CardTitle></CardHeader>
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
                  <TableHead>Harga</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Tidak ada data</TableCell></TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_layanan}</TableCell>
                      <TableCell>{getKategoriLabel(item.kategori)}</TableCell>
                      <TableCell>{formatCurrency(item.harga)}</TableCell>
                      <TableCell>{item.durasi_menit} mnt</TableCell>
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
