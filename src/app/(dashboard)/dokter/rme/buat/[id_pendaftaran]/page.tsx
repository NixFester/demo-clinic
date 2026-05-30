'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Diagnosa } from '@/types/api-items';

import { SoapCard }         from '@/components/rme/SoapCard';
import { DiagnosaCard }     from '@/components/rme/DiagnosaCard';
import { TindakanCard }     from '@/components/rme/TindakanCard';
import { ResepCard }        from '@/components/rme/ResepCard';
import { FinalisasiDialog } from '@/components/rme/FinalisasiDialog';
import {
  statusBadgeClass, SOAP_EMPTY, SoapFields,
} from '@/components/rme/rme-helpers';
import { Layanan, Produk, TindakanItem, ResepItem } from '@/types/api-items';
interface PendaftaranData {
  id: number; id_pasien: number; id_dokter: number;
  nama_pasien: string; no_rekam_medis: string;
  nama_layanan: string; keluhan_utama: string;
}

export default function RMEBuatPage() {
  const { id_pendaftaran: idPendaftaran } = useParams() as { id_pendaftaran: string };
  const router = useRouter();

  const [pendaftaran,  setPendaftaran]  = useState<PendaftaranData | null>(null);
  const [rmeId,        setRmeId]        = useState<number | null>(null);
  const [pageLoading,  setPageLoading]  = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [finalizing,   setFinalizing]   = useState(false);
  const [showFinalDlg, setShowFinalDlg] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const [soap,         setSoap]         = useState<SoapFields>(SOAP_EMPTY);
  const [diagUtama,    setDiagUtama]    = useState<Diagnosa | null>(null);
  const [diagSekunder, setDiagSekunder] = useState<Diagnosa | null>(null);
  const [tindakanItems, setTindakanItems] = useState<TindakanItem[]>([]);
  const [resepItems,    setResepItems]    = useState<ResepItem[]>([]);
  const [layananList,  setLayananList]  = useState<Layanan[]>([]);
  const [produkList,   setProdukList]   = useState<Produk[]>([]);

  // ── Fetch pendaftaran from antrian list ───────────────────────────────────

  const fetchPendaftaran = useCallback(async () => {
    try {
      const res    = await fetch('/api/antrian');
      if (!res.ok) throw new Error('Gagal memuat data pendaftaran');
      const result = await res.json();
      const found  = (result.data ?? []).find(
        (a: { id: number; id_pendaftaran?: number }) =>
          a.id == parseInt(idPendaftaran) || a.id_pendaftaran == parseInt(idPendaftaran)
      );
      if (found) setPendaftaran(found);
      else setError('Data pendaftaran tidak ditemukan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setPageLoading(false);
    }
  }, [idPendaftaran]);

  useEffect(() => {
    fetchPendaftaran();
    fetch('/api/master/layanan?aktif=true').then(r => r.json()).then(d => setLayananList(d.data ?? [])).catch(() => {});
    fetch('/api/master/produk?aktif=true').then(r  => r.json()).then(d => setProdukList(d.data  ?? [])).catch(() => {});
  }, [fetchPendaftaran]);

  // ── Save draft ────────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        id_pendaftaran: parseInt(idPendaftaran),
        id_pasien: pendaftaran?.id_pasien,
        id_dokter: pendaftaran?.id_dokter,
        ...soap,
      };
      if (diagUtama)    body.id_diagnosa_utama    = diagUtama.id;
      if (diagSekunder) body.id_diagnosa_sekunder = diagSekunder.id;

      if (!rmeId) {
        const res    = await fetch('/api/rme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? 'Gagal membuat RME');
        setRmeId(result.id ?? result.data?.id);
      } else {
        const res    = await fetch(`/api/rme/${rmeId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? 'Gagal menyimpan RME');
      }
      toast.success('RME berhasil disimpan sebagai draft');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan RME');
    } finally {
      setSaving(false);
    }
  };

  // ── Finalisasi ────────────────────────────────────────────────────────────

  const handleFinalisasi = async () => {
    if (!rmeId) return;
    setFinalizing(true);
    try {
      const res = await fetch(`/api/rme/${rmeId}/finalisasi`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pendaftaran: parseInt(idPendaftaran) }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Gagal memfinalisasi RME');
      toast.success('RME berhasil difinalisasi');
      setShowFinalDlg(false);
      router.push('/dokter/antrian');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memfinalisasi RME');
    } finally {
      setFinalizing(false);
    }
  };

  // ── onChanged callbacks — buat page manages local state (no refetch needed) ──

  // TindakanCard and ResepCard call onChanged after add/delete.
  // For the "buat" flow we just refetch from the API to stay in sync.
  const refetchItems = useCallback(async () => {
    if (!rmeId) return;
    const res  = await fetch(`/api/rme/${rmeId}`);
    const data = await res.json();
    const d    = data.data ?? data;
    setTindakanItems((d.tindakan as TindakanItem[]) ?? []);
    setResepItems((d.resep as { items?: ResepItem[] })?.items ?? []);
  }, [rmeId]);

  // ── Loading / error ───────────────────────────────────────────────────────

  if (pageLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      <span className="ml-3 text-gray-500">Memuat data pendaftaran...</span>
    </div>
  );

  if (error && !pendaftaran) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">Buat Rekam Medis</h1>
      </div>
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Buat Rekam Medis</h1>
          <p className="text-sm text-gray-500">
            {pendaftaran ? `Pasien: ${pendaftaran.nama_pasien} • ${pendaftaran.nama_layanan}` : `Pendaftaran #${idPendaftaran}`}
          </p>
        </div>
        {rmeId && <Badge variant="outline" className={statusBadgeClass('draft')}>Draft</Badge>}
      </div>

      <SoapCard value={soap} onChange={setSoap} editable />

      <DiagnosaCard
        utama={diagUtama}     onSelectUtama={setDiagUtama}     onClearUtama={() => setDiagUtama(null)}
        sekunder={diagSekunder} onSelectSekunder={setDiagSekunder} onClearSekunder={() => setDiagSekunder(null)}
        editable
      />

      <TindakanCard rmeId={rmeId} items={tindakanItems} layananList={layananList} editable onChanged={refetchItems} />

      <ResepCard rmeId={rmeId} items={resepItems} produkList={produkList} editable onChanged={refetchItems} />

      {/* Action bar */}
      <div className="flex flex-wrap gap-3 sticky bottom-0 bg-gray-50 py-4 border-t">
        <Button onClick={handleSaveDraft} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Draft
        </Button>
        <Button variant="outline" onClick={() => setShowFinalDlg(true)} disabled={!rmeId || finalizing}>
          <FileCheck className="h-4 w-4 mr-2" />Finalisasi
        </Button>
      </div>

      <FinalisasiDialog
        open={showFinalDlg} onOpenChange={setShowFinalDlg}
        onConfirm={handleFinalisasi} loading={finalizing}
      />
    </div>
  );
}