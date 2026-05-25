'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  FileCheck,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';

/* ───────── helpers ───────── */
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

function statusBadge(status: string) {
  const m: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dipanggil: 'bg-blue-100 text-blue-800 border-blue-300',
    selesai: 'bg-green-100 text-green-800 border-green-300',
    batal: 'bg-red-100 text-red-800 border-red-300',
    draft: 'bg-gray-100 text-gray-800 border-gray-300',
    final: 'bg-green-100 text-green-800 border-green-300',
  };
  return m[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getStatusLabel(status: string) {
  const m: Record<string, string> = {
    menunggu: 'Menunggu',
    dipanggil: 'Dipanggil',
    selesai: 'Selesai',
    batal: 'Batal',
    draft: 'Draft',
    final: 'Final',
  };
  return m[status] || status;
}

/* ───────── interfaces ───────── */
interface DiagnosaOption {
  id: number;
  kode_icd10: string;
  nama_diagnosa: string;
}

interface LayananOption {
  id: number;
  nama_layanan: string;
  kategori: string;
  harga: number;
}

interface ProdukOption {
  id: number;
  nama_produk: string;
  harga_jual: number;
  stok: number;
}

interface TindakanRow {
  id: number;
  id_layanan: number;
  nama_layanan: string;
  harga_saat_itu: number;
  keterangan: string;
}

interface ResepRow {
  id: number;
  id_produk: number;
  nama_produk: string;
  jumlah: number;
  dosis: string;
  aturan_pakai: string;
  keterangan: string;
  harga_jual: number;
  stok: number;
}

interface RMEData {
  id: number;
  id_pendaftaran: number;
  id_pasien: number;
  id_dokter: number;
  nama_pasien: string;
  no_rekam_medis: string;
  status: string;
  subjektif: string;
  objektif: string;
  assesment: string;
  plan: string;
  kondisi_masuk: string;
  kondisi_keluar: string;
  instruksi_tindak_lanjut: string;
  id_diagnosa_utama: number | null;
  id_diagnosa_sekunder: number | null;
  kode_diagnosa_utama: string;
  nama_diagnosa_utama: string;
  kode_diagnosa_sekunder: string;
  nama_diagnosa_sekunder: string;
  tindakan: TindakanRow[];
  resep: { id?: number; items: ResepRow[] } | null;
}

/* ───────── component ───────── */
export default function DokterRMEDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rmeIdParam = params.id as string;

  const [rme, setRme] = useState<RMEData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);

  /* ── SOAP form ── */
  const [soap, setSoap] = useState({
    subjektif: '',
    objektif: '',
    assesment: '',
    plan: '',
    kondisi_masuk: '',
    kondisi_keluar: '',
    instruksi_tindak_lanjut: '',
  });
  const [idDiagnosaUtama, setIdDiagnosaUtama] = useState<number | null>(null);
  const [idDiagnosaSekunder, setIdDiagnosaSekunder] = useState<number | null>(null);

  /* ── Diagnosa search ── */
  const [diagQuery, setDiagQuery] = useState('');
  const [diagResults, setDiagResults] = useState<DiagnosaOption[]>([]);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagTarget, setDiagTarget] = useState<'utama' | 'sekunder'>('utama');
  const [selectedDiagUtama, setSelectedDiagUtama] = useState<DiagnosaOption | null>(null);
  const [selectedDiagSekunder, setSelectedDiagSekunder] = useState<DiagnosaOption | null>(null);

  /* ── Tindakan ── */
  const [tindakanList, setTindakanList] = useState<LayananOption[]>([]);
  const [selectedLayanan, setSelectedLayanan] = useState('');
  const [ketTindakan, setKetTindakan] = useState('');
  const [addingTindakan, setAddingTindakan] = useState(false);

  /* ── Resep ── */
  const [produkList, setProdukList] = useState<ProdukOption[]>([]);
  const [selectedProduk, setSelectedProduk] = useState('');
  const [resepJumlah, setResepJumlah] = useState('1');
  const [resepDosis, setResepDosis] = useState('');
  const [resepAturan, setResepAturan] = useState('');
  const [resepKet, setResepKet] = useState('');
  const [addingResep, setAddingResep] = useState(false);
  const [stockWarning, setStockWarning] = useState('');

  /* ───────── fetch RME ───────── */
  const fetchRme = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/rme/${rmeIdParam}`);
      if (!res.ok) throw new Error('Gagal memuat data RME');
      const data = await res.json();
      const rmeData = data.data || data;
      setRme(rmeData);

      // Populate form
      setSoap({
        subjektif: rmeData.subjektif || '',
        objektif: rmeData.objektif || '',
        assesment: rmeData.assesment || '',
        plan: rmeData.plan || '',
        kondisi_masuk: rmeData.kondisi_masuk || '',
        kondisi_keluar: rmeData.kondisi_keluar || '',
        instruksi_tindak_lanjut: rmeData.instruksi_tindak_lanjut || '',
      });
      setIdDiagnosaUtama(rmeData.id_diagnosa_utama || null);
      setIdDiagnosaSekunder(rmeData.id_diagnosa_sekunder || null);

      if (rmeData.kode_diagnosa_utama) {
        setSelectedDiagUtama({
          id: rmeData.id_diagnosa_utama,
          kode_icd10: rmeData.kode_diagnosa_utama,
          nama_diagnosa: rmeData.nama_diagnosa_utama,
        });
      }
      if (rmeData.kode_diagnosa_sekunder) {
        setSelectedDiagSekunder({
          id: rmeData.id_diagnosa_sekunder,
          kode_icd10: rmeData.kode_diagnosa_sekunder,
          nama_diagnosa: rmeData.nama_diagnosa_sekunder,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [rmeIdParam]);

  const fetchLayanan = useCallback(async () => {
    try {
      const res = await fetch('/api/master/layanan?aktif=true');
      const data = await res.json();
      setTindakanList(data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchProduk = useCallback(async () => {
    try {
      const res = await fetch('/api/master/produk?aktif=true');
      const data = await res.json();
      setProdukList(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchRme();
    fetchLayanan();
    fetchProduk();
  }, [fetchRme, fetchLayanan, fetchProduk]);

  /* ───────── diagnosa search ───────── */
  useEffect(() => {
    if (!diagQuery || diagQuery.length < 2) {
      setDiagResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setDiagLoading(true);
      try {
        const res = await fetch(`/api/master/diagnosa?q=${encodeURIComponent(diagQuery)}`);
        const data = await res.json();
        setDiagResults(data.data || []);
      } catch {
        setDiagResults([]);
      } finally {
        setDiagLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [diagQuery]);

  const handleSelectDiagnosa = (d: DiagnosaOption) => {
    if (diagTarget === 'utama') {
      setSelectedDiagUtama(d);
      setIdDiagnosaUtama(d.id);
    } else {
      setSelectedDiagSekunder(d);
      setIdDiagnosaSekunder(d.id);
    }
    setDiagQuery('');
    setDiagResults([]);
  };

  /* ───────── save draft ───────── */
  const handleSaveDraft = async () => {
    if (!rme) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        subjektif: soap.subjektif,
        objektif: soap.objektif,
        assesment: soap.assesment,
        plan: soap.plan,
        kondisi_masuk: soap.kondisi_masuk,
        kondisi_keluar: soap.kondisi_keluar,
        instruksi_tindak_lanjut: soap.instruksi_tindak_lanjut,
      };
      if (idDiagnosaUtama) body.id_diagnosa_utama = idDiagnosaUtama;
      if (idDiagnosaSekunder) body.id_diagnosa_sekunder = idDiagnosaSekunder;

      const res = await fetch(`/api/rme/${rme.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan RME');
      toast.success('RME berhasil disimpan');
      fetchRme();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan RME');
    } finally {
      setSaving(false);
    }
  };

  /* ───────── add tindakan ───────── */
  const handleAddTindakan = async () => {
    if (!rme || !selectedLayanan) return;
    setAddingTindakan(true);
    try {
      const res = await fetch(`/api/rme/${rme.id}/tindakan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_layanan: parseInt(selectedLayanan), keterangan: ketTindakan }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menambah tindakan');
      setSelectedLayanan('');
      setKetTindakan('');
      toast.success('Tindakan berhasil ditambahkan');
      fetchRme();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah tindakan');
    } finally {
      setAddingTindakan(false);
    }
  };

  /* ───────── delete tindakan ───────── */
  const handleDeleteTindakan = async (tindakanId: number) => {
    if (!rme) return;
    try {
      await fetch(`/api/rme/${rme.id}/tindakan/${tindakanId}`, { method: 'DELETE' });
      toast.success('Tindakan dihapus');
      fetchRme();
    } catch {
      toast.error('Gagal menghapus tindakan');
    }
  };

  /* ───────── add resep ───────── */
  const handleAddResep = async () => {
    if (!rme || !selectedProduk) return;
    setAddingResep(true);
    setStockWarning('');

    const produk = produkList.find((p) => p.id === parseInt(selectedProduk));
    const qty = parseInt(resepJumlah) || 1;

    if (produk && qty > produk.stok) {
      setStockWarning(`Stok ${produk.nama_produk} tersisa ${produk.stok}, permintaan ${qty}`);
    }

    try {
      const res = await fetch(`/api/rme/${rme.id}/resep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_produk: parseInt(selectedProduk),
          jumlah: qty,
          dosis: resepDosis,
          aturan_pakai: resepAturan,
          keterangan: resepKet,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menambah resep');
      setSelectedProduk('');
      setResepJumlah('1');
      setResepDosis('');
      setResepAturan('');
      setResepKet('');
      toast.success('Resep berhasil ditambahkan');
      fetchRme();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah resep');
    } finally {
      setAddingResep(false);
    }
  };

  /* ───────── delete resep ───────── */
  const handleDeleteResep = async (itemId: number) => {
    if (!rme) return;
    try {
      await fetch(`/api/rme/${rme.id}/resep/${itemId}`, { method: 'DELETE' });
      toast.success('Item resep dihapus');
      fetchRme();
    } catch {
      toast.error('Gagal menghapus item resep');
    }
  };

  /* ───────── finalisasi ───────── */
  const handleFinalisasi = async () => {
    if (!rme) return;
    setFinalizing(true);
    try {
      const res = await fetch(`/api/rme/${rme.id}/finalisasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pendaftaran: rme.id_pendaftaran }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memfinalisasi RME');
      toast.success('RME berhasil difinalisasi');
      setShowFinalDialog(false);
      fetchRme();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memfinalisasi RME');
    } finally {
      setFinalizing(false);
    }
  };

  /* ───────── loading ───────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-500">Memuat data RME...</span>
      </div>
    );
  }

  if (error || !rme) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Detail RME</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error || 'RME tidak ditemukan'}
        </div>
      </div>
    );
  }

  const isDraft = rme.status === 'draft';
  const isFinal = rme.status === 'final';
  const tindakanItems: TindakanRow[] = (rme.tindakan as TindakanRow[]) || [];
  const resepItems: ResepRow[] = (rme.resep as { items?: ResepRow[] })?.items || [];

  /* ───────── render ───────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">RME — {rme.nama_pasien}</h1>
            <p className="text-sm text-gray-500">No. RM: {rme.no_rekam_medis}</p>
          </div>
        </div>
        <Badge variant="outline" className={statusBadge(rme.status)}>
          {getStatusLabel(rme.status)}
        </Badge>
      </div>

      {/* ═══════ SOAP Notes ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SOAP Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>S - Subjektif</Label>
            {isDraft ? (
              <Textarea
                value={soap.subjektif}
                onChange={(e) => setSoap({ ...soap, subjektif: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm p-3 bg-gray-50 rounded-md min-h-[60px]">{soap.subjektif || '-'}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>O - Objektif</Label>
            {isDraft ? (
              <Textarea
                value={soap.objektif}
                onChange={(e) => setSoap({ ...soap, objektif: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm p-3 bg-gray-50 rounded-md min-h-[60px]">{soap.objektif || '-'}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>A - Assesment</Label>
            {isDraft ? (
              <Textarea
                value={soap.assesment}
                onChange={(e) => setSoap({ ...soap, assesment: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm p-3 bg-gray-50 rounded-md min-h-[60px]">{soap.assesment || '-'}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>P - Plan</Label>
            {isDraft ? (
              <Textarea
                value={soap.plan}
                onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm p-3 bg-gray-50 rounded-md min-h-[60px]">{soap.plan || '-'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════ Diagnosa ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diagnosa (ICD-10)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Diagnosa Utama</Label>
            {isDraft && !selectedDiagUtama ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari diagnosa utama ICD-10..."
                  value={diagQuery}
                  onChange={(e) => { setDiagQuery(e.target.value); setDiagTarget('utama'); }}
                  className="pl-9"
                  onFocus={() => setDiagTarget('utama')}
                />
                {diagLoading && diagTarget === 'utama' && <p className="text-xs text-gray-500 mt-1">Mencari...</p>}
                {diagResults.length > 0 && diagTarget === 'utama' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {diagResults.map((d) => (
                      <button key={d.id} type="button" onClick={() => handleSelectDiagnosa(d)} className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0">
                        <span className="font-mono text-blue-700 text-sm">{d.kode_icd10}</span> — {d.nama_diagnosa}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedDiagUtama || rme.kode_diagnosa_utama ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50 border-blue-200">
                <p className="flex-1 font-medium text-sm">
                  <span className="font-mono text-blue-700">{selectedDiagUtama?.kode_icd10 || rme.kode_diagnosa_utama}</span> — {selectedDiagUtama?.nama_diagnosa || rme.nama_diagnosa_utama}
                </p>
                {isDraft && (
                  <button type="button" onClick={() => { setSelectedDiagUtama(null); setIdDiagnosaUtama(null); }} className="text-xs text-red-500 hover:text-red-700">Ganti</button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Belum ada diagnosa utama</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Diagnosa Sekunder</Label>
            {isDraft && !selectedDiagSekunder ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari diagnosa sekunder ICD-10 (opsional)..."
                  value={diagTarget === 'sekunder' ? diagQuery : ''}
                  onChange={(e) => { setDiagQuery(e.target.value); setDiagTarget('sekunder'); }}
                  className="pl-9"
                  onFocus={() => setDiagTarget('sekunder')}
                />
                {diagLoading && diagTarget === 'sekunder' && <p className="text-xs text-gray-500 mt-1">Mencari...</p>}
                {diagResults.length > 0 && diagTarget === 'sekunder' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {diagResults.map((d) => (
                      <button key={d.id} type="button" onClick={() => handleSelectDiagnosa(d)} className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0">
                        <span className="font-mono text-blue-700 text-sm">{d.kode_icd10}</span> — {d.nama_diagnosa}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedDiagSekunder || rme.kode_diagnosa_sekunder ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50 border-blue-200">
                <p className="flex-1 font-medium text-sm">
                  <span className="font-mono text-blue-700">{selectedDiagSekunder?.kode_icd10 || rme.kode_diagnosa_sekunder}</span> — {selectedDiagSekunder?.nama_diagnosa || rme.nama_diagnosa_sekunder}
                </p>
                {isDraft && (
                  <button type="button" onClick={() => { setSelectedDiagSekunder(null); setIdDiagnosaSekunder(null); }} className="text-xs text-red-500 hover:text-red-700">Ganti</button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Belum ada diagnosa sekunder</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════ Kondisi & Tindak Lanjut ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kondisi & Tindak Lanjut</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kondisi Masuk</Label>
              {isDraft ? (
                <Input value={soap.kondisi_masuk} onChange={(e) => setSoap({ ...soap, kondisi_masuk: e.target.value })} />
              ) : (
                <p className="text-sm p-2 bg-gray-50 rounded-md">{soap.kondisi_masuk || '-'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Kondisi Keluar</Label>
              {isDraft ? (
                <Input value={soap.kondisi_keluar} onChange={(e) => setSoap({ ...soap, kondisi_keluar: e.target.value })} />
              ) : (
                <p className="text-sm p-2 bg-gray-50 rounded-md">{soap.kondisi_keluar || '-'}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Instruksi Tindak Lanjut</Label>
            {isDraft ? (
              <Textarea value={soap.instruksi_tindak_lanjut} onChange={(e) => setSoap({ ...soap, instruksi_tindak_lanjut: e.target.value })} rows={2} />
            ) : (
              <p className="text-sm p-2 bg-gray-50 rounded-md min-h-[40px]">{soap.instruksi_tindak_lanjut || '-'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════ Tindakan ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Tindakan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tindakanItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Layanan</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead>Keterangan</TableHead>
                    {isDraft && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tindakanItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_layanan}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(item.harga_saat_itu)}</TableCell>
                      <TableCell>{item.keterangan || '-'}</TableCell>
                      {isDraft && (
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDeleteTindakan(item.id)}>
                            <Trash2 className="h-3 w-3" />
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

          {isDraft && (
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label className="text-xs">Layanan</Label>
                <select value={selectedLayanan} onChange={(e) => setSelectedLayanan(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Pilih layanan...</option>
                  {tindakanList.map((l) => (
                    <option key={l.id} value={l.id}>{l.nama_layanan} — {fmtCurrency(l.harga)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 flex-1 min-w-[150px]">
                <Label className="text-xs">Keterangan</Label>
                <Input value={ketTindakan} onChange={(e) => setKetTindakan(e.target.value)} placeholder="Opsional" />
              </div>
              <Button type="button" size="sm" onClick={handleAddTindakan} disabled={addingTindakan || !selectedLayanan}>
                {addingTindakan ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Tambah
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ Resep ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resep</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resepItems.length > 0 ? (
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
                    {isDraft && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resepItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nama_produk}</TableCell>
                      <TableCell className="text-center">{item.jumlah}</TableCell>
                      <TableCell>{item.dosis || '-'}</TableCell>
                      <TableCell>{item.aturan_pakai || '-'}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(item.harga_jual)}</TableCell>
                      <TableCell className="text-center">
                        <span className={item.stok < 5 ? 'text-yellow-600 font-medium' : ''}>{item.stok}</span>
                      </TableCell>
                      {isDraft && (
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDeleteResep(item.id)}>
                            <Trash2 className="h-3 w-3" />
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

          {stockWarning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {stockWarning}
            </div>
          )}

          {isDraft && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Produk</Label>
                <select value={selectedProduk} onChange={(e) => setSelectedProduk(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Pilih produk...</option>
                  {produkList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama_produk} (Stok: {p.stok})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Jumlah</Label>
                <Input type="number" min="1" value={resepJumlah} onChange={(e) => setResepJumlah(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dosis</Label>
                <Input value={resepDosis} onChange={(e) => setResepDosis(e.target.value)} placeholder="cth: 500mg" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Aturan Pakai</Label>
                <Input value={resepAturan} onChange={(e) => setResepAturan(e.target.value)} placeholder="cth: 3x sehari" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Keterangan</Label>
                <Input value={resepKet} onChange={(e) => setResepKet(e.target.value)} placeholder="Opsional" />
              </div>
              <div className="flex items-end">
                <Button type="button" size="sm" onClick={handleAddResep} disabled={addingResep || !selectedProduk}>
                  {addingResep ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Tambah Item
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ Action Buttons (draft only) ═══════ */}
      {isDraft && (
        <div className="flex flex-wrap gap-3 sticky bottom-0 bg-gray-50 py-4 border-t">
          <Button onClick={handleSaveDraft} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Draft
          </Button>
          <Button variant="outline" onClick={() => setShowFinalDialog(true)} disabled={finalizing}>
            <FileCheck className="h-4 w-4 mr-2" />
            Finalisasi
          </Button>
        </div>
      )}

      {/* ═══════ Read-only notice (final) ═══════ */}
      {isFinal && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">RME Telah Difinalisasi</p>
              <p className="text-sm text-green-600">Dokumen ini bersifat read-only dan tidak dapat diubah.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════ Finalisasi Dialog ═══════ */}
      <Dialog open={showFinalDialog} onOpenChange={setShowFinalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Finalisasi RME</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin memfinalisasi RME ini? Setelah difinalisasi, data tidak dapat diubah kembali.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Pastikan semua data SOAP, diagnosa, tindakan, dan resep sudah lengkap sebelum finalisasi.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinalDialog(false)} disabled={finalizing}>
              Batal
            </Button>
            <Button onClick={handleFinalisasi} disabled={finalizing} className="bg-emerald-600 hover:bg-emerald-700">
              {finalizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCheck className="h-4 w-4 mr-2" />}
              Ya, Finalisasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
