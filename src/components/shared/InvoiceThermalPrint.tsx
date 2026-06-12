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

export function buildReceiptElement(invoice: InvoiceDetail) {
  return (
    <Printer type="epson" width={32} characterSet="pc437_usa">
      {/* ── Header ── */}
      <Text align="center" bold size={{ width: 2, height: 2 }}>
        KLINIK ANDA
      </Text>
      <Text align="center">Jl. Contoh No. 1, Kota Anda</Text>
      <Text align="center">Telp: (024) 000-0000</Text>
      <Line />

      {/* ── Meta ── */}
      <Row left="No. Invoice" right={invoice.no_invoice} />
      <Row left="Tanggal"     right={formatDate(invoice.created_at)} />
      <Row left="Jam"         right={formatTime(invoice.created_at)} />
      <Line />

      {/* ── Pasien ── */}
      <Row left="Pasien"  right={invoice.nama_pasien} />
      <Row left="RM"      right={invoice.no_rekam_medis} />
      <Row left="Dokter"  right={invoice.nama_dokter} />
      <Row left="Kasir"   right={invoice.nama_karyawan} />
      <Line />

      {/* ── Items ── */}
      {invoice.items.map((item) => (
        <>
          <Text key={`name-${item.id}`}>{item.nama_item}</Text>
          <Row
            key={`price-${item.id}`}
            left={`  ${item.qty} x ${formatRupiah(item.harga_satuan)}`}
            right={formatRupiah(item.subtotal)}
          />
        </>
      ))}
      <Line />

      {/* ── Totals ── */}
      {invoice.diskon > 0 && (
        <>
          <Row left="Subtotal" right={formatRupiah(invoice.subtotal)} />
          <Row left="Diskon"   right={`- ${formatRupiah(invoice.diskon)}`} />
        </>
      )}
      <Row
        left={<Text bold>TOTAL</Text>}
        right={<Text bold>{formatRupiah(invoice.total)}</Text>}
      />
      <Line />

      {/* ── Pembayaran ── */}
      {invoice.pembayaran.map((p) => (
        <>
          <Row key={`pay-${p.id}`}  left={p.metode}   right={formatRupiah(p.nominal)} />
          {p.kembalian > 0 && (
            <Row key={`change-${p.id}`} left="  Kembali" right={formatRupiah(p.kembalian)} />
          )}
        </>
      ))}
      <Line />

      {/* ── Footer ── */}
      <Text align="center">Status: {invoice.status}</Text>
      <Br />
      <Text align="center">Terima kasih atas kunjungan Anda!</Text>
      <Text align="center">Semoga lekas sembuh.</Text>
      <Cut lineFeeds={4} />
    </Printer>
  );
}

/** HTML preview — shown on screen, not sent to printer */
export function InvoiceThermalPrint({ invoice }: Props) {
  return (
    <div className="font-mono text-[11px] leading-snug text-black w-full">
      <p className="text-center font-bold text-base">KLINIK ANDA</p>
      <p className="text-center">Jl. Contoh No. 1, Kota Anda</p>
      <p className="text-center">Telp: (024) 000-0000</p>
      <hr className="my-1 border-dashed border-black" />

      <PreviewRow label="No. Invoice" value={invoice.no_invoice} />
      <PreviewRow label="Tanggal"     value={formatDate(invoice.created_at)} />
      <PreviewRow label="Jam"         value={formatTime(invoice.created_at)} />
      <hr className="my-1 border-dashed border-black" />

      <PreviewRow label="Pasien"  value={invoice.nama_pasien} />
      <PreviewRow label="RM"      value={invoice.no_rekam_medis} />
      <PreviewRow label="Dokter"  value={invoice.nama_dokter} />
      <PreviewRow label="Kasir"   value={invoice.nama_karyawan} />
      <hr className="my-1 border-dashed border-black" />

      {invoice.items.map((item) => (
        <div key={item.id} className="mb-1">
          <p>{item.nama_item}</p>
          <div className="flex justify-between pl-2">
            <span>{item.qty} x {formatRupiah(item.harga_satuan)}</span>
            <span>{formatRupiah(item.subtotal)}</span>
          </div>
        </div>
      ))}
      <hr className="my-1 border-dashed border-black" />

      {invoice.diskon > 0 && (
        <>
          <PreviewRow label="Subtotal" value={formatRupiah(invoice.subtotal)} />
          <PreviewRow label="Diskon"   value={`- ${formatRupiah(invoice.diskon)}`} />
        </>
      )}
      <PreviewRow label="TOTAL" value={formatRupiah(invoice.total)} bold />
      <hr className="my-1 border-dashed border-black" />

      {invoice.pembayaran.map((p) => (
        <div key={p.id}>
          <PreviewRow label={p.metode} value={formatRupiah(p.nominal)} />
          {p.kembalian > 0 && (
            <PreviewRow label="  Kembali" value={formatRupiah(p.kembalian)} />
          )}
        </div>
      ))}
      <hr className="my-1 border-dashed border-black" />

      <p className="text-center">Status: {invoice.status}</p>
      <p className="text-center mt-1">Terima kasih atas kunjungan Anda!</p>
      <p className="text-center">Semoga lekas sembuh.</p>
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