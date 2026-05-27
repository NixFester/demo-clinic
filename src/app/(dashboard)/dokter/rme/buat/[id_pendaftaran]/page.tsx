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

/* ───────── interfaces ───────── */
interface PendaftaranData {
  id: number;
  id_pasien: number;
  id_dokter: number;
  nama_pasien: string;
  no_rekam_medis: string;
  nama_layanan: string;
  keluhan_utama: string;
}

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
  id?: number;
  id_layanan: number;
  nama_layanan: string;
  harga_saat_itu: number;
  keterangan: string;
}

interface ResepRow {
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

/* ───────── component ───────── */
export default function RMEBuatPage() {
  const params = useParams();
  const router = useRouter();
  const idPendaftaran = params.id_pendaftaran as string;

  /* ── top-level state ── */
  const [pendaftaran, setPendaftaran] = useState<PendaftaranData | null>(null);
  const [rmeId, setRmeId] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── SOAP ── */
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
  const [tindakanItems, setTindakanItems] = useState<TindakanRow[]>([]);
  const [selectedLayanan, setSelectedLayanan] = useState('');
  const [ketTindakan, setKetTindakan] = useState('');
  const [addingTindakan, setAddingTindakan] = useState(false);

  /* ── Resep ── */
  const [produkList, setProdukList] = useState<ProdukOption[]>([]);
  const [resepItems, setResepItems] = useState<ResepRow[]>([]);
  const [selectedProduk, setSelectedProduk] = useState('');
  const [resepJumlah, setResepJumlah] = useState('1');
  const [resepDosis, setResepDosis] = useState('');
  const [resepAturan, setResepAturan] = useState('');
  const [resepKet, setResepKet] = useState('');
  const [addingResep, setAddingResep] = useState(false);
  const [stockWarning, setStockWarning] = useState('');

  /* ───────── fetch pendaftaran ───────── */
  const fetchPendaftaran = useCallback(async () => {
    try {
      const res = await fetch('/api/antrian');
      if (!res.ok) throw new Error('Gagal memuat data pendaftaran');
      const result = await res.json();
      const items = result.data || [];
      const found = items.find(
        (a: { id: number; id_pendaftaran?: number }) =>
          a.id == parseInt(idPendaftaran) || a.id_pendaftaran == parseInt(idPendaftaran)
      );
      if (found) {
        setPendaftaran(found);
      } else {
        setError('Data pendaftaran tidak ditemukan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setPageLoading(false);
    }
  }, [idPendaftaran]);

  /* ───────── fetch layanan ───────── */
  const fetchLayanan = useCallback(async () => {
    try {
      const res = await fetch('/api/master/layanan?aktif=true');
      const data = await res.json();
      setTindakanList(data.data || []);
    } catch {
      /* silent */
    }
  }, []);

  /* ───────── fetch produk ───────── */
  const fetchProduk = useCallback(async () => {
    try {
      const res = await fetch('/api/master/produk?aktif=true');
      const data = await res.json();
      setProdukList(data.data || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchPendaftaran();
    fetchLayanan();
    fetchProduk();
  }, [fetchPendaftaran, fetchLayanan, fetchProduk]);

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
    if (diagTarget == 'utama') {
      setSelectedDiagUtama(d);
      setIdDiagnosaUtama(d.id);
    } else {
      setSelectedDiagSekunder(d);
      setIdDiagnosaSekunder(d.id);
    }
    setDiagQuery('');
    setDiagResults([]);
  };

  /* ───────── create RME (draft) ───────── */
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        id_pendaftaran: parseInt(idPendaftaran),
        id_pasien: pendaftaran?.id_pasien,
        id_dokter: pendaftaran?.id_dokter,
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

      let currentRmeId = rmeId;

      if (!currentRmeId) {
        // Create new RME
        const res = await fetch('/api/rme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal membuat RME');
        currentRmeId = result.id || result.data?.id;
        setRmeId(currentRmeId);
      } else {
        // Update existing RME
        const res = await fetch(`/api/rme/${currentRmeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal menyimpan RME');
      }

      toast.success('RME berhasil disimpan sebagai draft');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan RME');
    } finally {
      setSaving(false);
    }
  };

  /* ───────── add tindakan ───────── */
  const handleAddTindakan = async () => {
    if (!selectedLayanan) return;
    if (!rmeId) {
      toast.error('Simpan RME terlebih dahulu sebelum menambah tindakan');
      return;
    }
    setAddingTindakan(true);
    try {
      const res = await fetch(`/api/rme/${rmeId}/tindakan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_layanan: parseInt(selectedLayanan),
          keterangan: ketTindakan,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menambah tindakan');

      const layanan = tindakanList.find((l) => l.id == parseInt(selectedLayanan));
      setTindakanItems((prev) => [
        ...prev,
        {
          id: result.id || result.data?.id,
          id_layanan: parseInt(selectedLayanan),
          nama_layanan: layanan?.nama_layanan || '',
          harga_saat_itu: layanan?.harga || 0,
          keterangan: ketTindakan,
        },
      ]);
      setSelectedLayanan('');
      setKetTindakan('');
      toast.success('Tindakan berhasil ditambahkan');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah tindakan');
    } finally {
      setAddingTindakan(false);
    }
  };

  /* ───────── add resep item ───────── */
  const handleAddResep = async () => {
    if (!selectedProduk) return;
    if (!rmeId) {
      toast.error('Simpan RME terlebih dahulu sebelum menambah resep');
      return;
    }
    setAddingResep(true);
    setStockWarning('');

    const produk = produkList.find((p) => p.id == parseInt(selectedProduk));
    const qty = parseInt(resepJumlah) || 1;

    if (produk && qty > produk.stok) {
      setStockWarning(`Stok ${produk.nama_produk} tersisa ${produk.stok}, permintaan ${qty}`);
    }

    try {
      const res = await fetch(`/api/rme/${rmeId}/resep`, {
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

      setResepItems((prev) => [
        ...prev,
        {
          id: result.id || result.data?.id,
          id_produk: parseInt(selectedProduk),
          nama_produk: produk?.nama_produk || '',
          jumlah: qty,
          dosis: resepDosis,
          aturan_pakai: resepAturan,
          keterangan: resepKet,
          harga_jual: produk?.harga_jual || 0,
          stok: produk?.stok || 0,
        },
      ]);
      setSelectedProduk('');
      setResepJumlah('1');
      setResepDosis('');
      setResepAturan('');
      setResepKet('');
      toast.success('Resep berhasil ditambahkan');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah resep');
    } finally {
      setAddingResep(false);
    }
  };

  /* ───────── delete tindakan ───────── */
  const handleDeleteTindakan = async (tindakanId: number) => {
    if (!rmeId) return;
    try {
      await fetch(`/api/rme/${rmeId}/tindakan/${tindakanId}`, { method: 'DELETE' });
      setTindakanItems((prev) => prev.filter((t) => t.id !== tindakanId));
      toast.success('Tindakan dihapus');
    } catch {
      toast.error('Gagal menghapus tindakan');
    }
  };

  /* ───────── delete resep item ───────── */
  const handleDeleteResep = async (itemId: number) => {
    if (!rmeId) return;
    try {
      await fetch(`/api/rme/${rmeId}/resep/${itemId}`, { method: 'DELETE' });
      setResepItems((prev) => prev.filter((r) => r.id !== itemId));
      toast.success('Item resep dihapus');
    } catch {
      toast.error('Gagal menghapus item resep');
    }
  };

  /* ───────── finalisasi ───────── */
  const handleFinalisasi = async () => {
    if (!rmeId) return;
    setFinalizing(true);
    try {
      const res = await fetch(`/api/rme/${rmeId}/finalisasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pendaftaran: parseInt(idPendaftaran) }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memfinalisasi RME');
      toast.success('RME berhasil difinalisasi');
      setShowFinalDialog(false);
      router.push('/dokter/antrian');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memfinalisasi RME');
    } finally {
      setFinalizing(false);
    }
  };

  /* ───────── loading ───────── */
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-500">Memuat data pendaftaran...</span>
      </div>
    );
  }

  if (error && !pendaftaran) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Buat Rekam Medis</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  /* ───────── render ───────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Buat Rekam Medis</h1>
          <p className="text-sm text-gray-500">
            {pendaftaran
              ? `Pasien: ${pendaftaran.nama_pasien} • ${pendaftaran.nama_layanan}`
              : `Pendaftaran #${idPendaftaran}`}
          </p>
        </div>
        {rmeId && (
          <Badge variant="outline" className={statusBadge('draft')}>
            Draft
          </Badge>
        )}
      </div>

      {/* ═══════ SOAP Notes ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SOAP Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subjektif">S - Subjektif</Label>
            <Textarea
              id="subjektif"
              placeholder="Keluhan utama dan riwayat penyakit pasien..."
              value={soap.subjektif}
              onChange={(e) => setSoap({ ...soap, subjektif: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="objektif">O - Objektif</Label>
            <Textarea
              id="objektif"
              placeholder="Temuan objektif pemeriksaan fisik..."
              value={soap.objektif}
              onChange={(e) => setSoap({ ...soap, objektif: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assesment">A - Assesment</Label>
            <Textarea
              id="assesment"
              placeholder="Diagnosis / assesment klinis..."
              value={soap.assesment}
              onChange={(e) => setSoap({ ...soap, assesment: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">P - Plan</Label>
            <Textarea
              id="plan"
              placeholder="Rencana tindakan dan pengobatan..."
              value={soap.plan}
              onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* ═══════ Diagnosa (ICD-10) ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diagnosa (ICD-10)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagnosa Utama */}
          <div className="space-y-2">
            <Label>Diagnosa Utama</Label>
            {selectedDiagUtama ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    <span className="font-mono text-blue-700">{selectedDiagUtama.kode_icd10}</span> — {selectedDiagUtama.nama_diagnosa}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDiagUtama(null);
                    setIdDiagnosaUtama(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari diagnosa utama ICD-10..."
                  value={diagQuery}
                  onChange={(e) => {
                    setDiagQuery(e.target.value);
                    setDiagTarget('utama');
                  }}
                  className="pl-9"
                  onFocus={() => setDiagTarget('utama')}
                />
                {diagLoading && diagTarget == 'utama' && (
                  <p className="text-xs text-gray-500 mt-1">Mencari...</p>
                )}
                {diagResults.length > 0 && diagTarget == 'utama' && !selectedDiagUtama && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {diagResults.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectDiagnosa(d)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                      >
                        <span className="font-mono text-blue-700 text-sm">{d.kode_icd10}</span> — {d.nama_diagnosa}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Diagnosa Sekunder */}
          <div className="space-y-2">
            <Label>Diagnosa Sekunder (opsional)</Label>
            {selectedDiagSekunder ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    <span className="font-mono text-blue-700">{selectedDiagSekunder.kode_icd10}</span> — {selectedDiagSekunder.nama_diagnosa}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDiagSekunder(null);
                    setIdDiagnosaSekunder(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari diagnosa sekunder ICD-10 (opsional)..."
                  value={diagTarget == 'sekunder' ? diagQuery : ''}
                  onChange={(e) => {
                    setDiagQuery(e.target.value);
                    setDiagTarget('sekunder');
                  }}
                  className="pl-9"
                  onFocus={() => setDiagTarget('sekunder')}
                />
                {diagLoading && diagTarget == 'sekunder' && (
                  <p className="text-xs text-gray-500 mt-1">Mencari...</p>
                )}
                {diagResults.length > 0 && diagTarget == 'sekunder' && !selectedDiagSekunder && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {diagResults.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectDiagnosa(d)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                      >
                        <span className="font-mono text-blue-700 text-sm">{d.kode_icd10}</span> — {d.nama_diagnosa}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <Label htmlFor="kondisi_masuk">Kondisi Masuk</Label>
              <Input
                id="kondisi_masuk"
                placeholder="Kondisi pasien saat masuk"
                value={soap.kondisi_masuk}
                onChange={(e) => setSoap({ ...soap, kondisi_masuk: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kondisi_keluar">Kondisi Keluar</Label>
              <Input
                id="kondisi_keluar"
                placeholder="Kondisi pasien saat keluar"
                value={soap.kondisi_keluar}
                onChange={(e) => setSoap({ ...soap, kondisi_keluar: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instruksi">Instruksi Tindak Lanjut</Label>
            <Textarea
              id="instruksi"
              placeholder="Instruksi tindak lanjut untuk pasien..."
              value={soap.instruksi_tindak_lanjut}
              onChange={(e) => setSoap({ ...soap, instruksi_tindak_lanjut: e.target.value })}
              rows={2}
            />
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
          {tindakanItems.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Layanan</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tindakanItems.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="font-medium">{item.nama_layanan}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(item.harga_saat_itu)}</TableCell>
                      <TableCell>{item.keterangan || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500"
                          onClick={() => item.id && handleDeleteTindakan(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Layanan</Label>
              <select
                value={selectedLayanan}
                onChange={(e) => setSelectedLayanan(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih layanan...</option>
                {tindakanList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama_layanan} — {fmtCurrency(l.harga)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 flex-1 min-w-[150px]">
              <Label className="text-xs">Keterangan</Label>
              <Input value={ketTindakan} onChange={(e) => setKetTindakan(e.target.value)} placeholder="Opsional" />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddTindakan}
              disabled={addingTindakan || !selectedLayanan || !rmeId}
            >
              {addingTindakan ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Tambah
            </Button>
          </div>
          {!rmeId && (
            <p className="text-xs text-gray-400">Simpan RME sebagai draft terlebih dahulu untuk menambah tindakan.</p>
          )}
        </CardContent>
      </Card>

      {/* ═══════ Resep ═══════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resep</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resepItems.length > 0 && (
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
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resepItems.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="font-medium">{item.nama_produk}</TableCell>
                      <TableCell className="text-center">{item.jumlah}</TableCell>
                      <TableCell>{item.dosis || '-'}</TableCell>
                      <TableCell>{item.aturan_pakai || '-'}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(item.harga_jual)}</TableCell>
                      <TableCell className="text-center">
                        <span className={item.stok < 5 ? 'text-yellow-600 font-medium' : ''}>{item.stok}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500"
                          onClick={() => item.id && handleDeleteResep(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {stockWarning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {stockWarning}
            </div>
          )}

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
                  <option key={p.id} value={p.id}>
                    {p.nama_produk} (Stok: {p.stok})
                  </option>
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
              <Button
                type="button"
                size="sm"
                onClick={handleAddResep}
                disabled={addingResep || !selectedProduk || !rmeId}
              >
                {addingResep ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Tambah Item
              </Button>
            </div>
          </div>
          {!rmeId && (
            <p className="text-xs text-gray-400">Simpan RME sebagai draft terlebih dahulu untuk menambah resep.</p>
          )}
        </CardContent>
      </Card>

      {/* ═══════ Action Buttons ═══════ */}
      <div className="flex flex-wrap gap-3 sticky bottom-0 bg-gray-50 py-4 border-t">
        <Button onClick={handleSaveDraft} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Draft
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFinalDialog(true)}
          disabled={!rmeId || finalizing}
        >
          <FileCheck className="h-4 w-4 mr-2" />
          Finalisasi
        </Button>
      </div>

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
            <Button
              onClick={handleFinalisasi}
              disabled={finalizing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {finalizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCheck className="h-4 w-4 mr-2" />}
              Ya, Finalisasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
