'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';

interface InvoiceItem {
  id: number;
  no_invoice: string;
  total: number;
  dibayar: number;
  status: string;
  created_at: string;
  nama_pasien: string;
  nama_dokter: string;
}

export default function KasirPage() {
  const [data, setData] = useState<InvoiceItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const fetchData = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/invoice?page=${p}`);
      const result = await res.json();
      setData(result.data || []);
      setLastPage(result.last_page || 1);
    } catch (err) {
      console.error('[KasirPage] Error:', err);
      setError('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate_from_pendaftaran: true }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Invoice berhasil digenerate');
        fetchData();
      } else {
        toast.error(result.error || 'Tidak ada pendaftaran yang memerlukan invoice');
      }
    } catch (err) {
      toast.error('Gagal generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kasir</h1>
        <Button onClick={handleGenerateInvoice} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700">
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
          Generate Invoice
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Invoice</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Memuat data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Dibayar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Tidak ada invoice</TableCell></TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.no_invoice}</TableCell>
                      <TableCell className="font-medium">{item.nama_pasien}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                      <TableCell>{formatCurrency(item.dibayar || 0)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/kasir/${item.id}`)}>
                          <Eye className="h-4 w-4 mr-1" /> Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
