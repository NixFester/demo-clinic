'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fmtCurrency} from './rme-helpers';
import { ResepItem, Produk } from '@/types/api-items';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResepCardProps {
  rmeId:       number | null;
  items:       ResepItem[];
  produkList:  Produk[];
  editable?:   boolean;
  onChanged:   () => void;
}

export function ResepCard({ rmeId, items, produkList, editable = true, onChanged }: ResepCardProps) {
  const isMobile = useIsMobile();
  const [selectedProduk, setSelectedProduk] = useState('');
  const [jumlah,         setJumlah]         = useState('1');
  const [dosis,          setDosis]          = useState('');
  const [aturan,         setAturan]         = useState('');
  const [keterangan,     setKeterangan]     = useState('');
  const [adding,         setAdding]         = useState(false);
  const [deletingId,     setDeletingId]     = useState<number | null>(null);
  const [stockWarning,   setStockWarning]   = useState('');

  const handleAdd = async () => {
    if (!rmeId) { toast.error('Simpan RME terlebih dahulu sebelum menambah resep'); return; }
    if (!selectedProduk) return;
    setAdding(true);
    setStockWarning('');

    const produk = produkList.find((p) => p.id === parseInt(selectedProduk));
    const qty    = parseInt(jumlah) || 1;
    if (produk && qty > produk.stok) {
      setStockWarning(`Stok ${produk.nama_produk} tersisa ${produk.stok}, permintaan ${qty}`);
    }

    try {
      const res = await fetch(`/api/rme/${rmeId}/resep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_produk: parseInt(selectedProduk), jumlah: qty, dosis, aturan_pakai: aturan, keterangan }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Gagal menambah resep');
      setSelectedProduk(''); setJumlah('1'); setDosis(''); setAturan(''); setKeterangan('');
      toast.success('Resep berhasil ditambahkan');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah resep');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!rmeId) return;
    setDeletingId(id);
    try {
      await fetch(`/api/rme/${rmeId}/resep/${id}`, { method: 'DELETE' });
      toast.success('Item resep dihapus');
      onChanged();
    } catch {
      toast.error('Gagal menghapus item resep');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Resep</CardTitle></CardHeader>
      <CardContent className="space-y-4">

        {/* Table */}
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-center">Jumlah</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Aturan Pakai</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                  {editable && <TableHead className="w-16" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id ?? idx}>
                    <TableCell className="font-medium">{item.nama_produk}</TableCell>
                    <TableCell className="text-center">{item.jumlah}</TableCell>
                    <TableCell>{item.dosis || '-'}</TableCell>
                    <TableCell>{item.aturan_pakai || '-'}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(item.harga_jual)}</TableCell>
                    <TableCell className="text-center">
                      <span className={item.stok < 5 ? 'text-yellow-600 font-medium' : ''}>{item.stok}</span>
                    </TableCell>
                    {editable && (
                      <TableCell>
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-red-500"
                          disabled={deletingId === item.id}
                          onClick={() => item.id && handleDelete(item.id)}
                        >
                          {deletingId === item.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Belum ada resep</p>
        )}

        {/* Stock warning */}
        {stockWarning && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {stockWarning}
          </div>
        )}

        {/* Add form */}
        {editable && (
          <>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-3`}>
              <div className="space-y-1">
                <Label className="text-xs">Produk</Label>
                <select
                  value={selectedProduk}
                  onChange={(e) => setSelectedProduk(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih produk...</option>
                  {produkList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama_produk} (Stok: {p.stok})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Jumlah</Label>
                <Input type="number" min="1" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dosis</Label>
                <Input value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="cth: 500mg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Aturan Pakai</Label>
                <Input value={aturan} onChange={(e) => setAturan(e.target.value)} placeholder="cth: 3x sehari" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Keterangan</Label>
                <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Opsional" />
              </div>
              <div className="flex items-end">
                <Button type="button" size="sm" onClick={handleAdd} disabled={adding || !selectedProduk}>
                  {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Tambah Item
                </Button>
              </div>
            </div>
            {!rmeId && (
              <p className="text-xs text-gray-400">Simpan RME sebagai draft terlebih dahulu untuk menambah resep.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
