'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Spesialisasi } from '@/types/api-items';

export default function SpesialisasiPage() {
  const [data, setData] = useState<Spesialisasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Spesialisasi | null>(null);
  const [form, setForm] = useState({ nama_spesialisasi: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/spesialisasi');
      const result = await res.json();
      setData(result.data || []);
    } catch (error) {
      console.error('[SpesialisasiPage] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await fetch(`/api/master/spesialisasi/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        toast.success('Spesialisasi berhasil diupdate');
      } else {
        await fetch('/api/master/spesialisasi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        toast.success('Spesialisasi berhasil ditambahkan');
      }
      setDialogOpen(false);
      setEditItem(null);
      setForm({ nama_spesialisasi: '' });
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan spesialisasi');
    }
  };

  const openEdit = (item: Spesialisasi) => {
    setEditItem(item);
    setForm({ nama_spesialisasi: item.nama_spesialisasi });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold">Manajemen Spesialisasi</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditItem(null); setForm({ nama_spesialisasi: '' }); setDialogOpen(true); }} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Spesialisasi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Spesialisasi' : 'Tambah Spesialisasi'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Spesialisasi</Label>
                <Input value={form.nama_spesialisasi} onChange={(e) => setForm({ ...form, nama_spesialisasi: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Spesialisasi</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Spesialisasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-gray-500">Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-gray-500">Tidak ada data</TableCell></TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nama_spesialisasi}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
