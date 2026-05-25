'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2 } from 'lucide-react';

interface Diagnosa {
  id: number;
  kode_icd10: string;
  nama_diagnosa: string;
}

export default function DiagnosaPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<Diagnosa[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query || query.length < 2) return;
    setLoading(true);
    setSearched(true);
    setError('');
    try {
      const res = await fetch(`/api/master/diagnosa?q=${encodeURIComponent(query)}`);
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      console.error('[DiagnosaPage] Error:', err);
      setError('Gagal mencari diagnosa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Diagnosa ICD-10</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Cari Diagnosa</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kode atau nama diagnosa..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cari'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {searched && (
        <Card>
          <CardHeader><CardTitle className="text-base">Hasil Pencarian ({data.length} diagnosa)</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Mencari...</span>
              </div>
            ) : data.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Tidak ada diagnosa ditemukan</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Kode ICD-10</TableHead>
                    <TableHead>Nama Diagnosa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono font-medium text-blue-700">{d.kode_icd10}</TableCell>
                      <TableCell>{d.nama_diagnosa}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
