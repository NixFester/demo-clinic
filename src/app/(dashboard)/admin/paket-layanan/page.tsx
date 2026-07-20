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
import { Plus, Pencil, Loader2, Trash2, History, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/helpers';
import { PaketLayanan, PaketProdukItem, Layanan, Produk } from '@/types/api-items';

type FilterAktif = 'aktif' | 'nonaktif' | 'all';

interface PaketProdukForm {
  id_produk: number;
  nama_produk: string;
  jumlah: number;
  harga_satuan: number;
}

export default function PaketLayananPage() {
  const [data, setData] = useState<PaketLayanan[]>([]);
  const [layananList, setLayananList] = useState<Layanan[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PaketLayanan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterAktif, setFilterAktif] = useState<FilterAktif>('aktif');
  const [showProdukDialog, setShowProdukDialog] = useState(false);
  const [availableProduk, setAvailableProduk] = useState<Produk[]>([]);

  const [form, setForm] = useState({
    nama_paket: '',
    id_layanan: '',
    total_kunjungan: '1',
    is_aktif: 1 as 0 | 1,
  });

  const [produkItems, setProdukItems] = useState<PaketProdukForm[]>([]);

  // ─── Fetching ───────────────────────────────────────────────────────────────

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/master/paket-layanan?page=${p}`;
      if (filterAktif === 'aktif') url += '&aktif=true';
      const res = await fetch(url);
      const result = await res.json();
      let filteredData = (result.data || []).map((item: Record<string, unknown>) => ({
        ...item,
        id: Number(item.id),
        harga_total: parseFloat(String(item.harga_total)),
        total_kunjungan: Number(item.total_kunjungan),
        sisa_kunjungan: Number(item.sisa_kunjungan),
        is_aktif: Number(item.is_aktif) as 0 | 1,
      }));
      if (filterAktif === 'aktif') {
        filteredData = filteredData.filter((item: { is_aktif: number }) => item.is_aktif === 1);
      } else if (filterAktif === 'nonaktif') {
        filteredData = filteredData.filter((item: { is_aktif: number }) => item.is_aktif === 0);
      }
      setData(filteredData);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[PaketLayananPage] Error:', err);
      setError('Gagal memuat data paket layanan');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [layananRes, produkRes] = await Promise.all([
        fetch('/api/master/layanan?aktif=true&page=1'),
        fetch('/api/master/produk?aktif=true&page=1'),
      ]);
      const layananData = await layananRes.json();
      const produkData = await produkRes.json();
      setLayananList(layananData.data || []);
      setProdukList(produkData.data || []);
    } catch (err) {
      console.error('[PaketLayananPage] Options error:', err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData(1);
    fetchOptions();
  }, [filterAktif]);

  useEffect(() => { fetchData(page); }, [page, filterAktif]);

  // ─── Dialog helpers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditItem(null);
    setForm({ nama_paket: '', id_layanan: '', total_kunjungan: '1', is_aktif: 1 });
    setProdukItems([]);
    setDialogOpen(true);
  };

  const openEdit = (item: PaketLayanan) => {
    setEditItem(item);
    setForm({
      nama_paket: item.nama_paket,
      id_layanan: String(item.id_layanan),
      total_kunjungan: String(item.total_kunjungan),
      is_aktif: item.is_aktif,
    });
    setProdukItems(item.produk || []);
    setDialogOpen(true);
  };

  const openAddProduk = () => {
    const usedIds = produkItems.map(p => p.id_produk);
    setAvailableProduk(produkList.filter(p => !usedIds.includes(p.id)));
    setShowProdukDialog(true);
  };

  const addProduk = (produk: Produk) => {
    setProdukItems([...produkItems, {
      id_produk: produk.id,
      nama_produk: produk.nama_produk,
      jumlah: 1,
      harga_satuan: produk.harga_jual,
    }]);
    setShowProdukDialog(false);
  };

  const removeProduk = (id_produk: number) => {
    setProdukItems(produkItems.filter(p => p.id_produk !== id_produk));
  };

  const updateProdukJumlah = (id_produk: number, jumlah: number) => {
    setProdukItems(produkItems.map(p =>
      p.id_produk === id_produk ? { ...p, jumlah: Math.max(1, jumlah) } : p
    ));
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const calculateTotalHarga = () => {
    const selectedLayananId = Number(form.id_layanan);
    const selectedLayanan = layananList.find(l => l.id === selectedLayananId);
    const layananHarga = selectedLayanan ? Number(selectedLayanan.harga * Number(form.total_kunjungan) || 0) : 0;
    const produkHarga = produkItems.reduce((sum, p) => {
      const hargaSatuan = Number(p.harga_satuan) || 0;
      const jumlah = Number(p.jumlah) || 0;
      const totalKunjungan = Number(form.total_kunjungan) || 1;
      return sum + (hargaSatuan * jumlah * totalKunjungan);
    }, 0);
    return layananHarga + produkHarga;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        nama_paket: form.nama_paket,
        id_layanan: Number(form.id_layanan),
        total_kunjungan: Number(form.total_kunjungan) || 1,
        harga_total: calculateTotalHarga(),
        is_aktif: form.is_aktif,
        produk: produkItems.map(p => ({
          id_produk: p.id_produk,
          jumlah: p.jumlah,
        })),
      };

      const res = editItem
        ? await fetch(`/api/master/paket-layanan/${editItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/master/paket-layanan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal menyimpan paket layanan');
      }

      toast.success(editItem ? 'Paket layanan berhasil diperbarui' : 'Paket layanan berhasil ditambahkan');
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan paket layanan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus paket layanan ini?')) return;
    try {
      const res = await fetch(`/api/master/paket-layanan/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Paket layanan berhasil dihapus');
      fetchData();
    } catch {
      toast.error('Gagal menghapus paket layanan');
    }
  };

  const toggleFilter = () => {
    setFilterAktif(prev => prev === 'aktif' ? 'nonaktif' : 'aktif');
  };

  const selectedLayanan = layananList.find(l => l.id === Number(form.id_layanan));

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paket Layanan</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleFilter}>
            <History className="h-4 w-4 mr-2" />
            {filterAktif === 'aktif' ? 'Riwayat Nonaktif' : 'Kembali ke Aktif'}
          </Button>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Paket
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Paket Layanan {filterAktif === 'nonaktif' ? '(Nonaktif)' : '(Aktif)'}</CardTitle></CardHeader>
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
                  <TableHead>Nama Paket</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Kunjungan</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada paket layanan
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_paket}</TableCell>
                      <TableCell>{item.nama_layanan}</TableCell>
                      <TableCell>{item.total_kunjungan}x</TableCell>
                      <TableCell>{formatCurrency(item.harga_total)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.produk?.slice(0, 2).map((p, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{p.nama_produk}</span>
                          ))}
                          {item.produk && item.produk.length > 2 && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">+{item.produk.length - 2}</span>
                          )}
                          {(!item.produk || item.produk.length === 0) && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.is_aktif ? 'aktif' : 'non-aktif'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Paket Layanan' : 'Tambah Paket Layanan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Paket *</Label>
              <Input
                value={form.nama_paket}
                onChange={(e) => setForm({ ...form, nama_paket: e.target.value })}
                placeholder="Contoh: Paket Perawatan Wajah Premium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Layanan *</Label>
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
                {selectedLayanan && (
                  <p className="text-xs text-gray-500">Harga: {formatCurrency(selectedLayanan.harga)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Total Kunjungan *</Label>
                <Input
                  type="number"
                  value={form.total_kunjungan}
                  onChange={(e) => { setForm({ ...form, total_kunjungan: e.target.value })}}
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500">Jumlah kunjungan dalam paket</p>
              </div>
            </div>

            {/* Produk Section */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <Label>Produk dalam Paket</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    *per kunjungan
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={openAddProduk}>
                  <Plus className="h-3 w-3 mr-1" /> Tambah Produk
                </Button>
              </div>
              {produkItems.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">Belum ada produk. Klik "Tambah Produk" untuk menambahkan.</p>
              ) : (
                <div className="border rounded-md divide-y">
                  {produkItems.map((p) => (
                    <div key={p.id_produk} className="flex items-center gap-3 p-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{p.nama_produk}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(Number(p.harga_satuan) || 0)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={p.jumlah}
                          onChange={(e) => updateProdukJumlah(p.id_produk, Number(e.target.value) || 1)}
                          min={1}
                          className="w-20"
                        />
                        <span className="text-xs text-gray-500">x</span>
                        <div className="flex flex-col items-end w-28">
                          <span className="text-sm font-medium">{formatCurrency((Number(p.harga_satuan) || 0) * (Number(p.jumlah) || 0))}</span>
                          <span className="text-[10px] text-gray-500">per kunjungan</span>
                        </div>
                      </div>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeProduk(p.id_produk)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-emerald-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Harga Layanan</span>
                <span>{selectedLayanan ? formatCurrency(selectedLayanan.harga * Number(form.total_kunjungan) || 0) : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Harga Produk ({form.total_kunjungan}x kunjungan)</span>
                <span>{formatCurrency(produkItems.reduce((sum, p) => sum + ((Number(p.harga_satuan) || 0) * (Number(p.jumlah) || 0) * (Number(form.total_kunjungan) || 1)), 0))}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total Harga Paket</span>
                <span className="text-emerald-700">{formatCurrency(calculateTotalHarga())}</span>
              </div>
              <p className="text-xs text-gray-500">
                Harga per kunjungan: {formatCurrency(Number(form.total_kunjungan) > 0 ? calculateTotalHarga() / Number(form.total_kunjungan) : 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.is_aktif}
                  onChange={(e) => setForm({ ...form, is_aktif: Number(e.target.value) as 0 | 1 })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>Aktif</option>
                  <option value={0}>Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editItem ? 'Simpan Perubahan' : 'Tambah Paket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Produk Dialog */}
      <Dialog open={showProdukDialog} onOpenChange={setShowProdukDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pilih Produk
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {availableProduk.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Semua produk sudah ditambahkan</p>
            ) : (
              availableProduk.map((produk) => (
                <button
                  key={produk.id}
                  type="button"
                  onClick={() => addProduk(produk)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{produk.nama_produk}</p>
                      <p className="text-xs text-gray-500">{produk.kategori} - {produk.satuan}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(produk.harga_jual)}</p>
                      <p className="text-xs text-gray-500">Stok: {produk.stok}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
