'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Stethoscope, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fmtCurrency} from './rme-helpers';
import { TindakanItem, Layanan } from '@/types/api-items';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';


interface TindakanCardProps {
  rmeId:        number | null;
  items:        TindakanItem[];
  layananList:  Layanan[];
  paketLayananList?: any[];
  editable?:    boolean;
  /** Called after successful add/delete so parent can refetch or update local state */
  onChanged:    () => void;
}

export function TindakanCard({ rmeId, items, layananList, paketLayananList = [], editable = true, onChanged }: TindakanCardProps) {
  const isMobile = useIsMobile();
  const [selectedLayanan, setSelectedLayanan] = useState('');
  const [usePaket,        setUsePaket]        = useState(false);
  const [keterangan,      setKeterangan]      = useState('');
  const [adding,          setAdding]          = useState(false);
  const [deletingId,      setDeletingId]      = useState<number | null>(null);

  const handleAdd = async () => {
    if (!rmeId) { toast.error('Simpan RME terlebih dahulu sebelum menambah tindakan'); return; }
    if (!selectedLayanan) return;
    setAdding(true);
    try {
      const payload: any = { keterangan };
      if (usePaket) {
        payload.id_paket_layanan = parseInt(selectedLayanan);
      } else {
        payload.id_layanan = parseInt(selectedLayanan);
      }

      const res = await fetch(`/api/rme/${rmeId}/tindakan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Gagal menambah tindakan');
      setSelectedLayanan(''); setKeterangan('');
      toast.success('Tindakan berhasil ditambahkan');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah tindakan');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!rmeId) return;
    setDeletingId(id);
    try {
      await fetch(`/api/rme/${rmeId}/tindakan/${id}`, { method: 'DELETE' });
      toast.success('Tindakan dihapus');
      onChanged();
    } catch {
      toast.error('Gagal menghapus tindakan');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          Tindakan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Table */}
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Layanan</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead>Keterangan</TableHead>
                  {editable && <TableHead className="w-16" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id ?? idx}>
                    <TableCell className="font-medium">{item.nama_layanan}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(item.harga_saat_itu)}</TableCell>
                    <TableCell>{item.keterangan || '-'}</TableCell>
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
          <p className="text-sm text-gray-400 text-center py-4">Belum ada tindakan</p>
        )}

        {/* Add form */}
        {editable && (
          <>
            <div className="flex items-center space-x-2 mb-2">
              <Switch id="use-paket-tindakan" checked={usePaket} onCheckedChange={(val) => { setUsePaket(val); setSelectedLayanan(''); }} />
              <Label htmlFor="use-paket-tindakan">Gunakan Paket Layanan</Label>
            </div>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-3`}>
              <div className="space-y-1 w-full">
                <Label className="text-xs">{usePaket ? 'Paket Layanan' : 'Layanan'}</Label>
                <select
                  value={selectedLayanan}
                  onChange={(e) => setSelectedLayanan(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih {usePaket ? 'paket...' : 'layanan...'}</option>
                  {usePaket ? paketLayananList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_paket} — {fmtCurrency(p.harga_total)} ({p.total_kunjungan}x)
                    </option>
                  )) : layananList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nama_layanan} — {fmtCurrency(l.harga)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 w-full">
                <Label className="text-xs">Keterangan</Label>
                <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Opsional" />
              </div>
              <Button className="w-full sm:w-auto" type="button" size="sm" onClick={handleAdd} disabled={adding || !selectedLayanan}>
                {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Tambah
              </Button>
            </div>
            {!rmeId && (
              <p className="text-xs text-gray-400">Simpan RME sebagai draft terlebih dahulu untuk menambah tindakan.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
