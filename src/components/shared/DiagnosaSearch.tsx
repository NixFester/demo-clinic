'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DiagnosaOption {
  id: number;
  kode_icd10: string;
  nama_diagnosa: string;
}

interface DiagnosaSearchProps {
  onSelect: (diagnosa: DiagnosaOption) => void;
  placeholder?: string;
}

export function DiagnosaSearch({ onSelect, placeholder = 'Cari diagnosa ICD-10...' }: DiagnosaSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiagnosaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<DiagnosaOption | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/master/diagnosa?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.data || []);
      } catch (error) {
        console.error('[DiagnosaSearch] Error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      {selected ? (
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex-1">
            <p className="font-medium text-sm">{selected.kode_icd10} - {selected.nama_diagnosa}</p>
          </div>
          <button
            type="button"
            onClick={() => { setSelected(null); onSelect({} as DiagnosaOption); }}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Ganti
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {loading && <p className="text-xs text-gray-500 mt-1">Mencari...</p>}
          {results.length > 0 && !selected && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {results.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelected(d);
                    setQuery('');
                    setResults([]);
                    onSelect(d);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                >
                  <p className="text-sm">
                    <span className="font-mono text-blue-700">{d.kode_icd10}</span>
                    {' - '}
                    {d.nama_diagnosa}
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
