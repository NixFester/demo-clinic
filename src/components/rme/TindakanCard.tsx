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


interface TindakanCardProps {
  rmeId:        number | null;
  items:        TindakanItem[];
  layananList:  Layanan[];
  editable?:    boolean;
  /** Called after successful add/delete so parent can refetch or update local state */
  onChanged:    () => void;
}

export function TindakanCard({ rmeId, items, layananList, editable = true, onChanged }: TindakanCardProps) {
  const isMobile = useIsMobile();
  const [selectedLayanan, setSelectedLayanan] = useState('');
  const [keterangan,      setKeterangan]      = useState('');
  const [adding,          setAdding]          = useState(false);
  const [deletingId,      setDeletingId]      = useState<number | null>(null);

  const handleAdd = async () => {
    if (!rmeId) { toast.error('Simpan RME terlebih dahulu sebelum menambah tindakan'); return; }
    if (!selectedLayanan) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/rme/${rmeId}/tindakan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_layanan: parseInt(selectedLayanan), keterangan }),
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
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-3`}>
              <div className="space-y-1 w-full">
                <Label className="text-xs">Layanan</Label>
                <select
                  value={selectedLayanan}
                  onChange={(e) => setSelectedLayanan(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih layanan...</option>
                  {layananList.map((l) => (
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
