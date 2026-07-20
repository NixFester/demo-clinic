// =============================================================================
// SIMKlinik — Shared TypeScript interfaces
// Source of truth: bridge.php handler responses
// =============================================================================

// ─── Common ──────────────────────────────────────────────────────────────────

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

/** Paginated response from paginate() helper */
export interface PaginatedResponse<T> {
  data:         T[];
  total:        number;
  per_page:     number;
  current_page: number;
  last_page:    number;
}

/** Non-paginated list response */
export interface ListResponse<T> {
  data: T[];
}

/** Generic success response */
export interface SuccessResponse {
  success: true;
}

/** Insert response */
export interface InsertResponse {
  id: number;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type RoleEnum           = 'admin' | 'dokter' | 'karyawan' | 'kasir';
export type KategoriLayanan    = 'kecantikan' | 'medis' | 'konsultasi';
export type KategoriProduk     = 'skincare' | 'obat' | 'suplemen' | 'lainnya';
export type GolonganDarah      = 'A' | 'B' | 'AB' | 'O' | 'tidak_diketahui';
export type JenisKelamin       = 'L' | 'P';
export type HariEnum           = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu';
export type JenisKunjungan     = 'baru' | 'lama' | 'kontrol';
export type StatusAntrian      = 'menunggu' | 'dipanggil' | 'selesai' | 'batal' | 'paket';
export type StatusRME          = 'draft' | 'final' | 'batal';
export type StatusInvoice      = 'belum_bayar' | 'lunas' | 'batal';
export type MetodePembayaran   = 'tunai' | 'transfer' | 'qris' | 'debit';
export type JenisDetailInvoice = 'layanan' | 'produk' | 'tindakan';
export type JenisFollowUp      = 'konfirmasi' | 'pengingat' | 'pascakunjungan' | 'kontrol';
export type StatusFollowUp     = 'draft' | 'terkirim' | 'batal';

// =============================================================================
// AUTH — auth.findByUsername
// =============================================================================

/** Returned by auth.findByUsername (password stripped) */
export interface AuthUser {
  id:           number;
  nama_lengkap: string;
  username:     string;
  role:         RoleEnum;
}

// =============================================================================
// PENGGUNA — pengguna.index | .store | .update | .toggleAktif
// =============================================================================

/** pengguna.index row (no password) */
export interface Pengguna extends Timestamps {
  id:           number;
  nama_lengkap: string;
  username:     string;
  role:         RoleEnum;
  is_aktif:     0 | 1;
}

// pengguna.index  → PaginatedResponse<Pengguna>
// pengguna.store  → InsertResponse
// pengguna.update → SuccessResponse
// pengguna.toggleAktif → SuccessResponse

// =============================================================================
// SPESIALISASI — spesialisasi.index | .store | .update
// =============================================================================

export interface Spesialisasi extends Timestamps {
  id:                number;
  nama_spesialisasi: string;
}

// spesialisasi.index  → ListResponse<Spesialisasi>
// spesialisasi.store  → InsertResponse
// spesialisasi.update → SuccessResponse

// =============================================================================
// DOKTER — dokter.index | .store | .update | .toggleAktif
// =============================================================================

/** dokter.index row — joins pengguna + spesialisasi */
export interface Dokter extends Timestamps {
  id:                number;
  no_sip:            string;
  is_aktif:          0 | 1;
  id_pengguna:       number;
  nama_lengkap:      string;       // dari pengguna
  id_spesialisasi:   number;
  nama_spesialisasi: string;       // dari spesialisasi
}

// dokter.index  → ListResponse<Dokter>
// dokter.store  → InsertResponse
// dokter.update → SuccessResponse
// dokter.toggleAktif → SuccessResponse

// =============================================================================
// LAYANAN — layanan.index | .store | .update
// =============================================================================

export interface Layanan extends Timestamps {
  id:           number;
  nama_layanan: string;
  kategori:     KategoriLayanan;
  harga:        number;
  durasi_menit: number;
  is_aktif:     0 | 1;
}

// layanan.index  → PaginatedResponse<Layanan>
// layanan.store  → InsertResponse
// layanan.update → SuccessResponse

// =============================================================================
// PRODUK — produk.index | .store | .update | .deductStok
// =============================================================================

export interface Produk extends Timestamps {
  id:            number;
  nama_produk:   string;
  kategori:      KategoriProduk;
  satuan:        string;
  harga_jual:    number;
  stok:          number;
  stok_minimum:  number;
  is_aktif:      0 | 1;
}

// produk.index      → PaginatedResponse<Produk>
// produk.store      → InsertResponse
// produk.update     → SuccessResponse
// produk.deductStok → SuccessResponse

// =============================================================================
// PAKET LAYANAN — paket_layanan.index | .store | .update | .delete
// =============================================================================

export interface PaketProdukItem {
  id_produk: number;
  nama_produk: string;
  jumlah: number;
  harga_satuan: number;
}

export interface PaketLayanan extends Timestamps {
  id: number;
  nama_paket: string;
  id_layanan: number;
  nama_layanan: string;
  harga_layanan: number;
  harga_total: number;
  total_kunjungan: number;
  sisa_kunjungan: number;
  is_aktif: 0 | 1;
  produk: PaketProdukItem[];
}

// paket_layanan.index  → PaginatedResponse<PaketLayanan>
// paket_layanan.store  → InsertResponse
// paket_layanan.update → SuccessResponse
// paket_layanan.delete → SuccessResponse

// =============================================================================
// JADWAL DOKTER — jadwal.index | .store | .update
// =============================================================================

/** jadwal.index row — joins pengguna (via dokter) */
export interface JadwalDokter extends Timestamps {
  id:           number;
  id_dokter:    number;
  hari:         HariEnum;
  jam_mulai:    string;   // "HH:mm:ss"
  jam_selesai:  string;
  kuota:        number;
  is_aktif:     0 | 1;
  nama_dokter:  string;   // dari pengguna
}

// jadwal.index  → ListResponse<JadwalDokter>
// jadwal.store  → InsertResponse
// jadwal.update → SuccessResponse

// =============================================================================
// DIAGNOSA — diagnosa.search
// =============================================================================

export interface Diagnosa {
  id:            number | null;
  kode_icd10:    string | null;
  nama_diagnosa: string | null;
}

// diagnosa.search → ListResponse<Diagnosa>

// =============================================================================
// PENGATURAN — pengaturan.get | .update
// =============================================================================

export interface Pengaturan extends Timestamps {
  id:                       number;
  nama_klinik:              string;
  alamat_klinik:            string;
  no_telepon_klinik:        string;
  batas_diskon_karyawan:    number;
  footer_invoice:           string;
}

// pengaturan.get    → Pengaturan (direct object, not wrapped)
// pengaturan.update → SuccessResponse

// =============================================================================
// PASIEN — pasien.index | .search | .show | .store | .update | .riwayat
// =============================================================================

export interface Pasien extends Timestamps {
  id:              number;
  no_rekam_medis:  string;
  nik:             string;
  nama_lengkap:    string;
  tempat_lahir:    string;
  tanggal_lahir:   string;        // "YYYY-MM-DD"
  jenis_kelamin:   JenisKelamin;
  alamat:          string;
  no_telepon:      string;
  no_whatsapp:     string;
  golongan_darah:  GolonganDarah;
  alergi:          string | null;
  catatan_kulit:   string | null;
}

/** pasien.index row — subset of Pasien (no alergi/catatan_kulit) */
export interface PasienListItem extends Timestamps {
  id:             number;
  no_rekam_medis: string;
  nik:            string;
  nama_lengkap:   string;
  no_telepon:     string;
  no_whatsapp:    string;
  tanggal_lahir:  string;
  jenis_kelamin:  JenisKelamin;
}

/** pasien.search row — minimal subset */
export interface PasienSearchItem {
  id:             number;
  no_rekam_medis: string;
  nik:            string;
  nama_lengkap:   string;
  no_telepon:     string;
  no_whatsapp:    string;
}

/** pasien.riwayat row */
export interface PasienRiwayatItem {
  id:              number;
  tanggal:         string;
  no_antrian:      number;
  status:          StatusAntrian;
  jenis_kunjungan: JenisKunjungan;
  keluhan_utama:   string | null;
  nama_dokter:     string;
  nama_layanan:    string | null;
  total:           number | null;
  status_invoice:  StatusInvoice | null;
}

// pasien.index  → PaginatedResponse<PasienListItem>
// pasien.search → ListResponse<PasienSearchItem>
// pasien.show   → Pasien (direct object)
// pasien.store  → { id: number; no_rekam_medis: string }
// pasien.update → SuccessResponse
// pasien.riwayat → ListResponse<PasienRiwayatItem>

// =============================================================================
// PENDAFTARAN — pendaftaran.index | .show | .store | .batal | .updateStatus
// =============================================================================

/** pendaftaran.index row */
export interface PendaftaranListItem extends Timestamps {
  id:              number;
  id_pendaftaran: number;
  no_antrian:      number;
  tanggal:         string;
  status:          StatusAntrian;
  jenis_kunjungan: JenisKunjungan;
  nama_pasien:     string;
  no_rekam_medis:  string;
  nama_dokter:     string;
  nama_layanan:    string | null;
  id_invoice?:     number | null;
  no_invoice?:     string | null;
  subtotal?:       string | number;
  diskon?:         string | number;
  total?:          string | number;
  total_dibayar?:  string | number;
  status_invoice?: StatusInvoice | null;
}

/** pendaftaran.show — full detail with joins */
export interface PendaftaranDetail extends Timestamps {
  id:              number;
  no_antrian:      number;
  id_pasien:       number;
  id_dokter:       number;
  id_layanan:      number;
  id_karyawan:     number;
  tanggal:         string;
  keluhan_utama:   string | null;
  jenis_kunjungan: JenisKunjungan;
  status:          StatusAntrian;
  catatan:         string | null;
  // joined pasien
  nama_pasien:     string;
  no_rekam_medis:  string;
  no_whatsapp:     string;
  alergi:          string | null;
  catatan_kulit:   string | null;
  // joined dokter
  nama_dokter:     string;
  // joined layanan
  nama_layanan:    string | null;
  harga_layanan:   number | null;
}

// pendaftaran.index  → PaginatedResponse<PendaftaranListItem>
// pendaftaran.show   → PendaftaranDetail (direct object)
// pendaftaran.store  → { id: number; no_antrian: number }
// pendaftaran.batal  → SuccessResponse
// pendaftaran.updateStatus → SuccessResponse

// =============================================================================
// ANTRIAN — antrian.hari_ini
// =============================================================================

/**
 * antrian.hari_ini row — the main flattened join used across all antrian pages.
 * NOTE: `id` here is pendaftaran.id (as string from PHP PDO default fetch).
 */
export interface AntrianItem {
  id:              string;          // pendaftaran.id
  id_pendaftaran:  string;          // alias, same value
  no_antrian:      number;
  tanggal:         string;
  keluhan_utama:   string | null;
  jenis_kunjungan: JenisKunjungan;
  status:          StatusAntrian | 'paket';
  catatan:         string | null;
  created_at:      string;
  // pasien
  id_pasien:       number;
  nama_pasien:     string;
  no_rekam_medis:  string;
  no_whatsapp:     string;
  // dokter
  nama_dokter:     string;
  // layanan
  nama_layanan:    string | null;
  // paket
  id_paket?:       number | null;
  sisa_kunjungan?: number;
  total_kunjungan?: number;
  // RME (null if not yet created)
  id_rme:          number | null;
  status_rme:      StatusRME | null;
  // paket (optional fields for multi-visit paket layanan)
  id_paket?:       number | null;
  nama_paket?:     string | null;
  total_kunjungan?: number;
  sisa_kunjungan?: number;
}

// antrian.hari_ini → ListResponse<AntrianItem>

// =============================================================================
// RME — rme.show | .store | .update | .finalisasi | .index | .getOrCreate
// =============================================================================

/** tindakan row inside rme.show */
export interface TindakanItem {
  id:              number;
  harga_saat_itu:  number;
  keterangan:      string | null;
  nama_layanan:    string;         // joined
}

/** detail_resep row inside rme.show resep.items */
export interface ResepItem {
  id:           number;
  jumlah:       number;
  dosis:        string;
  aturan_pakai: string;
  keterangan:   string | null;
  nama_produk:  string;            // joined
  harga_jual:   number;            // joined
  stok:         number;            // joined
}

/** Full RME detail — rme.show / rme.getOrCreate */
export interface RMEDetail extends Timestamps {
  id:                       number;
  id_pendaftaran:           number;
  id_pasien:                number;
  id_dokter:                number;
  id_diagnosa_utama:        number | null;
  id_diagnosa_sekunder:     number | null;
  subjektif:                string;
  objektif:                 string;
  assesment:                string;
  plan:                     string;
  kondisi_masuk:            string;
  kondisi_keluar:           string;
  instruksi_tindak_lanjut:  string;
  status:                   StatusRME;
  // joined pasien
  nama_pasien:              string;
  no_rekam_medis:           string;
  // joined dokter
  nama_dokter:              string;
  // joined diagnosa (empty string when null)
  kode_diagnosa_utama:      string;
  nama_diagnosa_utama:      string;
  kode_diagnosa_sekunder:   string;
  nama_diagnosa_sekunder:   string;
  // nested
  tindakan:                 TindakanItem[];
  resep:                    { id: number; items: ResepItem[] } | null;
}

/** rme.index row */
export interface RMEListItem extends Timestamps {
  id:           number;
  status:       StatusRME;
  nama_pasien:  string;
  nama_dokter:  string;
}

// rme.index      → PaginatedResponse<RMEListItem>
// rme.show       → RMEDetail (direct object)
// rme.getOrCreate → RMEDetail (direct object)
// rme.store      → InsertResponse
// rme.update     → SuccessResponse
// rme.finalisasi → SuccessResponse

// =============================================================================
// TINDAKAN — tindakan.store | .delete
// =============================================================================

// tindakan.store  → InsertResponse
// tindakan.delete → SuccessResponse

// =============================================================================
// RESEP — resep.storeItem | .deleteItem
// =============================================================================

/** resep.storeItem response */
export interface ResepStoreItemResponse {
  id:           number;
  id_resep:     number;
  stok_warning: boolean;
  stok_tersisa: number;
  nama_produk:  string;
}

// resep.storeItem  → ResepStoreItemResponse
// resep.deleteItem → SuccessResponse

// =============================================================================
// INVOICE — invoice.index | .show | .generate | .applyDiskon | .batal
// =============================================================================

/** invoice.index row */
export interface InvoiceListItem extends Timestamps {
  id:           number;
  no_invoice:   string;
  subtotal:     number;
  diskon:       number;
  total:        number;
  total_dibayar: number;
  status:       StatusInvoice;
  nama_pasien:  string;
  nama_dokter:  string;
}

/** detail_invoice row inside invoice.show */
export interface DetailInvoice extends Timestamps {
  id:           number;
  id_invoice:   number;
  jenis:        JenisDetailInvoice;
  id_referensi: number | null;
  nama_item:    string;
  qty:          number;
  harga_satuan: number;
  subtotal:     number;
}

/** pembayaran row inside invoice.show */
export interface PembayaranItem extends Timestamps {
  id:            number;
  id_invoice:    number;
  id_karyawan:   number;
  metode:        MetodePembayaran;
  nominal:       number;
  kembalian:     number;
  waktu_bayar:   string;           // DATETIME string
  catatan:       string | null;
  nama_karyawan: string;           // joined
}

/** invoice.show — full detail */
export interface InvoiceDetail extends Timestamps {
  id:              number;
  no_invoice:      string;
  id_pendaftaran:  number;
  id_karyawan:     number;
  subtotal:        number;
  diskon:          number;
  total:           number;
  total_dibayar:   number;
  status:          StatusInvoice;
  // joined
  nama_pasien:     string;
  no_rekam_medis:  string;
  alamat_pasien:   string;
  no_whatsapp:     string;
  nama_karyawan:   string;
  nama_dokter:     string;
  // nested
  items:           DetailInvoice[];
  pembayaran:      PembayaranItem[];
}

/** invoice.generate response */
export interface InvoiceGenerateResponse {
  id:         number;
  no_invoice: string;
  subtotal:   number;
}

/** invoice.applyDiskon response */
export interface InvoiceApplyDiskonResponse {
  success: true;
  total:   number;
}

// invoice.index       → PaginatedResponse<InvoiceListItem>
// invoice.show        → InvoiceDetail (direct object)
// invoice.generate    → InvoiceGenerateResponse
// invoice.applyDiskon → InvoiceApplyDiskonResponse
// invoice.batal       → SuccessResponse

// =============================================================================
// PEMBAYARAN — pembayaran.store
// =============================================================================

export interface PembayaranStoreResponse {
  success:       true;
  lunas:         boolean;
  kembalian:     number;
  total_dibayar: number;
  sisa:          number;
}

// pembayaran.store → PembayaranStoreResponse

// =============================================================================
// FOLLOW UP WA — followup.index | .store | .tandaiTerkirim
// =============================================================================

/** followup.index row */
export interface FollowUpListItem extends Timestamps {
  id:           number;
  jenis:        JenisFollowUp;
  status:       StatusFollowUp;
  no_whatsapp:  string;
  nama_pasien:  string;
  tanggal_kirim: string | null;
  pesan:       string;
  jenis_followup: string;
}

export interface FollowUpStoreData {
  id_pasien:       number;
  id_pengguna:     number;
  no_whatsapp:     string;
  pesan:           string;
  wa_link:         string;
  jenis:           JenisFollowUp;
}

// followup.index         → PaginatedResponse<FollowUpListItem>
// followup.store         → InsertResponse
// followup.tandaiTerkirim → SuccessResponse

// =============================================================================
// LAPORAN — laporan.harian | .bulanan | .layanan | .produk | .dokter | .rme | .range
// =============================================================================

export interface LaporanPerMetode {
  metode: MetodePembayaran | string;
  total:  number;
}

export interface LaporanInvoiceItem {
  no_invoice:    string;
  tanggal:       string;
  nama_pasien:   string;
  nama_dokter:   string;
  total:         number;
  status:        StatusInvoice;
}

// ─── Service/Product Category Breakdown ────────────────────────────────────────

export interface LaporanPerKategori {
  kategori: string;
  total:    number;
  jumlah:   number;
}

export interface LaporanTopItem {
  nama:     string;
  kategori?: string;
  jumlah:   number;
  total:    number;
}

// ─── Doctor Performance ────────────────────────────────────────────────────────

export interface LaporanPerDokter {
  nama_dokter:      string;
  jumlah_pasien:    number;
  total_pendapatan: number;
  rata_rata:       number;
}

// ─── RME Statistics ────────────────────────────────────────────────────────────

export interface LaporanRMEStatus {
  status:  StatusRME;
  jumlah:  number;
}

export interface LaporanRMEDokter {
  nama_dokter: string;
  jumlah:      number;
}

// ─── Enhanced LaporanHarian ────────────────────────────────────────────────────

export interface LaporanHarian {
  tanggal:              string;
  total_pendapatan:     number;
  total_invoice:        number;
  per_metode:           LaporanPerMetode[];
  total_pasien:         number;
  pasien_baru:          number;
  pasien_lama:          number;
  selesai:              number;
  batal:                number;
  antrian:              number;
  per_kategori_layanan: LaporanPerKategori[];
  per_kategori_produk:  LaporanPerKategori[];
  top_layanan:          LaporanTopItem[];
  top_produk:           LaporanTopItem[];
  per_dokter:           LaporanPerDokter[];
  rme_stats: {
    total: number;
    draft: number;
    final: number;
  };
  invoices:             LaporanInvoiceItem[];
}

export interface LaporanPerHari {
  hari:             string;
  jumlah_invoice:   number;
  pendapatan:       number | string;
}

// ─── Enhanced LaporanBulanan ────────────────────────────────────────────────────

export interface LaporanBulanan {
  bulan:               number;
  tahun:               number;
  total_pendapatan:     number;
  total_invoice:        number;
  per_metode:           LaporanPerMetode[];
  total_pasien:         number;
  pasien_baru:          number;
  pasien_lama:          number;
  per_kategori_layanan: LaporanPerKategori[];
  per_kategori_produk:  LaporanPerKategori[];
  per_dokter:           LaporanPerDokter[];
  rme_stats: {
    total: number;
    draft: number;
    final: number;
  };
  per_hari:             LaporanPerHari[];
}

// ─── New Report Types ────────────────────────────────────────────────────────────

export interface LaporanLayanan {
  tanggal:          string;
  per_kategori:    LaporanPerKategori[];
  top_layanan:      LaporanTopItem[];
  total_pendapatan: number;
}

export interface LaporanProduk {
  tanggal:          string;
  per_kategori:    LaporanPerKategori[];
  top_produk:       LaporanTopItem[];
  total_pendapatan: number;
}

export interface LaporanDokter {
  tanggal:          string;
  per_dokter:      LaporanPerDokter[];
  total_pasien:     number;
  total_pendapatan: number;
}

export interface LaporanRME {
  tanggal:    string;
  total:      number;
  per_status: LaporanRMEStatus[];
  per_dokter: LaporanRMEDokter[];
}

export interface LaporanRange {
  tanggal_mulai:        string;
  tanggal_selesai:      string;
  total_pendapatan:     number;
  total_invoice:        number;
  total_pasien:         number;
  pasien_baru:          number;
  pasien_lama:          number;
  per_metode:           LaporanPerMetode[];
  per_kategori_layanan: LaporanPerKategori[];
  per_kategori_produk:  LaporanPerKategori[];
  per_dokter:           LaporanPerDokter[];
  per_hari:             LaporanPerHari[];
}

// laporan.harian  → LaporanHarian (direct object)
// laporan.bulanan → LaporanBulanan (direct object)
// laporan.layanan → LaporanLayanan (direct object)
// laporan.produk  → LaporanProduk (direct object)
// laporan.dokter  → LaporanDokter (direct object)
// laporan.rme     → LaporanRME (direct object)
// laporan.range   → LaporanRange (direct object)