'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ResepItem {
  id?: number;
  id_produk: number;
  nama_produk: string;
  jumlah: number;
  dosis: string;
  aturan_pakai: string;
  keterangan: string;
  harga_jual: number;
  stok: number;
}

interface ProdukOption {
  id: number;
  nama_produk: string;
  harga_jual: number;
  stok: number;
}

interface ResepFormProps {
  rmeId: number;
  resepData: { id?: number; items: ResepItem[] } | null;
  onUpdate: () => void;
  readOnly?: boolean;
}

export function ResepForm({ rmeId, resepData, onUpdate, readOnly }: ResepFormProps) {
  const [produkList, setProdukList] = useState<ProdukOption[]>([]);
  const [selectedProduk, setSelectedProduk] = useState('');
  const [jumlah, setJumlah] = useState('1');
  const [dosis, setDosis] = useState('');
  const [aturanPakai, setAturanPakai] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockWarning, setStockWarning] = useState('');

  const items = resepData?.items || [];

  const fetchProduk = async () => {
    try {
      const res = await fetch('/api/master/produk?aktif=true');
      const data = await res.json();
      setProdukList(data.data || []);
    } catch (error) {
      console.error('[ResepForm] Error fetching produk:', error);
    }
  };

  useState(() => { fetchProduk(); });

  const handleAdd = async () => {
    if (!selectedProduk) return;
    setLoading(true);
    setStockWarning('');

    const produk = produkList.find(p => p.id === parseInt(selectedProduk));
    const qty = parseInt(jumlah);

    if (produk && qty > produk.stok) {
      setStockWarning(`Stok ${produk.nama_produk} tersisa ${produk.stok}, permintaan ${qty}`);
    }

    try {
      await fetch(`/api/rme/${rmeId}/resep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_produk: parseInt(selectedProduk),
          jumlah: qty,
          dosis,
          aturan_pakai: aturanPakai,
          keterangan,
        }),
      });
      setSelectedProduk('');
      setJumlah('1');
      setDosis('');
      setAturanPakai('');
      setKeterangan('');
      onUpdate();
    } catch (error) {
      console.error('[ResepForm] Error adding resep item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await fetch(`/api/rme/${rmeId}/resep/${itemId}`, { method: 'DELETE' });
      onUpdate();
    } catch (error) {
      console.error('[ResepForm] Error deleting resep item:', error);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Resep</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Dosis</TableHead>
                <TableHead>Aturan Pakai</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                {!readOnly && <TableHead className="w-16"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nama_produk}</TableCell>
                  <TableCell>{item.jumlah}</TableCell>
                  <TableCell>{item.dosis || '-'}</TableCell>
                  <TableCell>{item.aturan_pakai || '-'}</TableCell>
                  <TableCell>Rp {Number(item.harga_jual).toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <span className={item.stok < 5 ? 'text-yellow-600 font-medium' : ''}>
                      {item.stok}
                    </span>
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => item.id && handleDelete(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {stockWarning && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {stockWarning}
          </div>
        )}

        {!readOnly && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                <Input value={aturanPakai} onChange={(e) => setAturanPakai(e.target.value)} placeholder="cth: 3x sehari" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Keterangan</Label>
                <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Opsional" />
              </div>
            </div>
            <Button type="button" size="sm" onClick={handleAdd} disabled={loading || !selectedProduk}>
              <Plus className="h-4 w-4 mr-1" />
              Tambah Item
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
