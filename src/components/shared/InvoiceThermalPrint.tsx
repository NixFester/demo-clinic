import { Br, Cut, Line, Printer, Row, Text } from 'react-thermal-printer';
import type { InvoiceDetail } from '@/types/api-items';

const formatRupiah = (n: number) =>
  'Rp ' + n.toLocaleString('id-ID');

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });

interface Props {
  invoice: InvoiceDetail;
}

const getStatusLabel = (status: string) => {
  if (status === 'lunas') return 'LUNAS';
  if (status === 'belum_bayar') return 'BELUM LUNAS';
  if (status === 'batal') return 'BATAL';
  return status.toUpperCase();
};

export function buildReceiptElement(invoice: InvoiceDetail) {
  return (
    <Printer type="epson" width={32} characterSet="pc437_usa">
      {/* ── Header ── */}
      <Text align="center" bold size={{ width: 2, height: 2 }}>
        ELRHEA CLINIC
      </Text>
      <Text align="center">Jl Bendo 3, Lempongsari, Gajahmungkur</Text>
      <Text align="center">Semarang, 50231</Text>
      <Line />

      {/* ── Invoice Info ── */}
      <Text align="center" bold>INVOICE</Text>
      <Text align="center">{invoice.no_invoice}</Text>
      <Line />

      {/* ── Tanggal & Waktu ── */}
      <Row left="Tanggal" right={formatDate(invoice.created_at)} />
      <Row left="Jam" right={formatTime(invoice.created_at)} />
      <Line />

      {/* ── Pasien Info ── */}
      <Text bold>Pasien:</Text>
      <Text>{invoice.nama_pasien || '-'}</Text>
      <Row left="No. RM" right={invoice.no_rekam_medis || '-'} />
      <Row left="Dokter" right={invoice.nama_dokter || '-'} />
      <Row left="Kasir" right={invoice.nama_karyawan || '-'} />
      <Line />

      {/* ── Items ── */}
      <Text bold>Daftar Belanja:</Text>
      <Line />
      {invoice.items.map((item) => (
        <>
          <Text key={`name-${item.id}`} wrap={true}>{item.nama_item}</Text>
          <Row
            key={`price-${item.id}`}
            left={`  ${item.qty} x ${formatRupiah(item.harga_satuan || 0)}`}
            right={formatRupiah(item.subtotal || 0)}
          />
        </>
      ))}
      <Line />

      {/* ── Totals ── */}
      {invoice.diskon > 0 && (
        <>
          <Row left="Subtotal" right={formatRupiah(invoice.subtotal || 0)} />
          <Row left="Diskon" right={`- ${formatRupiah(invoice.diskon)}`} />
        </>
      )}
      <Row
        left={<Text bold>TOTAL</Text>}
        right={<Text bold>{formatRupiah(invoice.total || 0)}</Text>}
      />
      <Line />

      {/* ── Pembayaran ── */}
      {(invoice.total_dibayar || 0) > 0 && (
        <>
          <Row left="Sudah Bayar" right={formatRupiah(invoice.total_dibayar || 0)} />
          <Row left="Sisa Tagihan" right={formatRupiah((invoice.total || 0) - (invoice.total_dibayar || 0))} />
          <Line />
        </>
      )}

      {invoice.pembayaran && invoice.pembayaran.map((p) => (
        <>
          <Row key={`pay-${p.id}`} left="Metode Bayar" right={p.metode.toUpperCase()} />
          <Row key={`nom-${p.id}`} left="Nominal" right={formatRupiah(p.nominal)} />
          {p.kembalian > 0 && (
            <Row key={`change-${p.id}`} left="Kembalian" right={formatRupiah(p.kembalian)} />
          )}
        </>
      ))}
      <Line />

      {/* ── Status ── */}
      <Text align="center" bold>STATUS: {getStatusLabel(invoice.status)}</Text>
      <Br />
      <Br />

      {/* ── Footer ── */}
      <Text align="center">================================</Text>
      <Text align="center" bold>Terima Kasih</Text>
      <Text align="center">Atas Kunjungan Anda</Text>
      <Text align="center">Semoga Lekas Sembuh</Text>
      <Text align="center">================================</Text>
      <Br />
      <Cut lineFeeds={4} />
    </Printer>
  );
}

/** HTML preview — shown on screen, not sent to printer */
export function InvoiceThermalPrint({ invoice }: Props) {
  const sisaTagihan = (invoice.total || 0) - (invoice.total_dibayar || 0);

  return (
    <div className="font-mono text-[11px] leading-snug text-black w-full bg-white p-3">
      {/* Header */}
      <div className="text-center mb-3">
        <p className="font-bold text-sm">ELRHEA CLINIC</p>
        <p className="text-[10px]">Jl Bendo 3, Lempongsari, Gajahmungkur</p>
        <p className="text-[10px]">Semarang, 50231</p>
      </div>
      <div className="border-t-2 border-b-2 border-black my-2 py-1">
        <p className="text-center font-bold text-xs">INVOICE</p>
        <p className="text-center text-[10px]">{invoice.no_invoice}</p>
      </div>

      {/* Tanggal & Waktu */}
      <div className="flex justify-between text-[10px] mb-1">
        <span>Tanggal: {formatDate(invoice.created_at)}</span>
        <span>Jam: {formatTime(invoice.created_at)}</span>
      </div>

      {/* Separator */}
      <div className="border-t border-dashed border-black my-1" />

      {/* Pasien Info */}
      <div className="mb-2">
        <p className="font-bold text-[10px] mb-1">Pasien:</p>
        <p className="text-[11px]">{invoice.nama_pasien || '-'}</p>
        <div className="flex justify-between text-[10px]">
          <span>No. RM: {invoice.no_rekam_medis || '-'}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Dokter: {invoice.nama_dokter || '-'}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Kasir: {invoice.nama_karyawan || '-'}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Items */}
      <div className="mb-2">
        <p className="font-bold text-[10px] mb-1">Daftar Belanja:</p>
        {invoice.items.map((item) => (
          <div key={item.id} className="mb-1">
            <p className="text-[11px] font-medium">{item.nama_item}</p>
            <div className="flex justify-between text-[10px] pl-2">
              <span>{item.qty} x {formatRupiah(item.harga_satuan || 0)}</span>
              <span>{formatRupiah(item.subtotal || 0)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Totals */}
      <div className="space-y-1">
        {invoice.diskon > 0 && (
          <>
            <div className="flex justify-between text-[10px]">
              <span>Subtotal</span>
              <span>{formatRupiah(invoice.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-red-600">
              <span>Diskon</span>
              <span>- {formatRupiah(invoice.diskon)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-bold text-[12px] bg-emerald-50 p-1 -mx-1">
          <span>TOTAL</span>
          <span className="text-emerald-700">{formatRupiah(invoice.total || 0)}</span>
        </div>

        {(invoice.total_dibayar || 0) > 0 && (
          <>
            <div className="flex justify-between text-[10px] text-emerald-600">
              <span>Sudah Bayar</span>
              <span>{formatRupiah(invoice.total_dibayar || 0)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-red-600 font-medium">
              <span>Sisa Tagihan</span>
              <span>{formatRupiah(sisaTagihan)}</span>
            </div>
          </>
        )}
      </div>

      {/* Pembayaran */}
      {invoice.pembayaran && invoice.pembayaran.length > 0 && (
        <div className="mt-2 pt-1 border-t border-dashed border-black">
          {invoice.pembayaran.map((p) => (
            <div key={p.id} className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span>Metode Bayar</span>
                <span className="uppercase">{p.metode}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Nominal</span>
                <span>{formatRupiah(p.nominal)}</span>
              </div>
              {p.kembalian > 0 && (
                <div className="flex justify-between text-[10px] text-emerald-600">
                  <span>Kembalian</span>
                  <span>{formatRupiah(p.kembalian)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="border-t-2 border-b-2 border-black my-2 py-1 text-center">
        <span className={`font-bold text-xs ${invoice.status === 'lunas' ? 'text-green-700' : invoice.status === 'belum_bayar' ? 'text-red-600' : 'text-gray-600'}`}>
          STATUS: {getStatusLabel(invoice.status)}
        </span>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px]">
        <p className="border-t border-dashed border-black pt-1">================================</p>
        <p className="font-bold">Terima Kasih</p>
        <p>Atas Kunjungan Anda</p>
        <p>Semoga Lekas Sembuh</p>
        <p className="border-b border-dashed border-black pb-1">================================</p>
      </div>
    </div>
  );
}

function PreviewRow({
  label, value, bold,
}: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
