'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DiagnosaSearch } from './DiagnosaSearch';
import { Diagnosa } from '@/types/api-items';

interface DiagnosaCardProps {
  utama:    Diagnosa | null;
  sekunder: Diagnosa | null;
  onSelectUtama:    (d: Diagnosa) => void;
  onClearUtama:     () => void;
  onSelectSekunder: (d: Diagnosa) => void;
  onClearSekunder:  () => void;
  editable?: boolean;
}

export function DiagnosaCard({
  utama, sekunder,
  onSelectUtama, onClearUtama,
  onSelectSekunder, onClearSekunder,
  editable = true,
}: DiagnosaCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Diagnosa (ICD-10)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Diagnosa Utama</Label>
          <DiagnosaSearch
            value={utama}
            onSelect={onSelectUtama}
            onClear={onClearUtama}
            placeholder="Cari diagnosa utama ICD-10..."
            editable={editable}
          />
        </div>
        <div className="space-y-2">
          <Label>Diagnosa Sekunder {editable && <span className="text-gray-400 font-normal">(opsional)</span>}</Label>
          <DiagnosaSearch
            value={sekunder}
            onSelect={onSelectSekunder}
            onClear={onClearSekunder}
            placeholder="Cari diagnosa sekunder ICD-10 (opsional)..."
            editable={editable}
          />
        </div>
      </CardContent>
    </Card>
  );
}
