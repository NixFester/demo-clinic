'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

interface PembayaranFormProps {
  invoiceId: number;
  total: number;
  onSuccess: () => void;
}

export function PembayaranForm({ invoiceId, total, onSuccess }: PembayaranFormProps) {
  const [metode, setMetode] = useState('tunai');
  const [jumlahBayar, setJumlahBayar] = useState(String(total));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_invoice: invoiceId,
          jumlah_bayar: parseFloat(jumlahBayar),
          metode_pembayaran: metode,
        }),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('[PembayaranForm] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const kembalian = parseFloat(jumlahBayar) - total;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Proses Pembayaran</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">Total Tagihan</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <select
              value={metode}
              onChange={(e) => setMetode(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="debit">Kartu Debit</option>
              <option value="credit">Kartu Kredit</option>
              <option value="qris">QRIS</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Jumlah Bayar</Label>
            <Input
              type="number"
              value={jumlahBayar}
              onChange={(e) => setJumlahBayar(e.target.value)}
              min={total}
            />
          </div>

          {kembalian > 0 && (
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm">Kembalian</span>
              <span className="font-medium text-emerald-700">{formatCurrency(kembalian)}</span>
            </div>
          )}

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading || parseFloat(jumlahBayar) < total}>
            <CreditCard className="h-4 w-4 mr-2" />
            {loading ? 'Memproses...' : 'Bayar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
