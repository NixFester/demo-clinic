'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Diagnosa } from '@/types/api-items';

interface DiagnosaSearchProps {
  /** Currently selected diagnosa — pass null to show the search input */
  value: Diagnosa | null;
  onSelect: (diagnosa: Diagnosa) => void;
  onClear: () => void;
  placeholder?: string;
  /** When false (read-only / final RME) renders plain text instead of search */
  editable?: boolean;
}

export function DiagnosaSearch({
  value,
  onSelect,
  onClear,
  placeholder = 'Cari diagnosa ICD-10...',
  editable = true,
}: DiagnosaSearchProps) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<Diagnosa[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/master/diagnosa?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Read-only mode (final RME) ──
  if (!editable) {
    return value ? (
      <p className="text-sm p-2 bg-gray-50 rounded-md">
        <span className="font-mono text-blue-700">{value.kode_icd10}</span> — {value.nama_diagnosa}
      </p>
    ) : (
      <p className="text-sm text-gray-400">-</p>
    );
  }

  // ── Selected chip ──
  if (value) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50 border-blue-200">
        <p className="flex-1 text-sm font-medium">
          <span className="font-mono text-blue-700">{value.kode_icd10}</span> — {value.nama_diagnosa}
        </p>
        <button type="button" onClick={onClear} className="text-xs text-red-500 hover:text-red-700 shrink-0">
          Ganti
        </button>
      </div>
    );
  }

  // ── Search input + dropdown ──
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9"
      />
      {loading && <p className="text-xs text-gray-500 mt-1">Mencari...</p>}
      {results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => { setQuery(''); setResults([]); onSelect(d); }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm"
            >
              <span className="font-mono text-blue-700">{d.kode_icd10}</span> — {d.nama_diagnosa}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}