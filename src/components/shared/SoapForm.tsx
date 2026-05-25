'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Save, FileCheck } from 'lucide-react';
import { DiagnosaSearch } from './DiagnosaSearch';

interface SoapFormProps {
  initialData?: {
    subjektif?: string;
    objektif?: string;
    assesment?: string;
    plan?: string;
    kondisi_masuk?: string;
    kondisi_keluar?: string;
    instruksi_tindak_lanjut?: string;
    id_diagnosa_utama?: number | null;
    id_diagnosa_sekunder?: number | null;
    kode_diagnosa_utama?: string;
    nama_diagnosa_utama?: string;
    kode_diagnosa_sekunder?: string;
    nama_diagnosa_sekunder?: string;
  };
  onSubmit: (data: Record<string, unknown>) => void;
  onFinalize?: () => void;
  loading?: boolean;
  readOnly?: boolean;
}

export function SoapForm({ initialData, onSubmit, onFinalize, loading, readOnly }: SoapFormProps) {
  const [form, setForm] = useState({
    subjektif: initialData?.subjektif || '',
    objektif: initialData?.objektif || '',
    assesment: initialData?.assesment || '',
    plan: initialData?.plan || '',
    kondisi_masuk: initialData?.kondisi_masuk || '',
    kondisi_keluar: initialData?.kondisi_keluar || '',
    instruksi_tindak_lanjut: initialData?.instruksi_tindak_lanjut || '',
    id_diagnosa_utama: initialData?.id_diagnosa_utama || null as number | null,
    id_diagnosa_sekunder: initialData?.id_diagnosa_sekunder || null as number | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SOAP */}
      <Card>
        <CardHeader><CardTitle className="text-base">SOAP</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>S - Subjektif</Label>
            <Textarea
              placeholder="Keluhan pasien..."
              value={form.subjektif}
              onChange={(e) => setForm({ ...form, subjektif: e.target.value })}
              rows={3}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>O - Objektif</Label>
            <Textarea
              placeholder="Temuan objektif..."
              value={form.objektif}
              onChange={(e) => setForm({ ...form, objektif: e.target.value })}
              rows={3}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>A - Assesment</Label>
            <Textarea
              placeholder="Diagnosis/assesment..."
              value={form.assesment}
              onChange={(e) => setForm({ ...form, assesment: e.target.value })}
              rows={3}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>P - Plan</Label>
            <Textarea
              placeholder="Rencana tindakan..."
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              rows={3}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Diagnosa */}
      <Card>
        <CardHeader><CardTitle className="text-base">Diagnosa (ICD-10)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Diagnosa Utama</Label>
            {initialData?.kode_diagnosa_utama && readOnly ? (
              <p className="text-sm p-2 bg-blue-50 rounded">{initialData.kode_diagnosa_utama} - {initialData.nama_diagnosa_utama}</p>
            ) : (
              <DiagnosaSearch
                onSelect={(d) => d?.id && setForm({ ...form, id_diagnosa_utama: d.id })}
                placeholder="Cari diagnosa utama..."
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Diagnosa Sekunder</Label>
            {initialData?.kode_diagnosa_sekunder && readOnly ? (
              <p className="text-sm p-2 bg-blue-50 rounded">{initialData.kode_diagnosa_sekunder} - {initialData.nama_diagnosa_sekunder}</p>
            ) : (
              <DiagnosaSearch
                onSelect={(d) => d?.id && setForm({ ...form, id_diagnosa_sekunder: d.id })}
                placeholder="Cari diagnosa sekunder (opsional)..."
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kondisi & Tindak Lanjut */}
      <Card>
        <CardHeader><CardTitle className="text-base">Kondisi & Tindak Lanjut</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kondisi Masuk</Label>
              <Input
                value={form.kondisi_masuk}
                onChange={(e) => setForm({ ...form, kondisi_masuk: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Kondisi Keluar</Label>
              <Input
                value={form.kondisi_keluar}
                onChange={(e) => setForm({ ...form, kondisi_keluar: e.target.value })}
                disabled={readOnly}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Instruksi Tindak Lanjut</Label>
            <Textarea
              value={form.instruksi_tindak_lanjut}
              onChange={(e) => setForm({ ...form, instruksi_tindak_lanjut: e.target.value })}
              rows={2}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan Draft'}
          </Button>
          {onFinalize && (
            <Button type="button" variant="outline" onClick={onFinalize} disabled={loading}>
              <FileCheck className="h-4 w-4 mr-2" />
              Finalisasi
            </Button>
          )}
        </div>
      )}
    </form>
  );
}

function Input({ value, onChange, disabled, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
