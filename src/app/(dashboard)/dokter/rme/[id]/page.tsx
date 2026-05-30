'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SoapCard }         from '@/components/rme/SoapCard';
import { DiagnosaCard }     from '@/components/rme/DiagnosaCard';
import { TindakanCard }     from '@/components/rme/TindakanCard';
import { ResepCard }        from '@/components/rme/ResepCard';
import { FinalisasiDialog } from '@/components/rme/FinalisasiDialog';
import {
  statusBadgeClass, statusLabel,
  SOAP_EMPTY, SoapFields
} from '@/components/rme/rme-helpers';

import { RMEDetail, Diagnosa, Layanan, Produk, TindakanItem, ResepItem } from '@/types/api-items';


export default function DokterRMEDetailPage() {
  const { id: rmeIdParam } = useParams() as { id: string };
  const router = useRouter();

  const [rme,           setRme]           = useState<RMEDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [finalizing,    setFinalizing]    = useState(false);
  const [showFinalDlg,  setShowFinalDlg]  = useState(false);

  const [soap,          setSoap]          = useState<SoapFields>(SOAP_EMPTY);
  const [diagUtama,     setDiagUtama]     = useState<Diagnosa | null>(null);
  const [diagSekunder,  setDiagSekunder]  = useState<Diagnosa | null>(null);
  const [layananList,   setLayananList]   = useState<Layanan[]>([]);
  const [produkList,    setProdukList]    = useState<Produk[]>([]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchRme = useCallback(async () => {
    try {
      setError(null);
      const res  = await fetch(`/api/rme/${rmeIdParam}`);
      if (!res.ok) throw new Error('Gagal memuat data RME');
      const data = await res.json();
      const d:RMEDetail  = data.data ?? data;
      setRme(d);
      setSoap({
        subjektif: d.subjektif ?? '', objektif: d.objektif ?? '',
        assesment: d.assesment ?? '', plan: d.plan ?? '',
        kondisi_masuk: d.kondisi_masuk ?? '', kondisi_keluar: d.kondisi_keluar ?? '',
        instruksi_tindak_lanjut: d.instruksi_tindak_lanjut ?? '',
      });
      setDiagUtama(d.kode_diagnosa_utama
        ? { id: d.id_diagnosa_utama, kode_icd10: d.kode_diagnosa_utama, nama_diagnosa: d.nama_diagnosa_utama }
        : null);
      setDiagSekunder(d.kode_diagnosa_sekunder
        ? { id: d.id_diagnosa_sekunder, kode_icd10: d.kode_diagnosa_sekunder, nama_diagnosa: d.nama_diagnosa_sekunder }
        : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [rmeIdParam]);

  useEffect(() => {
    fetchRme();
    fetch('/api/master/layanan?aktif=true').then(r => r.json()).then(d => setLayananList(d.data ?? [])).catch(() => {});
    fetch('/api/master/produk?aktif=true').then(r  => r.json()).then(d => setProdukList(d.data  ?? [])).catch(() => {});
  }, [fetchRme]);

  // ── Save draft ────────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!rme) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...soap };
      if (diagUtama)    body.id_diagnosa_utama    = diagUtama.id;
      if (diagSekunder) body.id_diagnosa_sekunder = diagSekunder.id;
      const res = await fetch(`/api/rme/${rme.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Gagal menyimpan RME');
      toast.success('RME berhasil disimpan');
      fetchRme();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan RME');
    } finally {
      setSaving(false);
    }
  };

  // ── Finalisasi ────────────────────────────────────────────────────────────

  const handleFinalisasi = async () => {
    if (!rme) return;
    setFinalizing(true);
    try {
      const res = await fetch(`/api/rme/${rme.id}/finalisasi`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pendaftaran: rme.id_pendaftaran }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Gagal memfinalisasi RME');
      toast.success('RME berhasil difinalisasi');
      setShowFinalDlg(false);
      fetchRme();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memfinalisasi RME');
    } finally {
      setFinalizing(false);
    }
  };

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      <span className="ml-3 text-gray-500">Memuat data RME...</span>
    </div>
  );

  if (error || !rme) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">Detail RME</h1>
      </div>
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error ?? 'RME tidak ditemukan'}</div>
    </div>
  );

  const isDraft = rme.status === 'draft';
  const isFinal = rme.status === 'final';
  const tindakanItems: TindakanItem[] = (rme.tindakan as TindakanItem[]) ?? [];
  const resepItems:    ResepItem[]    = (rme.resep as { items?: ResepItem[] })?.items ?? [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">RME — {rme.nama_pasien}</h1>
            <p className="text-sm text-gray-500">No. RM: {rme.no_rekam_medis}</p>
          </div>
        </div>
        <Badge variant="outline" className={statusBadgeClass(rme.status)}>{statusLabel(rme.status)}</Badge>
      </div>

      <SoapCard value={soap} onChange={setSoap} editable={isDraft} />

      <DiagnosaCard
        utama={diagUtama}     onSelectUtama={setDiagUtama}     onClearUtama={() => setDiagUtama(null)}
        sekunder={diagSekunder} onSelectSekunder={setDiagSekunder} onClearSekunder={() => setDiagSekunder(null)}
        editable={isDraft}
      />

      <TindakanCard rmeId={rme.id} items={tindakanItems} layananList={layananList} editable={isDraft} onChanged={fetchRme} />

      <ResepCard rmeId={rme.id} items={resepItems} produkList={produkList} editable={isDraft} onChanged={fetchRme} />

      {/* Action bar */}
      {isDraft && (
        <div className="flex flex-wrap gap-3 sticky bottom-0 bg-gray-50 py-4 border-t">
          <Button onClick={handleSaveDraft} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Draft
          </Button>
          <Button variant="outline" onClick={() => setShowFinalDlg(true)} disabled={finalizing}>
            <FileCheck className="h-4 w-4 mr-2" />Finalisasi
          </Button>
        </div>
      )}

      {/* Final notice */}
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

      <FinalisasiDialog
        open={showFinalDlg} onOpenChange={setShowFinalDlg}
        onConfirm={handleFinalisasi} loading={finalizing}
      />
    </div>
  );
}