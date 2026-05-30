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
import { Plus, Pencil, ToggleLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Pengguna } from '@/types/api-items';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
 } from '@/components/ui/accordion';

export default function PenggunaPage() {
  const [data, setData] = useState<Pengguna[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<Pengguna | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_lengkap: '', username: '', password: '', role: 'karyawan' });

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/master/pengguna?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setTotal(result.total || 0);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[PenggunaPage] Error:', err);
      setError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        const res = await fetch(`/api/master/pengguna/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        toast.success('Pengguna berhasil diupdate');
      } else {
        const res = await fetch('/api/master/pengguna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        toast.success('Pengguna berhasil ditambahkan');
      }
      setDialogOpen(false);
      setEditUser(null);
      setForm({ nama_lengkap: '', username: '', password: '', role: 'karyawan' });
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await fetch(`/api/master/pengguna/${id}/toggle`, { method: 'PATCH' });
      toast.success('Status berhasil diubah');
      fetchData();
    } catch (err) {
      toast.error('Gagal mengubah status');
    }
  };

  const openEdit = (user: Pengguna) => {
    setEditUser(user);
    setForm({
      nama_lengkap: user.nama_lengkap,
      username: user.username,
      password: '',
      role: user.role,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ nama_lengkap: '', username: '', password: '', role: 'karyawan' });
    setDialogOpen(true);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'dokter': return 'Dokter';
      case 'karyawan': return 'Karyawan';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={!!editUser} />
              </div>
              <div className="space-y-2">
                <Label>{editUser ? 'Password (kosongkan jika tidak diubah)' : 'Password'}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editUser} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="admin">Administrator</option>
                  <option value="dokter">Dokter</option>
                  <option value="karyawan">Karyawan</option>
                </select>
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Daftar Pengguna ({total})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data...</span>
            </div>
          ) : (
            <div>
              {/* Karyawan Aktif */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.filter((user) => user.is_aktif == 1).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        Tidak ada data aktif
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.filter((user) => user.is_aktif == 1).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.nama_lengkap}
                        </TableCell>

                        <TableCell>{user.username}</TableCell>

                        <TableCell>{getRoleLabel(user.role)}</TableCell>

                        <TableCell>
                          <StatusBadge status="Aktif" />
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(user)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleToggle(user.id)}
                            >
                              <ToggleLeft className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination
                currentPage={page}
                totalPages={lastPage}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Karyawan Non-Aktif ({data.filter((user) => user.is_aktif == 0).length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {data.filter((user) => user.is_aktif == 0).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data karyawan non-aktif
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.filter((user) => user.is_aktif == 0).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.nama_lengkap}
                    </TableCell>

                    <TableCell>{user.username}</TableCell>

                    <TableCell>{getRoleLabel(user.role)}</TableCell>

                    <TableCell>
                      <StatusBadge status="Non-Aktif" />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleToggle(user.id)}
                        >
                          <ToggleLeft className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
