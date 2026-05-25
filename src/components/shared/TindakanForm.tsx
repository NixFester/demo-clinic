'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TindakanItem {
  id?: number;
  id_layanan: number;
  nama_layanan: string;
  harga_saat_itu: number;
  keterangan: string;
}

interface LayananOption {
  id: number;
  nama_layanan: string;
  kategori: string;
  harga: number;
}

interface TindakanFormProps {
  rmeId: number;
  items: TindakanItem[];
  onUpdate: () => void;
  readOnly?: boolean;
}

export function TindakanForm({ rmeId, items, onUpdate, readOnly }: TindakanFormProps) {
  const [layananList, setLayananList] = useState<LayananOption[]>([]);
  const [selectedLayanan, setSelectedLayanan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLayanan = async () => {
    try {
      const res = await fetch('/api/master/layanan?aktif=true');
      const data = await res.json();
      setLayananList(data.data || []);
    } catch (error) {
      console.error('[TindakanForm] Error fetching layanan:', error);
    }
  };

  useState(() => { fetchLayanan(); });

  const handleAdd = async () => {
    if (!selectedLayanan) return;
    setLoading(true);
    try {
      await fetch(`/api/rme/${rmeId}/tindakan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_layanan: parseInt(selectedLayanan),
          keterangan,
        }),
      });
      setSelectedLayanan('');
      setKeterangan('');
      onUpdate();
    } catch (error) {
      console.error('[TindakanForm] Error adding tindakan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tindakanId: number) => {
    try {
      await fetch(`/api/rme/${rmeId}/tindakan/${tindakanId}`, { method: 'DELETE' });
      onUpdate();
    } catch (error) {
      console.error('[TindakanForm] Error deleting tindakan:', error);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tindakan</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Keterangan</TableHead>
                {!readOnly && <TableHead className="w-16"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nama_layanan}</TableCell>
                  <TableCell>Rp {Number(item.harga_saat_itu).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{item.keterangan || '-'}</TableCell>
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

        {!readOnly && (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Layanan</Label>
              <select
                value={selectedLayanan}
                onChange={(e) => setSelectedLayanan(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih layanan...</option>
                {layananList.map((l) => (
                  <option key={l.id} value={l.id}>{l.nama_layanan} - Rp {Number(l.harga).toLocaleString('id-ID')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 flex-1 min-w-[150px]">
              <Label className="text-xs">Keterangan</Label>
              <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Opsional" />
            </div>
            <Button type="button" size="sm" onClick={handleAdd} disabled={loading || !selectedLayanan}>
              <Plus className="h-4 w-4 mr-1" />
              Tambah
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
