'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface PasienOption {
  id: number;
  no_rekam_medis: string;
  nik: string;
  nama_lengkap: string;
  no_telepon: string;
  no_whatsapp: string;
}

interface PasienSearchProps {
  onSelect: (pasien: PasienOption) => void;
  selectedId?: number;
}

export function PasienSearch({ onSelect, selectedId }: PasienSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PasienOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PasienOption | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/pasien?q=${encodeURIComponent(query)}&page=1`);
        const data = await res.json();
        setResults(data.data || []);
      } catch (error) {
        console.error('[PasienSearch] Error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (selectedId && !selected) {
      // Load selected patient if id is given but no selection yet
      fetch(`/api/pasien/${selectedId}`)
        .then(res => res.json())
        .then(data => setSelected(data))
        .catch(console.error);
    }
  }, [selectedId, selected]);

  return (
    <div className="relative">
      {selected ? (
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-emerald-50 border-emerald-200">
          <div className="flex-1">
            <p className="font-medium text-sm">{selected.nama_lengkap}</p>
            <p className="text-xs text-gray-500">{selected.no_rekam_medis} - NIK: {selected.nik}</p>
          </div>
          <button
            type="button"
            onClick={() => { setSelected(null); onSelect({} as PasienOption); }}
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
              placeholder="Cari pasien (nama/NIK)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {loading && <p className="text-xs text-gray-500 mt-1">Mencari...</p>}
          {results.length > 0 && !selected && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelected(p);
                    setQuery('');
                    setResults([]);
                    onSelect(p);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b last:border-b-0"
                >
                  <p className="font-medium text-sm">{p.nama_lengkap}</p>
                  <p className="text-xs text-gray-500">{p.no_rekam_medis} - NIK: {p.nik}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
