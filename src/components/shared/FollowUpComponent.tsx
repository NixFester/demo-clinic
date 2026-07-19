'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/Pagination';
import { ExternalLink, Check, Plus, Loader2, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogDescription } from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { generateWALink, formatDateTime } from '@/lib/helpers';
import { FollowUpListItem, PasienSearchItem, FollowUpStoreData, JenisFollowUp } from '@/types/api-items';

const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return '62' + digits;
};

const jenisOptions: { value: JenisFollowUp; label: string }[] = [
  { value: 'konfirmasi', label: 'Konfirmasi Jadwal' },
  { value: 'pengingat', label: 'Pengingat Kunjungan' },
  { value: 'pascakunjungan', label: 'Pascakunjungan' },
  { value: 'kontrol', label: 'Kontrol/Ulangi' },
];

const messageTemplates: Record<string, string> = {
  konfirmasi: 'Halo {nama}, ini dari Elrhea Clinic. Kami ingin mengkonfirmasi jadwal kunjungan Anda. Mohon konfirmasi ketersediaan Anda. Terima kasih.',
  pengingat: 'Halo {nama}, ini pengingat dari Elrhea Clinic. Kunjungan Anda dijadwalkan besok. Mohon hadir tepat waktu. Terima kasih.',
  pascakunjungan: 'Halo {nama}, terima kasih telah mengunjungi Elrhea Clinic. Semoga lekas sembuh! Jika ada keluhan, jangan ragu untuk menghubungi kami.',
  kontrol: 'Halo {nama}, ini pengingat dari Elrhea Clinic. Sudah waktunya untuk kontrol ulang. Silakan buat janji kunjungan kembali. Terima kasih.',
};

function getStatusBadge(status: string) {
  const map: Record<string, { className: string }> = {
    menunggu: { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
    terkirim: { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    gagal: { className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  };
  const config = map[status] || { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
  return <Badge variant="secondary" className={config.className}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

interface FollowUpComponentProps {
  /** 'antrian' fetches today's patients from /api/antrian (karyawan).
   *  'pasien' fetches all patients from /api/pasien (admin). */
  pasienSource?: 'antrian' | 'pasien';
}

const emptyForm: FollowUpStoreData = {
  id_pasien: 0,
  id_pengguna: 0,
  no_whatsapp: '',
  jenis: 'konfirmasi',
  pesan: '',
  wa_link: '',
};

export default function FollowUpComponent({ pasienSource = 'pasien' }: FollowUpComponentProps) {
  const [data, setData] = useState<FollowUpListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pasienList, setPasienList] = useState<PasienSearchItem[]>([]);
  const [form, setForm] = useState<FollowUpStoreData>(emptyForm);

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/followup?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[FollowUpComponent] Error:', err);
      setError('Gagal memuat data follow-up');
    } finally {
      setLoading(false);
    }
  };

  const fetchPasien = async () => {
    try {
      if (pasienSource === 'antrian') {
        const res = await fetch('/api/antrian');
        const result = await res.json();
        const antrianList = result.data || [];
        const uniquePasien: PasienSearchItem[] = [];
        const seen = new Set<number>();
        for (const item of antrianList) {
          if (item.id_pasien && !seen.has(item.id_pasien)) {
            seen.add(item.id_pasien);
            uniquePasien.push({
              id: item.id_pasien,
              nama_lengkap: item.nama_pasien,
              no_whatsapp: item.no_whatsapp,
              no_rekam_medis: item.no_rekam_medis,
              nik: item.nik,
              no_telepon: item.no_telepon,
            });
          }
        }
        if (uniquePasien.length > 0) {
          setPasienList(uniquePasien);
          return;
        }
        // Fall through to /api/pasien if antrian is empty
      }
      const res = await fetch('/api/pasien?page=1');
      const result = await res.json();
      setPasienList(result.data || []);
    } catch (err) {
      console.error('[FollowUpComponent] Pasien error:', err);
    }
  };

  useEffect(() => { fetchData(); fetchPasien(); }, [page]);

const handleJenisChange = (jenis: JenisFollowUp) => {
  const pasien = pasienList.find(p => String(p.id) === String(form.id_pasien));
  const nama = pasien?.nama_lengkap || '{nama}';
  const template = (messageTemplates[jenis] ?? '').replace('{nama}', nama);
  const wa = pasien?.no_whatsapp ? normalizePhone(pasien.no_whatsapp) : '';
  setForm({ ...form, jenis, pesan: template, no_whatsapp: wa, wa_link: wa ? generateWALink(wa, template) : '' });
};
const handlePasienChange = (id: string) => {
  const pasien = pasienList.find(p => String(p.id) === String(id));
  if (!pasien) {
    setForm({ ...form, id_pasien: Number(id), no_whatsapp: '', pesan: '', wa_link: '' });
    return;
  }
  const nama = pasien.nama_lengkap;
  const template = (messageTemplates[form.jenis] ?? '').replace('{nama}', nama);
  const wa = pasien.no_whatsapp ? normalizePhone(pasien.no_whatsapp) : '';
  setForm({
    ...form,
    id_pasien: Number(id),
    no_whatsapp: wa,
    pesan: template,
    wa_link: wa ? generateWALink(wa, template) : '',
  });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success('Follow-up berhasil dibuat');
      setDialogOpen(false);
      setForm(emptyForm);
      fetchData();
    } catch {
      toast.error('Gagal membuat follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSent = async (id: number) => {
    try {
      await fetch(`/api/followup/${id}/terkirim`, { method: 'PATCH' });
      toast.success('Follow-up ditandai terkirim');
      fetchData();
    } catch {
      toast.error('Gagal mengupdate status');
    }
  };

  const handleKirimWA = (item: FollowUpListItem) => {
    if (!item.no_whatsapp) {
      toast.error('Pasien tidak memiliki nomor WhatsApp');
      return;
    }
    window.open(generateWALink(item.no_whatsapp, item.pesan), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Follow-up WhatsApp</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button
            onClick={() => {
              setForm(emptyForm);
              fetchPasien();
              setDialogOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Follow-up
          </Button>
          <DialogContent className="max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Buat Follow-up Baru</DialogTitle>
            </DialogHeader>
            <DialogDescription />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Pasien{pasienSource === 'antrian' ? ' (Kunjungan Hari Ini)' : ''}</Label>
                <select
                  value={form.id_pasien || ''}
                  onChange={(e) => handlePasienChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Pilih pasien...</option>
                  {pasienList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama_lengkap} ({p.nik})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Jenis Follow-up</Label>
                <select
                  value={form.jenis}
                  onChange={(e) => handleJenisChange(e.target.value as JenisFollowUp)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {jenisOptions.map(j => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Pesan</Label>
                <Textarea
                  value={form.pesan}
                  onChange={(e) => setForm({ ...form, pesan: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              {form.id_pasien > 0 && form.pesan && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 mb-2">Pratinjau tautan WhatsApp:</p>
                  <a
                    href={generateWALink(form.no_whatsapp || '', form.pesan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 underline break-all"
                  >
                    Buka WhatsApp →
                  </a>
                </div>
              )}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Buat Follow-up
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Riwayat Follow-up</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada follow-up</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Pesan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_pasien}</TableCell>
                      <TableCell>{jenisOptions.find(j => j.value === item.jenis_followup)?.label || item.jenis_followup}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.pesan}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.no_whatsapp && (
                            <Button size="sm" variant="outline" onClick={() => handleKirimWA(item)}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Kirim WA
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}