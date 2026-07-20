const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const SS_DIR = path.join(__dirname, 'ss');
const OUTPUT_DIR = path.join(__dirname, 'dokumen');

// ─── Brand & Theme Config ─────────────────────────────────────────────────────
const BRAND = {
  clinicName: 'SIMKlinik',
  clinicFull: 'Elrhea Clinic',
  version: 'Versi 1.0',
  year: '2026',
};

// Role color themes
const ROLE_THEMES = {
  dokter:    { primary: '059669', light: 'D1FAE5', dark: '064E3B', accent: '10B981', name: 'Dokter' },
  kasir:     { primary: 'D97706', light: 'FEF3C7', dark: '92400E', accent: 'F59E0B', name: 'Kasir' },
  karyawan:  { primary: '2563EB', light: 'DBEAFE', dark: '1E3A8A', accent: '3B82F6', name: 'Karyawan' },
  admin:     { primary: '7C3AED', light: 'EDE9FE', dark: '4C1D95', accent: '8B5CF6', name: 'Admin' },
};

// ─── Layout constants ─────────────────────────────────────────────────────────
const SLIDE_W = 13.3;
const SLIDE_H = 7.5;
const HEADER_H = 0.72;
const FOOTER_H = 0.32;
const FOOTER_Y = SLIDE_H - FOOTER_H;
const CONTENT_TOP = HEADER_H + 0.25;
const CONTENT_BOTTOM = FOOTER_Y - 0.1;

// style: 'body' | 'heading' | 'bullet' | 'bullet-bold' | 'spacer'
const pageDescriptions = {

  'login.png': {
    title: 'Halaman Login',
    section: 'Navigasi & Akses',
    descriptions: [
      { text: 'Ini adalah halaman login sistem SIMKlinik.', style: 'body' },
      { text: 'Langkah Masuk ke Sistem', style: 'heading' },
      { text: 'Masukkan email atau username Anda', style: 'bullet' },
      { text: 'Masukkan password Anda', style: 'bullet' },
      { text: 'Klik tombol "Masuk"', style: 'bullet' },
      { text: 'Pilih Role sesuai akun Anda:', style: 'heading' },
      { text: 'Admin / Superadmin — Akses penuh ke semua fitur', style: 'bullet' },
      { text: 'Dokter — Akses halaman dokter', style: 'bullet' },
      { text: 'Kasir — Akses halaman kasir', style: 'bullet' },
      { text: 'Karyawan — Akses halaman karyawan', style: 'bullet' },
      { text: 'Hubungi admin jika lupa password.', style: 'body' },
    ]
  },
  'dokter-dashboard.png': {
    title: 'Dashboard Dokter',
    section: 'Ringkasan',
    descriptions: [
      { text: 'Halaman utama setelah dokter berhasil login.', style: 'body' },
      { text: 'Di halaman ini dokter bisa melihat:', style: 'body' },
      { text: 'Statistik antrian hari ini', style: 'bullet' },
      { text: 'Jumlah pasien yang sudah dilayani', style: 'bullet' },
      { text: 'Jadwal praktik hari ini', style: 'bullet' },
      { text: 'Notifikasi pasien baru', style: 'bullet' },
      { text: 'Menu navigasi berada di sidebar kiri.', style: 'body' },
      { text: 'Klik nama di header untuk logout.', style: 'body' },
      { text: 'Fitur Utama Dokter', style: 'heading' },
      { text: 'Antrian Saya — Daftar pasien menunggu', style: 'bullet' },
      { text: 'Jadwal Saya — Lihat jadwal praktik', style: 'bullet' },
      { text: 'RME — Rekam Medis Elektronik', style: 'bullet' },
    ]
  },
  'dokter-antrian.png': {
    title: 'Antrian Saya',
    section: 'Manajemen Pasien',
    descriptions: [
      { text: 'Halaman ini menampilkan daftar pasien yang mengantri.', style: 'body' },
      { text: 'Kolom yang Ditampilkan:', style: 'heading' },
      { text: 'No. Antrian', style: 'bullet' },
      { text: 'Nama Pasien', style: 'bullet' },
      { text: 'Keluhan Awal', style: 'bullet' },
      { text: 'Status (Menunggu / Dipanggil / Selesai)', style: 'bullet' },
      { text: 'Aksi yang Bisa Dilakukan:', style: 'heading' },
      { text: 'Klik "Isi RME" untuk membuat rekam medis', style: 'bullet' },
      { text: 'Klik "Panggil" untuk memanggil pasien', style: 'bullet' },
      { text: 'Halaman auto-refresh setiap 30 detik.', style: 'body' },
      { text: 'Pasien akan muncul otomatis setelah mendaftar di loket karyawan.', style: 'body' },
    ]
  },
  'dokter-rme-sebelumnya.png': {
    title: 'RME — Riwayat Pasien',
    section: 'Rekam Medis',
    descriptions: [
      { text: 'Halaman untuk melihat rekam medis pasien sebelumnya.', style: 'body' },
      { text: 'Tampilan yang Tersedia:', style: 'heading' },
      { text: 'Daftar RME yang sudah dibuat', style: 'bullet' },
      { text: 'Tanggal dan jam kunjungan', style: 'bullet' },
      { text: 'Diagnosis dan tindakan yang dilakukan', style: 'bullet' },
      { text: 'Resep obat yang diberikan', style: 'bullet' },
      { text: 'Berguna untuk:', style: 'heading' },
      { text: 'Melihat riwayat treatment pasien', style: 'bullet' },
      { text: 'Mengetahui obat yang pernah diresepkan', style: 'bullet' },
      { text: 'Memahami kondisi kesehatan pasien', style: 'bullet' },
      { text: 'Klik salah satu item untuk lihat detail.', style: 'body' },
    ]
  },
  'dokter-rme-pengisian-soap-form.png': {
    title: 'RME — Formulir SOAP',
    section: 'Rekam Medis',
    descriptions: [
      { text: 'Formulir utama untuk mengisi Rekam Medis Elektronik.', style: 'body' },
      { text: 'SOAP adalah singkatan dari:', style: 'heading' },
      { text: 'S — Subjective (Subjektif): Keluhan utama & riwayat penyakit', style: 'bullet' },
      { text: 'O — Objective (Obyektif): Tekanan darah, suhu, berat & tinggi', style: 'bullet' },
      { text: 'A — Assessment (Asesmen): Diagnosis dokter', style: 'bullet' },
      { text: 'P — Plan (Rencana): Rencana treatment selanjutnya', style: 'bullet' },
      { text: 'Isi setiap bagian secara lengkap untuk dokumentasi medis yang baik.', style: 'body' },
    ]
  },
  'dokter-pengisian-form-layanan.png': {
    title: 'RME — Pilih Layanan',
    section: 'Rekam Medis',
    descriptions: [
      { text: 'Halaman untuk memilih layanan atau tindakan medis.', style: 'body' },
      { text: 'Jenis Layanan yang Tersedia:', style: 'heading' },
      { text: 'Pemeriksaan Umum', style: 'bullet' },
      { text: 'Tindakan Medis', style: 'bullet' },
      { text: 'Konsultasi Spesialis', style: 'bullet' },
      { text: 'Langkah-langkah:', style: 'heading' },
      { text: 'Pilih jenis layanan dari dropdown', style: 'bullet' },
      { text: 'Pilih dokter yang menangani', style: 'bullet' },
      { text: 'Klik "Tambah" untuk menambah layanan', style: 'bullet' },
      { text: 'Harga layanan akan muncul otomatis.', style: 'body' },
      { text: 'Dokter bisa menambahkan multiple layanan.', style: 'body' },
    ]
  },
  'dokter-form-resep-obat.png': {
    title: 'RME — Resep Obat',
    section: 'Rekam Medis',
    descriptions: [
      { text: 'Halaman untuk membuat resep obat pasien.', style: 'body' },
      { text: 'Fitur yang Tersedia:', style: 'heading' },
      { text: 'Search obat berdasarkan nama', style: 'bullet' },
      { text: 'Lihat stok obat yang tersedia', style: 'bullet' },
      { text: 'Input jumlah obat yang diberikan', style: 'bullet' },
      { text: 'Aturan pakai (misal: 3x1 sehari)', style: 'bullet' },
      { text: 'Peringatan penting:', style: 'heading' },
      { text: 'Warning jika stok hampir habis', style: 'bullet' },
      { text: 'Info kadaluarsa obat', style: 'bullet' },
      { text: 'Setelah resep selesai, kirim ke kasir agar pasien bisa bayar dan ambil obat.', style: 'body' },
    ]
  },
  'kasir-list-invoice.png': {
    title: 'Daftar Invoice',
    section: 'Pembayaran',
    descriptions: [
      { text: 'Halaman untuk melihat semua invoice pembayaran.', style: 'body' },
      { text: 'Kolom yang Ditampilkan:', style: 'heading' },
      { text: 'No. Invoice', style: 'bullet' },
      { text: 'Nama Pasien', style: 'bullet' },
      { text: 'Tanggal', style: 'bullet' },
      { text: 'Total Tagihan', style: 'bullet' },
      { text: 'Status (Lunas / Belum Lunas)', style: 'bullet' },
      { text: 'Filter yang Tersedia:', style: 'heading' },
      { text: 'Semua Invoice', style: 'bullet' },
      { text: 'Belum Lunas Saja', style: 'bullet' },
      { text: 'Lunas Saja', style: 'bullet' },
      { text: 'Klik baris untuk lihat detail invoice.', style: 'body' },
    ]
  },
  'kasir-invoice-detail.png': {
    title: 'Detail Invoice',
    section: 'Pembayaran',
    descriptions: [
      { text: 'Halaman untuk melihat rincian invoice pasien.', style: 'body' },
      { text: 'Data Pasien:', style: 'heading' },
      { text: 'Nama lengkap & No. Rekam Medis', style: 'bullet' },
      { text: 'Daftar Layanan:', style: 'heading' },
      { text: 'Nama layanan & dokter penanggung', style: 'bullet' },
      { text: 'Harga per layanan', style: 'bullet' },
      { text: 'Daftar Produk / Obat:', style: 'heading' },
      { text: 'Nama produk, jumlah, dan harga', style: 'bullet' },
      { text: 'Ringkasan:', style: 'heading' },
      { text: 'Subtotal — Diskon (jika ada) — Total yang harus dibayar', style: 'bullet' },
    ]
  },
  'kasir-struk-invoice.png': {
    title: 'Struk Pembayaran',
    section: 'Pembayaran',
    descriptions: [
      { text: 'Preview struk pembayaran sebelum dicetak.', style: 'body' },
      { text: 'Format struk thermal printer:', style: 'heading' },
      { text: 'Header: Logo klinik, nama lengkap, alamat & telepon', style: 'bullet' },
      { text: 'Isi: No. Invoice, tanggal & waktu, daftar item', style: 'bullet' },
      { text: 'Ringkasan: Subtotal per kategori, total akhir', style: 'bullet' },
      { text: 'Metode pembayaran', style: 'bullet' },
      { text: 'Footer: Pesan terima kasih & QR code (opsional)', style: 'bullet' },
    ]
  },
  'kasir-print-pembayaran.png': {
    title: 'Proses Pembayaran',
    section: 'Pembayaran',
    descriptions: [
      { text: 'Halaman untuk memproses pembayaran dan cetak struk.', style: 'body' },
      { text: 'Langkah-langkah Pembayaran:', style: 'heading' },
      { text: 'Pilih Metode Bayar: Tunai / Transfer Bank / QRIS', style: 'bullet' },
      { text: 'Input Jumlah Bayar — sistem auto-hitung kembalian', style: 'bullet' },
      { text: 'Klik "Bayar" — invoice berubah jadi Lunas & struk cetak', style: 'bullet' },
      { text: 'Jika printer offline, struk bisa disimpan sebagai PDF.', style: 'body' },
    ]
  },
  'karyawan-dashboard.png': {
    title: 'Dashboard Karyawan',
    section: 'Ringkasan',
    descriptions: [
      { text: 'Halaman utama setelah karyawan login.', style: 'body' },
      { text: 'Statistik yang Ditampilkan:', style: 'heading' },
      { text: 'Total pasien hari ini', style: 'bullet' },
      { text: 'Jumlah antrian aktif', style: 'bullet' },
      { text: 'Pasien belum bayar', style: 'bullet' },
      { text: 'Total pendapatan hari ini', style: 'bullet' },
      { text: 'Menu shortcut di bagian bawah:', style: 'heading' },
      { text: 'Pendaftaran — Daftarkan pasien baru', style: 'bullet' },
      { text: 'Kasir — Proses pembayaran', style: 'bullet' },
      { text: 'Sidebar kiri untuk navigasi lengkap.', style: 'body' },
    ]
  },
  'karyawan-antrian-tanpa-pasien.png': {
    title: 'Antrian — Kosong',
    section: 'Manajemen Antrian',
    descriptions: [
      { text: 'Tampilan saat belum ada pasien dalam antrian.', style: 'body' },
      { text: 'Status screen:', style: 'heading' },
      { text: 'Pesan "Belum ada antrian"', style: 'bullet' },
      { text: 'Tombol "Refresh" untuk update manual', style: 'bullet' },
      { text: 'Auto-refresh aktif setiap 30 detik.', style: 'body' },
      { text: 'Antrian akan terisi setelah ada pendaftaran pasien baru.', style: 'body' },
    ]
  },
  'karyawan-antrian-dengan-pasien.png': {
    title: 'Antrian — Dengan Pasien',
    section: 'Manajemen Antrian',
    descriptions: [
      { text: 'Tampilan antrian yang sudah ada pasiennya.', style: 'body' },
      { text: 'Kolom Tabel:', style: 'heading' },
      { text: 'No. Antrian — Nama Pasien — Dokter Tujuan', style: 'bullet' },
      { text: 'Keluhan Awal — Status', style: 'bullet' },
      { text: 'Aksi per Baris:', style: 'heading' },
      { text: 'Panggil — Panggil pasien untuk diperiksa', style: 'bullet' },
      { text: 'Detail — Lihat detail pasien', style: 'bullet' },
      { text: 'Update — Ubah status antrian', style: 'bullet' },
      { text: 'Status: Menunggu / Dipanggil / Selesai', style: 'body' },
    ]
  },
  'karyawan-antrian-siapkan-obat.png': {
    title: 'Antrian — Siapkan Obat',
    section: 'Manajemen Antrian',
    descriptions: [
      { text: 'Halaman untuk preparing obat setelah dokter memeriksa.', style: 'body' },
      { text: 'Workflow Persiapan Obat:', style: 'heading' },
      { text: '1. Dokter sudah mengisi: Form SOAP & Resep obat', style: 'bullet' },
      { text: '2. Karyawan prepare obat: Cek resep, siapkan, checklist', style: 'bullet' },
      { text: '3. Klik "Selesai": Pasien mendapat notifikasi & siap ke kasir', style: 'bullet' },
      { text: 'Pastikan obat sudah benar sebelum konfirmasi selesai.', style: 'body' },
    ]
  },
  'karyawan-pendaftaran.png': {
    title: 'Pendaftaran Pasien',
    section: 'Pendaftaran',
    descriptions: [
      { text: 'Form untuk mendaftarkan pasien baru.', style: 'body' },
      { text: 'Field yang Harus Diisi:', style: 'heading' },
      { text: 'Data Diri: Nama lengkap, tanggal lahir, jenis kelamin, alamat', style: 'bullet' },
      { text: 'Kontak: No. HP / WhatsApp', style: 'bullet' },
      { text: 'Kunjungan: Keluhan awal / alasan datang', style: 'bullet' },
      { text: 'Setelah Submit:', style: 'heading' },
      { text: 'Pasien masuk antrian, dapat nomor antrian, menunggu dipanggil', style: 'bullet' },
    ]
  },
  'karyawan-pendaftaran-form-layanan-dokter.png': {
    title: 'Pendaftaran — Pilih Layanan',
    section: 'Pendaftaran',
    descriptions: [
      { text: 'Step 2 dari pendaftaran pasien.', style: 'body' },
      { text: 'Opsi yang Harus Dipilih:', style: 'heading' },
      { text: 'Pilih Layanan: Pemeriksaan Umum / Tindakan Khusus / Konsultasi', style: 'bullet' },
      { text: 'Pilih Dokter: Dari daftar dokter aktif', style: 'bullet' },
      { text: 'Pilih Jadwal: Tanggal praktik & jam yang tersedia', style: 'bullet' },
      { text: 'Setelah dipilih, sistem generate nomor antrian.', style: 'body' },
    ]
  },
  'karyawan-kasir.png': {
    title: 'Kasir',
    section: 'Pembayaran',
    descriptions: [
      { text: 'Halaman untuk proses pembayaran.', style: 'body' },
      { text: 'Fitur Utama:', style: 'heading' },
      { text: 'Daftar invoice belum lunas', style: 'bullet' },
      { text: 'Filter berdasarkan tanggal', style: 'bullet' },
      { text: 'Detail layanan & produk', style: 'bullet' },
      { text: 'Metode pembayaran: Tunai / Transfer bank / QRIS', style: 'bullet' },
      { text: 'Setelah bayar: Invoice status = Lunas, struk bisa dicetak.', style: 'body' },
    ]
  },
  'karyawan-katalog-produk.png': {
    title: 'Katalog Produk',
    section: 'Referensi',
    descriptions: [
      { text: 'Halaman untuk melihat daftar produk farmasi.', style: 'body' },
      { text: 'Kolom yang Ditampilkan:', style: 'heading' },
      { text: 'Kode Produk — Nama Produk — Harga Jual — Stok — Status', style: 'bullet' },
      { text: 'Fitur Search: Cari berdasarkan nama atau kode.', style: 'bullet' },
      { text: 'Filter: Semua / Tersedia / Stok Rendah', style: 'bullet' },
      { text: 'Catatan: Karyawan hanya bisa melihat, edit produk adalah hak admin.', style: 'body' },
    ]
  },
  'karyawan-layanan.png': {
    title: 'Katalog Layanan',
    section: 'Referensi',
    descriptions: [
      { text: 'Halaman untuk melihat daftar layanan klinik.', style: 'body' },
      { text: 'Kolom yang Ditampilkan:', style: 'heading' },
      { text: 'Kode Layanan — Nama — Dokter Penanggung — Harga — Status', style: 'bullet' },
      { text: 'Fitur search untuk cari layanan.', style: 'bullet' },
      { text: 'Catatan: Karyawan hanya bisa melihat (read-only). Tambah, edit, hapus adalah hak admin.', style: 'body' },
    ]
  },
  'karyawan-laporan-pembayaran.png': {
    title: 'Laporan Pembayaran',
    section: 'Laporan',
    descriptions: [
      { text: 'Halaman untuk melihat laporan pembayaran.', style: 'body' },
      { text: 'Filter yang Tersedia:', style: 'heading' },
      { text: 'Tanggal (harian atau range)', style: 'bullet' },
      { text: 'Status (Semua / Lunas / Belum)', style: 'bullet' },
      { text: 'Data yang Ditampilkan:', style: 'heading' },
      { text: 'Total pendapatan, jumlah transaksi, rincian per invoice', style: 'bullet' },
      { text: 'Fitur Export: Download PDF atau Download Excel.', style: 'bullet' },
    ]
  },
  'karyawan-laporan-pdf.png': {
    title: 'Laporan — Format PDF',
    section: 'Laporan',
    descriptions: [
      { text: 'Download laporan dalam format PDF.', style: 'body' },
      { text: 'Jenis Laporan Tersedia:', style: 'heading' },
      { text: 'Laporan Harian — Aktivitas satu hari tertentu', style: 'bullet' },
      { text: 'Laporan Bulanan — Rekap seluruh bulan', style: 'bullet' },
      { text: 'Laporan Per Dokter — Statistik masing-masing dokter', style: 'bullet' },
      { text: 'Laporan Produk — Penjualan produk farmasi', style: 'bullet' },
      { text: 'Laporan Layanan — Penjualan layanan klinik', style: 'bullet' },
      { text: 'Aksi: Preview, Download PDF, Print, Kirim via WhatsApp.', style: 'bullet' },
    ]
  },
  'admin-dashboard.png': {
    title: 'Dashboard Admin',
    section: 'Ringkasan',
    descriptions: [
      { text: 'Halaman utama setelah admin login.', style: 'body' },
      { text: 'Statistik Lengkap:', style: 'heading' },
      { text: 'Total semua pasien', style: 'bullet' },
      { text: 'Pendapatan bulan ini', style: 'bullet' },
      { text: 'Antrian aktif', style: 'bullet' },
      { text: 'Pasien belum bayar', style: 'bullet' },
      { text: 'Total dokter aktif', style: 'bullet' },
      { text: 'Admin punya akses penuh ke:', style: 'heading' },
      { text: 'Manajemen dokter, layanan, produk, pengguna, dan semua laporan.', style: 'bullet' },
    ]
  },
  'admin-laporan.png': {
    title: 'Menu Laporan',
    section: 'Laporan',
    descriptions: [
      { text: 'Halaman utama untuk semua laporan klinik.', style: 'body' },
      { text: 'Jenis Laporan yang Tersedia:', style: 'heading' },
      { text: 'HARIAN — Aktivitas per hari tertentu', style: 'bullet' },
      { text: 'BULANAN — Rekap seluruh bulan', style: 'bullet' },
      { text: 'PER DOKTER — Statistik masing-masing dokter', style: 'bullet' },
      { text: 'PRODUK — Laporan penjualan produk', style: 'bullet' },
      { text: 'LAYANAN — Laporan penjualan layanan', style: 'bullet' },
      { text: 'Filter: Pilih tanggal, export PDF / Excel.', style: 'bullet' },
    ]
  },
  'admin-contoh-laporan.png': {
    title: 'Contoh Laporan',
    section: 'Laporan',
    descriptions: [
      { text: 'Preview tampilan laporan sebelum didownload.', style: 'body' },
      { text: 'Komponen Laporan:', style: 'heading' },
      { text: 'Header: Logo klinik, nama & alamat, judul & perioda laporan', style: 'bullet' },
      { text: 'Isi: Tabel data — tanggal, nama pasien, layanan, jumlah & harga', style: 'bullet' },
      { text: 'Footer: Subtotal, total keseluruhan, tanda tangan (opsional)', style: 'bullet' },
      { text: 'Bisa diedit sebelum export.', style: 'body' },
    ]
  },
  'admin-dokter.png': {
    title: 'Manajemen Dokter',
    section: 'Data Master',
    descriptions: [
      { text: 'Halaman CRUD data dokter.', style: 'body' },
      { text: 'Field Data Dokter:', style: 'heading' },
      { text: 'Nama lengkap, No. SIP, No. HP, Email', style: 'bullet' },
      { text: 'Spesialisasi: Pilih dari daftar spesialisasi', style: 'bullet' },
      { text: 'Jadwal: Atur jam praktik & hari kerja', style: 'bullet' },
      { text: 'Aksi:', style: 'heading' },
      { text: 'Tambah dokter baru', style: 'bullet' },
      { text: 'Edit data dokter', style: 'bullet' },
      { text: 'Toggle aktif / nonaktif', style: 'bullet' },
    ]
  },
  'admin-spesialisasi.png': {
    title: 'Manajemen Spesialisasi',
    section: 'Data Master',
    descriptions: [
      { text: 'Halaman untuk mengelola spesialisasi dokter.', style: 'body' },
      { text: 'Field Spesialisasi:', style: 'heading' },
      { text: 'Kode spesialisasi — Nama spesialisasi — Deskripsi (opsional)', style: 'bullet' },
      { text: 'Aksi yang Tersedia:', style: 'heading' },
      { text: 'Tambah spesialisasi baru', style: 'bullet' },
      { text: 'Edit nama spesialisasi', style: 'bullet' },
      { text: 'Hapus spesialisasi', style: 'bullet' },
      { text: 'Spesialisasi harus dilepas dari semua dokter terlebih dahulu sebelum dihapus.', style: 'body' },
    ]
  },
  'admin-layanan.png': {
    title: 'Manajemen Layanan',
    section: 'Data Master',
    descriptions: [
      { text: 'Halaman CRUD layanan klinik.', style: 'body' },
      { text: 'Field Layanan:', style: 'heading' },
      { text: 'Kode layanan, nama layanan, harga', style: 'bullet' },
      { text: 'Dokter penanggung jawab', style: 'bullet' },
      { text: 'Status: Aktif / Nonaktif', style: 'bullet' },
      { text: 'Aksi:', style: 'heading' },
      { text: 'Tambah / Edit / Hapus layanan', style: 'bullet' },
      { text: 'Toggle aktif / nonaktif', style: 'bullet' },
      { text: 'Layanan muncul saat karyawan mendaftarkan pasien.', style: 'body' },
    ]
  },
  'admin-produk.png': {
    title: 'Manajemen Produk',
    section: 'Data Master',
    descriptions: [
      { text: 'Halaman CRUD produk farmasi.', style: 'body' },
      { text: 'Field Produk:', style: 'heading' },
      { text: 'Kode produk, nama produk, harga jual', style: 'bullet' },
      { text: 'Stok saat ini & stok minimum (alert)', style: 'bullet' },
      { text: 'Supplier: Nama & no. supplier', style: 'bullet' },
      { text: 'Aksi:', style: 'heading' },
      { text: 'Tambah / Edit / Update stok / Hapus produk', style: 'bullet' },
      { text: 'Warning muncul jika stok di bawah stok minimum.', style: 'body' },
    ]
  },
};

// ─── Role Slide Configurations ─────────────────────────────────────────────────
const roles = {
  dokter: {
    title: 'Panduan Pengguna — Dokter',
    subtitle: 'SIMKlinik Elrhea Clinic',
    tagline: 'Panduan Pengguna',
    theme: ROLE_THEMES.dokter,
    slides: [
      { img: 'login.png' },
      { img: 'dokter-dashboard.png' },
      { img: 'dokter-antrian.png' },
      { img: 'dokter-rme-sebelumnya.png' },
      { img: 'dokter-rme-pengisian-soap-form.png' },
      { img: 'dokter-pengisian-form-layanan.png' },
      { img: 'dokter-form-resep-obat.png' },
    ]
  },
  kasir: {
    title: 'Panduan Pengguna — Kasir',
    subtitle: 'SIMKlinik Elrhea Clinic',
    tagline: 'Panduan Pengguna',
    theme: ROLE_THEMES.kasir,
    slides: [
      { img: 'login.png' },
      { img: 'kasir-list-invoice.png' },
      { img: 'kasir-invoice-detail.png' },
      { img: 'kasir-struk-invoice.png' },
      { img: 'kasir-print-pembayaran.png' },
    ]
  },
  karyawan: {
    title: 'Panduan Pengguna — Karyawan',
    subtitle: 'SIMKlinik Elrhea Clinic',
    tagline: 'Panduan Pengguna',
    theme: ROLE_THEMES.karyawan,
    slides: [
      { img: 'login.png' },
      { img: 'karyawan-dashboard.png' },
      { img: 'karyawan-antrian-tanpa-pasien.png' },
      { img: 'karyawan-antrian-dengan-pasien.png' },
      { img: 'karyawan-antrian-siapkan-obat.png' },
      { img: 'karyawan-pendaftaran.png' },
      { img: 'karyawan-pendaftaran-form-layanan-dokter.png' },
      { img: 'karyawan-kasir.png' },
      { img: 'karyawan-katalog-produk.png' },
      { img: 'karyawan-layanan.png' },
      { img: 'karyawan-laporan-pembayaran.png' },
      { img: 'karyawan-laporan-pdf.png' },
    ]
  },
  admin: {
    title: 'Panduan Pengguna — Admin',
    subtitle: 'SIMKlinik Elrhea Clinic',
    tagline: 'Panduan Pengguna',
    theme: ROLE_THEMES.admin,
    slides: [
      { img: 'login.png' },
      { img: 'admin-dashboard.png' },
      { img: 'admin-laporan.png' },
      { img: 'admin-contoh-laporan.png' },
      { img: 'admin-dokter.png' },
      { img: 'admin-spesialisasi.png' },
      { img: 'admin-layanan.png' },
      { img: 'admin-produk.png' },
    ]
  }
};

// ─── Helper: Build styled text block from description array ───────────────────
function buildStyledText(slide, pres, descriptions, x, y, w, h, theme) {
  let cursorY = y;
  const lineH = 0.33;
  const headingLineH = 0.36;
  const spacer = 0.14;

  descriptions.forEach(item => {
    if (item.style === 'spacer') {
      cursorY += spacer;
      return;
    }
    if (cursorY > y + h - 0.28) return;

    if (item.style === 'heading') {
      slide.addShape(pres.ShapeType.rect, {
        x: x, y: cursorY + 0.04, w: 0.07, h: 0.2,
        fill: { color: theme.primary }
      });
      slide.addText(item.text, {
        x: x + 0.16, y: cursorY, w: w - 0.16, h: headingLineH,
        fontSize: 12.5, fontFace: 'Arial', bold: true,
        color: theme.dark, margin: 0
      });
      cursorY += headingLineH + 0.04;
    } else if (item.style === 'body') {
      slide.addText(item.text, {
        x: x, y: cursorY, w: w, h: lineH,
        fontSize: 11, fontFace: 'Arial', color: '4B5563', margin: 0
      });
      cursorY += lineH;
    } else if (item.style === 'bullet' || item.style === 'bullet-bold') {
      slide.addShape(pres.ShapeType.ellipse, {
        x: x + 0.05, y: cursorY + 0.09, w: 0.09, h: 0.09,
        fill: { color: theme.accent }
      });
      slide.addText(item.text, {
        x: x + 0.22, y: cursorY, w: w - 0.22, h: lineH,
        fontSize: item.style === 'bullet-bold' ? 11.5 : 11,
        fontFace: 'Arial',
        bold: item.style === 'bullet-bold',
        color: '374151', margin: 0
      });
      cursorY += lineH;
    }
  });
}

// ─── Helper: Footer bar ────────────────────────────────────────────────────────
function addFooter(slide, pres, theme, slideNum, total) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: FOOTER_Y, w: SLIDE_W, h: FOOTER_H,
    fill: { color: theme.primary }
  });
  slide.addText(BRAND.clinicName + ' — ' + theme.name, {
    x: 0.3, y: FOOTER_Y + 0.04, w: 8, h: FOOTER_H - 0.04,
    fontSize: 9, fontFace: 'Arial', color: 'FFFFFF', margin: 0
  });
  if (slideNum && total) {
    slide.addText(slideNum + ' / ' + total, {
      x: SLIDE_W - 1.1, y: FOOTER_Y + 0.04, w: 0.9, h: FOOTER_H - 0.04,
      fontSize: 9, fontFace: 'Arial', color: 'FFFFFF', align: 'right', margin: 0
    });
  }
}

// ─── Helper: Header bar ────────────────────────────────────────────────────────
function addHeader(slide, pres, theme, title, slideNum, total) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_W, h: HEADER_H,
    fill: { color: theme.primary }
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: HEADER_H - 0.05, w: SLIDE_W, h: 0.05,
    fill: { color: theme.accent }
  });
  slide.addText(title, {
    x: 0.4, y: 0.1, w: SLIDE_W - 2, h: HEADER_H - 0.1,
    fontSize: 17, fontFace: 'Arial', bold: true,
    color: 'FFFFFF', margin: 0
  });
  if (slideNum && total) {
    slide.addText(slideNum + ' / ' + total, {
      x: SLIDE_W - 1.1, y: 0.18, w: 0.9, h: 0.35,
      fontSize: 11, fontFace: 'Arial', color: 'FFFFFF', align: 'right', margin: 0
    });
  }
}

// ─── Helper: Progress bar ──────────────────────────────────────────────────────
function addProgressBar(slide, pres, theme, current, total) {
  const barY = FOOTER_Y - 0.07;
  const barH = 0.04;
  const filled = (current / total) * SLIDE_W;
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: barY, w: SLIDE_W, h: barH,
    fill: { color: theme.light }
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: barY, w: filled, h: barH,
    fill: { color: theme.accent }
  });
}

// ─── Slide 1: Cover ────────────────────────────────────────────────────────────
function createCoverSlide(pres, config) {
  const theme = config.theme;
  const slide = pres.addSlide();

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color: theme.primary }
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 9.4, y: 0, w: 3.9, h: 2.1,
    fill: { color: theme.dark, transparency: 30 }
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: 10.8, y: 4.2, w: 3.6, h: 3.6,
    fill: { color: theme.accent, transparency: 70 }
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: -1, y: 5.2, w: 2.8, h: 2.8,
    fill: { color: theme.dark, transparency: 55 }
  });

  // Clinic badge
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 0.85, w: 3.2, h: 0.48,
    fill: { color: 'FFFFFF', transparency: 18 }
  });
  slide.addText(BRAND.clinicName + '  ' + BRAND.clinicFull, {
    x: 0.5, y: 0.85, w: 3.2, h: 0.48,
    fontSize: 10, fontFace: 'Arial', bold: true,
    color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0
  });

  // Title
  slide.addText(config.title, {
    x: 0.5, y: 1.9, w: 9.5, h: 1.3,
    fontSize: 36, fontFace: 'Arial', bold: true,
    color: 'FFFFFF', margin: 0
  });

  // Subtitle
  slide.addText(config.subtitle, {
    x: 0.5, y: 3.2, w: 9.5, h: 0.5,
    fontSize: 17, fontFace: 'Arial', color: 'FFFFFF', margin: 0
  });

  // Divider
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 3.85, w: 3.2, h: 0.04,
    fill: { color: theme.accent }
  });

  // TOC label
  slide.addText('Daftar Isi', {
    x: 0.5, y: 4.0, w: 3, h: 0.32,
    fontSize: 11, fontFace: 'Arial', italic: true,
    color: 'FFFFFF', margin: 0
  });

  const tocItems = config.slides.map((s, i) => {
    const desc = pageDescriptions[s.img];
    return {
      num: i + 1,
      title: desc ? desc.title : s.img.replace('.png', '')
    };
  });

  const half = Math.ceil(tocItems.length / 2);
  const col1 = tocItems.slice(0, half);
  const col2 = tocItems.slice(half);

  const pad = n => String(n).padStart(2, '0');
  slide.addText(col1.map(item => pad(item.num) + '   ' + item.title).join('\n'), {
    x: 0.5, y: 4.4, w: 4.6, h: 2.7,
    fontSize: 10.5, fontFace: 'Arial', color: 'FFFFFF', margin: 0
  });
  slide.addText(col2.map(item => pad(item.num) + '   ' + item.title).join('\n'), {
    x: 5.2, y: 4.4, w: 4.6, h: 2.7,
    fontSize: 10.5, fontFace: 'Arial', color: 'FFFFFF', margin: 0
  });

  // Footer
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: FOOTER_Y, w: SLIDE_W, h: FOOTER_H,
    fill: { color: theme.dark }
  });
  slide.addText(BRAND.clinicName + '  •  ' + BRAND.year + '  •  ' + config.tagline, {
    x: 0.3, y: FOOTER_Y + 0.04, w: SLIDE_W - 0.6, h: FOOTER_H - 0.04,
    fontSize: 9, fontFace: 'Arial', color: 'FFFFFF', align: 'center', margin: 0
  });
}

// ─── Screenshot slide ──────────────────────────────────────────────────────────
function createScreenshotSlide(pres, config, item, idx) {
  const theme = config.theme;
  const total = config.slides.length;
  const slideNum = idx + 2;
  const desc = pageDescriptions[item.img];
  const title = desc ? desc.title : item.img.replace('.png', '');
  const imgPath = path.join(SS_DIR, item.img);

  const slide = pres.addSlide();
  slide.background = { color: 'F3F4F6' };

  addHeader(slide, pres, theme, (idx + 1) + '. ' + title, slideNum, total);
  addProgressBar(slide, pres, theme, idx, total);

  if (fs.existsSync(imgPath)) {
    slide.addImage({
      x: 0.3, y: CONTENT_TOP, w: SLIDE_W - 0.6,
      h: CONTENT_BOTTOM - CONTENT_TOP,
      path: imgPath, fit: 'contain'
    });
  } else {
    slide.addText('Screenshot: ' + item.img + '\n(File tidak ditemukan)', {
      x: 0.5, y: CONTENT_TOP + 1, w: SLIDE_W - 1, h: 1,
      fontSize: 14, fontFace: 'Arial', color: '9CA3AF', align: 'center'
    });
  }

  addFooter(slide, pres, theme, slideNum, total);
}

// ─── Description slide ─────────────────────────────────────────────────────────
function createDescriptionSlide(pres, config, item, idx) {
  const theme = config.theme;
  const total = config.slides.length;
  const slideNum = idx + 3;
  const desc = pageDescriptions[item.img];
  const title = desc ? desc.title : item.img.replace('.png', '');
  const section = desc ? desc.section : '';
  const descriptions = desc ? desc.descriptions : [
    { text: 'Deskripsi tidak tersedia.', style: 'body' }
  ];

  const slide = pres.addSlide();
  slide.background = { color: 'FFFFFF' };

  addHeader(slide, pres, theme, (idx + 1) + '. ' + title, slideNum, total);
  addProgressBar(slide, pres, theme, idx + 1, total);

  // Section badge
  if (section) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.4, y: CONTENT_TOP - 0.04, w: 2.4, h: 0.36,
      fill: { color: theme.light }, rectRadius: 0.05
    });
    slide.addText(section, {
      x: 0.4, y: CONTENT_TOP - 0.04, w: 2.4, h: 0.36,
      fontSize: 9, fontFace: 'Arial', bold: true,
      color: theme.dark, align: 'center', valign: 'middle', margin: 0
    });
  }

  buildStyledText(
    slide, pres, descriptions,
    0.5, CONTENT_TOP + 0.46,
    SLIDE_W - 1, CONTENT_BOTTOM - CONTENT_TOP - 0.5,
    theme
  );

  slide.addText('Source: ' + item.img, {
    x: 0.4, y: CONTENT_BOTTOM - 0.2, w: SLIDE_W - 0.8, h: 0.18,
    fontSize: 8, fontFace: 'Consolas', color: '9CA3AF', align: 'right', margin: 0
  });

  addFooter(slide, pres, theme, slideNum, total);
}

// ─── Closing slide ─────────────────────────────────────────────────────────────
function createClosingSlide(pres, config) {
  const theme = config.theme;
  const slide = pres.addSlide();

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color: theme.primary }
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: -1.2, y: -1.2, w: 4.2, h: 4.2,
    fill: { color: theme.dark, transparency: 50 }
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: 10.3, y: 4.8, w: 4.2, h: 4.2,
    fill: { color: theme.accent, transparency: 60 }
  });

  slide.addText('~ Terima Kasih ~', {
    x: 0.5, y: 2.1, w: SLIDE_W - 1, h: 1.1,
    fontSize: 44, fontFace: 'Georgia', bold: true,
    color: 'FFFFFF', align: 'center', margin: 0
  });

  slide.addText(config.title, {
    x: 0.5, y: 3.3, w: SLIDE_W - 1, h: 0.5,
    fontSize: 17, fontFace: 'Arial', color: 'FFFFFF', align: 'center', margin: 0
  });

  const statsY = 4.15;
  slide.addShape(pres.ShapeType.rect, {
    x: 2.8, y: statsY, w: 7.7, h: 0.04,
    fill: { color: 'FFFFFF', transparency: 40 }
  });

  slide.addText(config.slides.length + ' Halaman', {
    x: 2.8, y: statsY + 0.18, w: 3.8, h: 0.55,
    fontSize: 26, fontFace: 'Arial', bold: true,
    color: 'FFFFFF', align: 'center', margin: 0
  });
  slide.addText(BRAND.clinicFull, {
    x: 6.6, y: statsY + 0.18, w: 3.8, h: 0.55,
    fontSize: 26, fontFace: 'Arial', bold: true,
    color: 'FFFFFF', align: 'center', margin: 0
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 2.8, y: statsY + 0.78, w: 7.7, h: 0.04,
    fill: { color: 'FFFFFF', transparency: 40 }
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: FOOTER_Y, w: SLIDE_W, h: FOOTER_H,
    fill: { color: theme.dark }
  });
  slide.addText(BRAND.clinicName + '  •  ' + BRAND.year + '  •  ' + config.tagline, {
    x: 0.3, y: FOOTER_Y + 0.04, w: SLIDE_W - 0.6, h: FOOTER_H - 0.04,
    fontSize: 9, fontFace: 'Arial', color: 'FFFFFF', align: 'center', margin: 0
  });
}

// ─── Main: Create one role presentation ───────────────────────────────────────
function createPresentation(roleName, config) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = config.title;
  pres.author = BRAND.clinicName;
  pres.subject = config.tagline;

  createCoverSlide(pres, config);

  config.slides.forEach((item, idx) => {
    createScreenshotSlide(pres, config, item, idx);
    createDescriptionSlide(pres, config, item, idx);
  });

  createClosingSlide(pres, config);

  const outputPath = path.join(OUTPUT_DIR, roleName + '.pptx');
  pres.writeFile({ fileName: outputPath })
    .then(() => console.log('Created: ' + outputPath))
    .catch(err => console.error('Error creating ' + roleName + ':', err));
}

// ─── Run all roles ────────────────────────────────────────────────────────────
Object.entries(roles).forEach(([name, config]) => {
  createPresentation(name, config);
});

console.log('\nAll PowerPoint guides created in: ' + OUTPUT_DIR + '/');
