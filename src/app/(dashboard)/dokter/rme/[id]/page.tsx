'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, FileCheck, Loader2, ChevronRight } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

const STEPS = [
  { label: 'RME Sebelumnya',   step: 0 },
  { label: 'SOAP & Diagnosa', step: 1 },
  { label: 'Tindakan',        step: 2 },
  { label: 'Resep Obat',      step: 3 },
];

function StepBreadcrumb({ current }: { current: number }) {
  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap">
      {STEPS.map((s, i) => {
        const done    = s.step < current;
        const active  = s.step === current;
        return (
          <span key={s.step} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
            <span className={
              active ? 'font-semibold text-emerald-700'
              : 'text-gray-400'
            }>
              {s.step}.{' '} <span className="hidden sm:inline">{s.label}</span>
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export default function DokterRMEDetailPage() {
  const isMobile = useIsMobile();
  const { id: rmeIdParam } = useParams() as { id: string };
  const router = useRouter();

  const [step,          setStep]          = useState(1);
  const [rme,           setRme]           = useState<RMEDetail | null>(null);
  const [latestRme,     setLatestRme]     = useState<RMEDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [finalizing,    setFinalizing]    = useState(false);
  const [showFinalDlg,  setShowFinalDlg]  = useState(false);

  const [soap,          setSoap]          = useState<SoapFields>(SOAP_EMPTY);
  const [diagUtama,     setDiagUtama]     = useState<Diagnosa | null>(null);
  const [diagSekunder,  setDiagSekunder]  = useState<Diagnosa | null>(null);
  const [layananList,   setLayananList]   = useState<Layanan[]>([]);
  const [paketLayananList, setPaketLayananList] = useState<any[]>([]);
  const [produkList,    setProdukList]    = useState<Produk[]>([]);

  const formatNoRM = (id: number | string) => `RM${String(id).padStart(6, '0')}`;

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchRme = useCallback(async () => {
    try {
      setError(null);
      const res  = await fetch(`/api/rme/${rmeIdParam}`);
      if (!res.ok) throw new Error('Gagal memuat data RME');
      const data = await res.json();
      const d: RMEDetail = data.data ?? data;
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
    fetch('/api/master/paket-layanan?aktif=true').then(r => r.json()).then(d => setPaketLayananList(d.data ?? [])).catch(() => {});
    fetch('/api/master/produk?aktif=true').then(r  => r.json()).then(d => setProdukList(d.data  ?? [])).catch(() => {});
  }, [fetchRme]);

  // ── Fetch latest RME per patient ─────────────────────────────────────────

  useEffect(() => {
    if (!rme?.id_pasien) return;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/rme/latestByPatient?id_pasien=${rme.id_pasien}&id_rme=${rme.id}`);
        if (res.ok) {
          const data = await res.json();
          const latest: RMEDetail = data.data ?? data;
          if (latest && latest.id !== rme.id) {
            setLatestRme(latest);
            setStep(0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch latest RME:', err);
      }
    };
    fetchLatest();
  }, [rme?.id_pasien, rme?.id]);

  // ── Save draft ───────────────────────────────────────────────────────────

  const saveDraft = async (): Promise<boolean> => {
    if (!rme) return false;
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
      await fetchRme();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan RME');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    const ok = await saveDraft();
    if (ok) setStep(s => Math.min(s + 1, 3));
  };

  // ── Finalisasi ───────────────────────────────────────────────────────────

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

  // ── Loading / error ──────────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">RME — {rme.nama_pasien}</h1>
            <p className="text-sm text-gray-500">{formatNoRM(rme.id)}</p>
            <StepBreadcrumb current={step} />
          </div>
        </div>
        <Badge variant="outline" className={statusBadgeClass(rme.status)}>
          {statusLabel(rme.status)}
        </Badge>
      </div>

      {/* Step content */}
      {step === 0 && latestRme && (
        <>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-blue-900">RME Sebelumnya</h3>
                  <p className="text-sm text-blue-700">Data dari pemeriksaan terdahulu</p>
                </div>
              </div>
              <div className="grid gap-4">
                <SoapCard value={{
                  subjektif: latestRme.subjektif ?? '',
                  objektif: latestRme.objektif ?? '',
                  assesment: latestRme.assesment ?? '',
                  plan: latestRme.plan ?? '',
                  kondisi_masuk: latestRme.kondisi_masuk ?? '',
                  kondisi_keluar: latestRme.kondisi_keluar ?? '',
                  instruksi_tindak_lanjut: latestRme.instruksi_tindak_lanjut ?? '',
                }} onChange={() => {}} editable={false} />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 1 && (
        <>
          <SoapCard value={soap} onChange={setSoap} editable={isDraft} />
          <DiagnosaCard
            utama={diagUtama}       onSelectUtama={setDiagUtama}       onClearUtama={() => setDiagUtama(null)}
            sekunder={diagSekunder} onSelectSekunder={setDiagSekunder} onClearSekunder={() => setDiagSekunder(null)}
            editable={isDraft}
          />
        </>
      )}

      {step === 2 && (
        <TindakanCard
          rmeId={rme.id} items={tindakanItems}
          layananList={layananList} paketLayananList={paketLayananList} editable={isDraft} onChanged={fetchRme}
        />
      )}

      {step === 3 && (
        <>
          <ResepCard
            rmeId={rme.id} items={resepItems}
            produkList={produkList} editable={isDraft} onChanged={fetchRme}
          />
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
        </>
      )}

      {/* Action bar */}
      {isDraft && (
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-3 sticky bottom-0 bg-gray-50 py-4 border-t px-4`}>

          {/* Kembali ke Awal — only step 3 */}
          {step === 3 && (
            <Button variant="ghost" onClick={() => setStep(1)} disabled={saving || finalizing}>
              <ArrowLeft className="h-4 w-4 mr-2" />Kembali ke Awal
            </Button>
          )}

          {/* Kembali — steps 2 & 3 */}
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={saving || finalizing}>
              <ArrowLeft className="h-4 w-4 mr-2" />Kembali
            </Button>
          )}

          {/* Primary action */}
          {step < 3 && step !== 0 ? (
            <Button onClick={handleSaveAndNext} disabled={saving} className={"bg-emerald-600 hover:bg-emerald-700 ${isMobile ? 'w-full' : ''}"}>
              {saving
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Save className="h-4 w-4 mr-2" />}
              Simpan Draft &amp; Lanjut
            </Button>
          ) : step !== 0 ? (
            <Button 
              onClick={() => setShowFinalDlg(true)}
              disabled={finalizing}
              className={"bg-emerald-600 hover:bg-emerald-700 ${isMobile ? 'w-full' : ''}"}
            >
              <FileCheck className="h-4 w-4 mr-2" />Finalisasi
            </Button>
          ): (
            <Button onClick={() => setStep(1)} className={"bg-emerald-600 hover:bg-emerald-700 ${isMobile ? 'w-full' : ''}"}>
              Lanjut
            </Button>
          )}
        </div>
      )}

      <FinalisasiDialog
        open={showFinalDlg} onOpenChange={setShowFinalDlg}
        onConfirm={handleFinalisasi} loading={finalizing}
      />
    </div>
  );
}