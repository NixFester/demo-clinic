'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SoapFields } from './rme-helpers';

interface SoapCardProps {
  value: SoapFields;
  onChange?: (next: SoapFields) => void;
  /** When false, renders read-only grey boxes instead of inputs */
  editable?: boolean;
}

function Field({
  label, id, value, onChange, multiline = false, rows = 3, placeholder, editable,
}: {
  label: string;
  id: string;
  value: string;
  onChange?: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  editable: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {editable ? (
        multiline ? (
          <Textarea id={id} value={value} rows={rows} placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)} />
        ) : (
          <Input id={id} value={value} placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)} />
        )
      ) : (
        <p className={`text-sm p-${multiline ? '3' : '2'} bg-gray-50 rounded-md ${multiline ? 'min-h-[60px]' : ''}`}>
          {value || '-'}
        </p>
      )}
    </div>
  );
}

export function SoapCard({ value, onChange, editable = true }: SoapCardProps) {
  const set = (key: keyof SoapFields) => (v: string) =>
    onChange?.({ ...value, [key]: v });

  return (
    <>
      {/* ── SOAP Notes ── */}
      <Card>
        <CardHeader><CardTitle className="text-base">SOAP Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="S - Subjektif"  id="subjektif" value={value.subjektif} onChange={set('subjektif')} multiline placeholder="Keluhan utama dan riwayat penyakit pasien..." editable={editable} />
          <Field label="O - Objektif"   id="objektif"  value={value.objektif}  onChange={set('objektif')}  multiline placeholder="Temuan objektif pemeriksaan fisik..."          editable={editable} />
          <Field label="A - Assesment"  id="assesment" value={value.assesment} onChange={set('assesment')} multiline placeholder="Diagnosis / assesment klinis..."               editable={editable} />
          <Field label="P - Plan"       id="plan"      value={value.plan}      onChange={set('plan')}      multiline placeholder="Rencana tindakan dan pengobatan..."            editable={editable} />
        </CardContent>
      </Card>

      {/* ── Kondisi & Tindak Lanjut ── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Kondisi & Tindak Lanjut</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Kondisi Masuk"  id="kondisi_masuk"  value={value.kondisi_masuk}  onChange={set('kondisi_masuk')}  placeholder="Kondisi pasien saat masuk"  editable={editable} />
            <Field label="Kondisi Keluar" id="kondisi_keluar" value={value.kondisi_keluar} onChange={set('kondisi_keluar')} placeholder="Kondisi pasien saat keluar" editable={editable} />
          </div>
          <Field label="Instruksi Tindak Lanjut" id="instruksi" value={value.instruksi_tindak_lanjut}
            onChange={set('instruksi_tindak_lanjut')} multiline rows={2}
            placeholder="Instruksi tindak lanjut untuk pasien..." editable={editable} />
        </CardContent>
      </Card>
    </>
  );
}
