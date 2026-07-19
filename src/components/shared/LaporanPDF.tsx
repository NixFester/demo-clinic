'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { LaporanHarian, LaporanBulanan, LaporanLayanan, LaporanProduk, LaporanDokter, LaporanRME, LaporanRange } from '@/types/api-items';

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const colors = {
  primary: '#059669',
  primaryLight: '#D1FAE5',
  secondary: '#047857',
  dark: '#1F2937',
  gray: '#6B7280',
  light: '#F9FAFB',
  border: '#E5E7EB',
  white: '#FFFFFF',
  red: '#DC2626',
  yellow: '#D97706',
  blue: '#2563EB',
};

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: colors.dark, backgroundColor: colors.white },
  header: { marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  clinicName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 2 },
  clinicAddress: { fontSize: 9, color: colors.gray },
  headerRight: { alignItems: 'flex-end' },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.dark },
  subtitle: { fontSize: 10, color: colors.gray },
  date: { fontSize: 9, color: colors.gray },
  divider: { borderBottomWidth: 2, borderBottomColor: colors.primary, marginVertical: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '23%', backgroundColor: colors.light, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: colors.primary },
  statLabel: { fontSize: 8, color: colors.gray, marginBottom: 2, textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.dark },
  statCardGreen: { width: '48%', backgroundColor: colors.primaryLight, borderRadius: 8, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.primary },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.white, backgroundColor: colors.primary, padding: 8, borderRadius: 4, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.primary },
  tableHeaderCell: { padding: 8, fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.white },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tableCell: { padding: 8, fontSize: 9, color: colors.dark },
  tableCellRight: { padding: 8, fontSize: 9, color: colors.dark, textAlign: 'right' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7 },
  badgeGreen: { backgroundColor: '#DCFCE7', color: '#166534' },
  badgeYellow: { backgroundColor: '#FEF9C3', color: '#854D0E' },
  badgeRed: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  badgeGray: { backgroundColor: colors.light, color: colors.gray },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40 },
  footerLine: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
  footerText: { fontSize: 8, color: colors.gray, textAlign: 'center', width: '100%' },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtRp = (v: number) => 'Rp ' + v.toLocaleString('id-ID');
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
const getBulan = (n: string) => ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][parseInt(n) - 1] ?? n;

// ─── Shared Components ─────────────────────────────────────────────────────────
function PDFHeader({ title, subtitle, date }: { title: string; subtitle: string; date: string }) {
  return (
    <View>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.clinicName}>Elrhea Clinic</Text>
          <Text style={s.clinicAddress}>Jl Bendo 3, Lempongsari, Gajahmungkur, Semarang, 50231</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
          <Text style={s.date}>{date}</Text>
        </View>
      </View>
      <View style={s.divider} />
    </View>
  );
}

function StatCard({ label, value, color = colors.primary }: { label: string; value: string; color?: string }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { style: Record<string, any>; label: string }> = {
    lunas: { style: s.badgeGreen, label: 'LUNAS' },
    belum_bayar: { style: s.badgeYellow, label: 'BELUM LUNAS' },
    batal: { style: s.badgeRed, label: 'BATAL' },
    draft: { style: s.badgeGray, label: 'DRAFT' },
    final: { style: s.badgeGreen, label: 'FINAL' },
  };
  const cfg = map[status] ?? { style: s.badgeGray, label: status.toUpperCase() };
  return <Text style={[s.badge, cfg.style]}>{cfg.label}</Text>;
}

function PDFTable({ headers, rows, colWidths }: { headers: string[]; rows: (string | { text: string; align?: 'right' | 'left'; badge?: string; color?: string })[][]; colWidths?: number[] }) {
  const total = colWidths?.reduce((a, b) => a + b, 0) ?? 100;
  return (
    <View style={s.table}>
      <View style={s.tableHeader}>
        {headers.map((h, i) => (
          <Text key={i} style={[s.tableHeaderCell, { width: colWidths ? `${(colWidths[i] / total) * 100}%` : `${100 / headers.length}%` }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={s.tableRow}>
          {row.map((cell, ci) => {
            const isObj = typeof cell === 'object';
            const text = isObj ? (cell as { text: string }).text : cell as string;
            const align = isObj ? (cell as { align?: string }).align : undefined;
            const badge = isObj ? (cell as { badge?: string }).badge : undefined;
            const cellColor = isObj ? (cell as { color?: string }).color : undefined;
            return (
              <View key={ci} style={{ width: colWidths ? `${(colWidths[ci] / total) * 100}%` : `${100 / row.length}%` }}>
                {badge ? (
                  <StatusBadge status={badge} />
                ) : (
                  <Text style={[align === 'right' ? s.tableCellRight : s.tableCell, cellColor ? { color: cellColor } : {}]}>
                    {text}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Laporan Harian PDF ───────────────────────────────────────────────────────
export function LaporanHarianPDF({ data, tanggal }: { data: LaporanHarian; tanggal: string }) {
  const today = fmtDate(tanggal);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PDFHeader title="Laporan Harian" subtitle="Ringkasan Transaksi" date={today} />

        <View style={s.statsGrid}>
          <StatCard label="Total Pasien" value={String(data.total_pasien ?? 0)} />
          <StatCard label="Transaksi" value={String(data.total_invoice ?? 0)} color={colors.blue} />
          <StatCard label="Pasien Baru" value={String(data.pasien_baru ?? 0)} color="#7C3AED" />
          <StatCard label="Pasien Lama" value={String(data.pasien_lama ?? 0)} color="#0891B2" />
        </View>

        <View style={[s.statCardGreen, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>Total Pendapatan</Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{fmtRp(data.total_pendapatan ?? 0)}</Text>
        </View>

        {data.invoices && data.invoices.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Daftar Transaksi</Text>
            <PDFTable
              headers={['No. Invoice', 'Pasien', 'Dokter', 'Total', 'Status']}
              colWidths={[22, 25, 20, 18, 15]}
              rows={data.invoices.map(inv => [
                inv.no_invoice,
                inv.nama_pasien ?? '-',
                inv.nama_dokter ?? '-',
                { text: fmtRp(inv.total ?? 0), align: 'right' },
                { text: inv.status, badge: inv.status },
              ])}
            />
          </View>
        )}

        <View style={s.footer}>
          <View style={[s.footerLine, { width: '100%' }]}>
            <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Laporan Bulanan PDF ────────────────────────────────────────────────────────
export function LaporanBulananPDF({ data, bulan, tahun }: { data: LaporanBulanan; bulan: string; tahun: string }) {
  const period = `${getBulan(bulan)} ${tahun}`;
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PDFHeader title="Laporan Bulanan" subtitle="Ringkasan Transaksi Bulanan" date={period} />

        <View style={s.statsGrid}>
          <StatCard label="Total Pasien" value={String(data.total_pasien ?? 0)} />
          <StatCard label="Transaksi" value={String(data.total_invoice ?? 0)} color={colors.blue} />
          <StatCard label="Pasien Baru" value={String(data.pasien_baru ?? 0)} color="#7C3AED" />
          <StatCard label="Pasien Lama" value={String(data.pasien_lama ?? 0)} color="#0891B2" />
        </View>

        <View style={[s.statCardGreen, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>Total Pendapatan</Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{fmtRp(data.total_pendapatan ?? 0)}</Text>
        </View>

        {/* Ringkasan per Hari */}
        {data.per_hari && data.per_hari.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ringkasan per Hari</Text>
            <PDFTable
              headers={['Tanggal', 'Jumlah Transaksi', 'Total Pendapatan']}
              colWidths={[50, 25, 25]}
              rows={data.per_hari.map(d => [
                fmtDate(d.hari),
                { text: String(d.jumlah_invoice ?? 0), align: 'right' },
                { text: fmtRp(parseFloat(String(d.pendapatan)) || 0), align: 'right' },
              ])}
            />
          </View>
        )}

        {/* Ringkasan per Metode Pembayaran */}
        {data.per_metode && data.per_metode.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ringkasan per Metode Pembayaran</Text>
            <PDFTable
              headers={['Metode Pembayaran', 'Total']}
              colWidths={[70, 30]}
              rows={data.per_metode.map(m => [
                m.metode.charAt(0).toUpperCase() + m.metode.slice(1),
                { text: fmtRp(parseFloat(String(m.total)) || 0), align: 'right' },
              ])}
            />
          </View>
        )}

        <View style={s.footer}>
          <View style={[s.footerLine, { width: '100%' }]}>
            <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Laporan Range PDF ─────────────────────────────────────────────────────────
export function LaporanRangePDF({ data, mulai, selesai }: { data: LaporanRange; mulai: string; selesai: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PDFHeader title="Laporan Custom Range" subtitle={`Periode ${fmtDate(mulai)} – ${fmtDate(selesai)}`} date={fmtDate(new Date().toISOString())} />

        <View style={[s.statCardGreen, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>Total Pendapatan</Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{fmtRp(data.total_pendapatan ?? 0)}</Text>
        </View>

        <View style={s.statsGrid}>
          <StatCard label="Total Pasien" value={String(data.total_pasien ?? 0)} />
          <StatCard label="Transaksi" value={String(data.total_invoice ?? 0)} color={colors.blue} />
          <StatCard label="Pasien Baru" value={String(data.pasien_baru ?? 0)} color="#7C3AED" />
          <StatCard label="Pasien Lama" value={String(data.pasien_lama ?? 0)} color="#0891B2" />
        </View>

        {data.per_hari && data.per_hari.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ringkasan per Hari</Text>
            <PDFTable
              headers={['Tanggal', 'Jumlah Transaksi', 'Total Pendapatan']}
              colWidths={[40, 30, 30]}
              rows={data.per_hari.map(d => [
                fmtDate(d.hari),
                { text: String(d.jumlah_invoice ?? 0), align: 'right' },
                { text: fmtRp(parseFloat(String(d.pendapatan)) || 0), align: 'right' },
              ])}
            />
          </View>
        )}

        <View style={s.footer}>
          <View style={[s.footerLine, { width: '100%' }]}>
            <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Laporan Layanan PDF ────────────────────────────────────────────────────────
export function LaporanLayananPDF({ data, tanggal }: { data: LaporanLayanan; tanggal: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PDFHeader title="Laporan Layanan" subtitle="Detail Layanan yang Digunakan" date={fmtDate(tanggal)} />

        <View style={[s.statCardGreen, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>Total Pendapatan Layanan</Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{fmtRp(data.total_pendapatan ?? 0)}</Text>
        </View>

        {data.per_kategori && data.per_kategori.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Layanan per Kategori</Text>
            <PDFTable
              headers={['Kategori', 'Jumlah Penggunaan', 'Total Pendapatan']}
              colWidths={[40, 25, 35]}
              rows={data.per_kategori.map(k => [
                k.kategori.charAt(0).toUpperCase() + k.kategori.slice(1),
                { text: String(k.jumlah), align: 'right' },
                { text: fmtRp(k.total), align: 'right' },
              ])}
            />
          </View>
        )}

        {data.top_layanan && data.top_layanan.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Layanan Terbanyak Digunakan</Text>
            <PDFTable
              headers={['Nama Layanan', 'Jumlah Penggunaan', 'Total']}
              colWidths={[50, 20, 30]}
              rows={data.top_layanan.map(l => [l.nama, { text: String(l.jumlah), align: 'right' }, { text: fmtRp(l.total), align: 'right' }])}
            />
          </View>
        )}

        <View style={s.footer}>
          <View style={[s.footerLine, { width: '100%' }]}>
            <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Laporan Produk PDF ────────────────────────────────────────────────────────
export function LaporanProdukPDF({ data, tanggal }: { data: LaporanProduk; tanggal: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PDFHeader title="Laporan Produk" subtitle="Produk yang Digunakan/Dijual" date={fmtDate(tanggal)} />

        <View style={[s.statCardGreen, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>Total Penjualan Produk</Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{fmtRp(data.total_pendapatan ?? 0)}</Text>
        </View>

        {data.per_kategori && data.per_kategori.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Produk per Kategori</Text>
            <PDFTable
              headers={['Kategori', 'Jumlah Terjual', 'Total Penjualan']}
              colWidths={[40, 25, 35]}
              rows={data.per_kategori.map(k => [
                k.kategori.charAt(0).toUpperCase() + k.kategori.slice(1),
                { text: String(k.jumlah), align: 'right' },
                { text: fmtRp(k.total), align: 'right' },
              ])}
            />
          </View>
        )}

        {data.top_produk && data.top_produk.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Produk Terlaris</Text>
            <PDFTable
              headers={['Nama Produk', 'Jumlah Terjual', 'Total Penjualan']}
              colWidths={[50, 20, 30]}
              rows={data.top_produk.map(p => [p.nama, { text: String(p.jumlah), align: 'right' }, { text: fmtRp(p.total), align: 'right' }])}
            />
          </View>
        )}

        <View style={s.footer}>
          <View style={[s.footerLine, { width: '100%' }]}>
            <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Laporan Dokter PDF ────────────────────────────────────────────────────────
export function LaporanDokterPDF({ data, tanggal }: { data: LaporanDokter; tanggal: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PDFHeader title="Laporan Dokter" subtitle="Performa Dokter" date={fmtDate(tanggal)} />

        <View style={[s.statCardGreen, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>Total Pendapatan Dokter</Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{fmtRp(data.total_pendapatan ?? 0)}</Text>
        </View>

        <View style={s.statsGrid}>
          <StatCard label="Total Pasien" value={String(data.total_pasien ?? 0)} />
        </View>

        {data.per_dokter && data.per_dokter.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Performa Dokter</Text>
            <PDFTable
              headers={['Nama Dokter', 'Jumlah Pasien', 'Total Pendapatan', 'Rata-rata']}
              colWidths={[35, 20, 25, 20]}
              rows={data.per_dokter.map(d => [
                d.nama_dokter,
                { text: String(d.jumlah_pasien), align: 'right' },
                { text: fmtRp(d.total_pendapatan), align: 'right' },
                { text: fmtRp(d.rata_rata ?? 0), align: 'right' },
              ])}
            />
          </View>
        )}

        <View style={s.footer}>
          <View style={[s.footerLine, { width: '100%' }]}>
            <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Laporan RME PDF ───────────────────────────────────────────────────────────
export function LaporanRMEPDF({ data, tanggal }: { data: LaporanRME; tanggal: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PDFHeader title="Laporan RME" subtitle="Rekam Medis Elektronik" date={fmtDate(tanggal)} />

        <View style={[s.statCardGreen, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 10, color: colors.primary, textTransform: 'uppercase' }}>Total Rekam Medis</Text>
          <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{String(data.total ?? 0)}</Text>
        </View>

        {data.per_status && data.per_status.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Status RME</Text>
            <PDFTable
              headers={['Status', 'Jumlah']}
              colWidths={[60, 40]}
              rows={data.per_status.map(s => [s.status.charAt(0).toUpperCase() + s.status.slice(1), { text: String(s.jumlah), align: 'right' }])}
            />
          </View>
        )}

        {data.per_dokter && data.per_dokter.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>RME per Dokter</Text>
            <PDFTable
              headers={['Dokter', 'Jumlah RME']}
              colWidths={[60, 40]}
              rows={data.per_dokter.map(d => [d.nama_dokter, { text: String(d.jumlah), align: 'right' }])}
            />
          </View>
        )}

        <View style={s.footer}>
          <View style={[s.footerLine, { width: '100%' }]}>
            <Text style={s.footerText}>Dicetak pada {fmtDate(new Date().toISOString())} — Elrhea Clinic</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
