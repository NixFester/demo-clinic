'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { Plus, Pencil, Loader2, Trash2, History } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';
import { Layanan } from '@/types/api-items';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Predefined kategori options used in the select dropdown.
 * The free-text fallback (katalog) isn't needed — the select covers all cases
 * and is friendlier UX than a plain Input.
 */
const KATEGORI_OPTIONS = [
  { value: 'kecantikan',  label: 'Kecantikan' },
  { value: 'medis',       label: 'Medis' },
  { value: 'konsultasi',  label: 'Konsultasi' },
];

const DEFAULT_FORM = {
  nama_layanan: '',
  kategori: 'kecantikan',
  harga: '',
  durasi_menit: '30',
  is_aktif: 1,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LayananPage() {
  const [data, setData] = useState<Layanan[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterAktif, setFilterAktif] = useState<'aktif' | 'nonaktif'>('aktif');

  // ─── Fetching ───────────────────────────────────────────────────────────────

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/master/layanan?page=${p}`);
      const result = await res.json();
      let filteredData = result.data || [];
      // Filter based on current filter state
      if (filterAktif === 'aktif') {
        filteredData = filteredData.filter((item: Layanan) => item.is_aktif === 1);
      } else {
        filteredData = filteredData.filter((item: Layanan) => item.is_aktif === 0);
      }
      setData(filteredData);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[LayananView] Error:', err);
      setError('Gagal memuat data layanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [filterAktif]);

  useEffect(() => { fetchData(); }, [page]);

  // ─── Dialog helpers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: Layanan) => {
    setEditId(item.id);
    setForm({
      nama_layanan: item.nama_layanan,
      kategori: item.kategori || 'kecantikan',
      harga: String(item.harga),
      durasi_menit: String(item.durasi_menit),
      is_aktif: item.is_aktif,
    });
    setDialogOpen(true);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

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
    } catch {
      toast.error('Gagal menghapus layanan');
    } finally {
      setDeleting(null);
    }
  };

  const getKategoriLabel = (val: string) =>
    KATEGORI_OPTIONS.find((k) => k.value === val)?.label ?? val;

  const toggleFilter = () => {
    setFilterAktif(prev => prev === 'aktif' ? 'nonaktif' : 'aktif');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manajemen Layanan</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleFilter}>
            <History className="h-4 w-4 mr-2" />
            {filterAktif === 'aktif' ? 'Riwayat Nonaktif' : 'Kembali ke Aktif'}
          </Button>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Layanan
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Layanan {filterAktif === 'nonaktif' ? '(Nonaktif)' : '(Aktif)'}</CardTitle></CardHeader>
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
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Tidak ada data layanan
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nama_layanan}</TableCell>
                        <TableCell>{getKategoriLabel(item.kategori) || '-'}</TableCell>
                        <TableCell>{formatCurrency(item.harga)}</TableCell>
                        <TableCell>{item.durasi_menit} mnt</TableCell>
                        <TableCell>
                          <StatusBadge status={item.is_aktif == 1 ? 'aktif' : 'non-aktif'} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500"
                              onClick={() => handleDelete(item.id)}
                              disabled={deleting === item.id}
                            >
                              {deleting === item.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Trash2 className="h-3 w-3" />
                              }
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Layanan' : 'Tambah Layanan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Layanan *</Label>
              <Input
                value={form.nama_layanan}
                onChange={(e) => setForm({ ...form, nama_layanan: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Durasi (menit)</Label>
                <Input
                  type="number"
                  value={form.durasi_menit}
                  onChange={(e) => setForm({ ...form, durasi_menit: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga (Rp) *</Label>
                <Input
                  type="number"
                  value={form.harga}
                  onChange={(e) => setForm({ ...form, harga: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.is_aktif}
                  onChange={(e) => setForm({ ...form, is_aktif: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>Aktif</option>
                  <option value={0}>Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting}
              >
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