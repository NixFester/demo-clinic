'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '@/lib/helpers';

interface InvoiceDetailProps {
  invoice: {
    id: number;
    no_invoice: string;
    total: number;
    subtotal: number;
    diskon_persen: number;
    diskon_nominal: number;
    status: string;
    created_at: string;
    nama_pasien?: string;
    no_rekam_medis?: string;
    nama_dokter?: string;
    nama_layanan?: string;
    harga_layanan?: number;
    tindakan?: Array<{
      id: number;
      nama_layanan: string;
      harga_saat_itu: number;
      keterangan: string;
    }>;
    resep?: {
      id: number;
      items: Array<{
        id: number;
        nama_produk: string;
        jumlah: number;
        harga_jual: number;
        dosis: string;
        aturan_pakai: string;
      }>;
    } | null;
    pembayaran?: Array<{
      id: number;
      jumlah_bayar: number;
      metode_pembayaran: string;
      created_at: string;
    }>;
  };
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Invoice {invoice.no_invoice}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {invoice.nama_pasien} - {invoice.no_rekam_medis}
              </p>
              <p className="text-sm text-gray-500">Dokter: {invoice.nama_dokter}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
        </CardHeader>
      </Card>

      {/* Layanan Utama */}
      {invoice.nama_layanan && (
        <Card>
          <CardHeader><CardTitle className="text-base">Layanan Utama</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span>{invoice.nama_layanan}</span>
              <span>{formatCurrency(invoice.harga_layanan || 0)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tindakan */}
      {invoice.tindakan && invoice.tindakan.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tindakan</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.tindakan.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.nama_layanan}</TableCell>
                    <TableCell>{t.keterangan || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.harga_saat_itu)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Resep */}
      {invoice.resep && invoice.resep.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resep Obat</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.resep.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nama_produk}</TableCell>
                    <TableCell>{item.jumlah}</TableCell>
                    <TableCell>{item.dosis} {item.aturan_pakai}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.harga_jual)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.harga_jual * item.jumlah)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ringkasan Pembayaran</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal || 0)}</span>
          </div>
          {invoice.diskon_persen > 0 && (
            <div className="flex justify-between text-sm text-yellow-600">
              <span>Diskon ({invoice.diskon_persen}%)</span>
              <span>-{formatCurrency(invoice.diskon_nominal || 0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(invoice.total || 0)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
