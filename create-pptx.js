const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const SS_DIR = path.join(__dirname, 'ss');
const OUTPUT_DIR = path.join(__dirname, 'dokumen');

// Color palette
const COLORS = {
  dark: '1F2937',
  light: 'F9FAFB',
  white: 'FFFFFF',
  text: '374151',
};

// All screenshots with DETAILED descriptions - KEYS MUST MATCH FILENAMES EXACTLY
const pageDescriptions = {
  'login.png': {
    title: 'Halaman Login',
    descriptions: [
      'Ini adalah halaman login sistem SIMKlinik.',
      '',
      'Untuk masuk ke sistem:',
      '1. Masukkan email atau username',
      '2. Masukkan password',
      '3. Klik tombol "Masuk"',
      '',
      'Pilih role sesuai dengan akun Anda:',
      '• Admin / Superadmin - Akses penuh ke semua fitur',
      '• Dokter - Akses halaman dokter',
      '• Kasir - Akses halaman kasir',
      '• Karyawan - Akses halaman karyawan',
      '',
      'Hubungi admin jika lupa password.'
    ]
  },
  'dokter-dashboard.png': {
    title: 'Dashboard Dokter',
    descriptions: [
      'Ini adalah halaman utama setelah dokter berhasil login.',
      '',
      'Di halaman ini dokter bisa melihat:',
      '• Statistik antrian hari ini',
      '• Jumlah pasien yang sudah dilayani',
      '• Jadwal praktik hari ini',
      '• Notifikasi pasien baru',
      '',
      'Menu navigasi berada di sidebar kiri.',
      'Klik nama di header untuk logout.',
      '',
      'Fitur utama dokter:',
      '• Antrian Saya - Daftar pasien menunggu',
      '• Jadwal Saya - Lihat jadwal praktik',
      '• RME - Rekam Medis Elektronik'
    ]
  },
  'dokter-antrian.png': {
    title: 'Antrian Saya',
    descriptions: [
      'Halaman ini menampilkan daftar pasien yang mengantri.',
      '',
      'Kolom yang ditampilkan:',
      '• No. Antrian',
      '• Nama Pasien',
      '• Keluhan Awal',
      '• Status (Menunggu/Dipanggil/Selesai)',
      '',
      'Aksi yang bisa dilakukan:',
      '• Klik "Isi RME" untuk membuat rekam medis',
      '• Klik "Panggil" untuk memanggil pasien',
      '',
      'Halaman auto-refresh setiap 30 detik.',
      'Pasien akan muncul otomatis setelah',
      'mendaftar di loket karyawan.'
    ]
  },
  'dokter-rme-sebelumnya.png': {
    title: 'RME - Riwayat Pasien',
    descriptions: [
      'Halaman untuk melihat rekam medis pasien sebelumnya.',
      '',
      'Tampilan yang tersedia:',
      '• Daftar RME yang sudah dibuat',
      '• Tanggal dan jam kunjungan',
      '• Diagnosis dan tindakan yang dilakukan',
      '• Resep obat yang diberikan',
      '',
      'Berguna untuk:',
      '• Melihat riwayat treatment pasien',
      '• Mengetahui obat yang pernah diresepkan',
      '• Memahami kondisi kesehatan pasien',
      '',
      'Klik salah satu item untuk lihat detail.'
    ]
  },
  'dokter-rme-pengisian-soap-form.png': {
    title: 'RME - Formulir SOAP',
    descriptions: [
      'Formulir utama untuk mengisi Rekam Medis Elektronik.',
      '',
      'SOAP adalah singkatan dari:',
      '',
      'S - Subjective (Subjektif):',
      '• Keluhan utama pasien',
      '• Riwayat penyakit',
      '',
      'O - Objective (Obyektif):',
      '• Tekanan darah',
      '• Suhu tubuh',
      '• Berat & tinggi badan',
      '',
      'A - Assessment (Asesmen):',
      '• Diagnosis dokter',
      '',
      'P - Plan (Rencana):',
      '• Rencana treatment selanjutnya'
    ]
  },
  'dokter-pengisian-form-layanan.png': {
    title: 'RME - Pilih Layanan',
    descriptions: [
      'Halaman untuk memilih layanan atau tindakan medis.',
      '',
      'Jenis layanan yang tersedia:',
      '• Pemeriksaan Umum',
      '• Tindakan Medis',
      '• Konsultasi Spesialis',
      '',
      'Langkah-langkah:',
      '1. Pilih jenis layanan dari dropdown',
      '2. Pilih dokter yang menangani',
      '3. Klik "Tambah" untuk menambah layanan',
      '',
      'Harga layanan akan muncul otomatis.',
      'Total biaya akan dihitung di halaman kasir.',
      '',
      'Dokter bisa menambahkan multiple layanan.'
    ]
  },
  'dokter-form-resep-obat.png': {
    title: 'RME - Resep Obat',
    descriptions: [
      'Halaman untuk membuat resep obat pasien.',
      '',
      'Fitur yang tersedia:',
      '• Search obat berdasarkan nama',
      '• Lihat stok obat yang tersedia',
      '• Input jumlah obat yang diberikan',
      '• Aturan pakai (misal: 3x1 sehari)',
      '',
      'Fitur penting:',
      '• Warning jika stok hampir habis',
      '• Info kadaluarsa obat',
      '',
      'Setelah resep selesai:',
      '• Resep bisa dicetak',
      '• Atau langsung kirim ke kasir',
      '• Pasien bayar di kasir lalu ambil obat'
    ]
  },
  'kasir-list-invoice.png': {
    title: 'Daftar Invoice',
    descriptions: [
      'Halaman untuk melihat semua invoice pembayaran.',
      '',
      'Kolom yang ditampilkan:',
      '• No. Invoice',
      '• Nama Pasien',
      '• Tanggal',
      '• Total Tagihan',
      '• Status (Lunas / Belum Lunas)',
      '',
      'Filter yang tersedia:',
      '• Semua Invoice',
      '• Belum Lunas Saja',
      '• Lunas Saja',
      '',
      'Klik baris untuk lihat detail invoice.',
      'Invoice baru muncul setelah dokter',
      'menyelesaikan pemeriksaan.'
    ]
  },
  'kasir-invoice-detail.png': {
    title: 'Detail Invoice',
    descriptions: [
      'Halaman untuk melihat rincian invoice pasien.',
      '',
      'Komponen detail invoice:',
      '',
      'Data Pasien:',
      '• Nama lengkap',
      '• No. Rekam Medis',
      '',
      'Daftar Layanan:',
      '• Nama layanan',
      '• Nama dokter',
      '• Harga per layanan',
      '',
      'Daftar Produk/Obat:',
      '• Nama produk',
      '• Jumlah',
      '• Harga',
      '',
      'Ringkasan:',
      '• Subtotal',
      '• Diskon (jika ada)',
      '• Total yang harus dibayar'
    ]
  },
  'kasir-struk-invoice.png': {
    title: 'Struk Pembayaran',
    descriptions: [
      'Preview struk pembayaran sebelum dicetak.',
      '',
      'Format struk thermal printer:',
      '',
      'Header:',
      '• Logo klinik',
      '• Nama klinik lengkap',
      '• Alamat & no. telepon',
      '',
      'Isi Struk:',
      '• No. Invoice',
      '• Tanggal & waktu',
      '• Daftar item (layanan & produk)',
      '• Subtotal per kategori',
      '• Total akhir',
      '• Metode pembayaran',
      '',
      'Footer:',
      '• Pesan terima kasih',
      '• QR code (opsional)'
    ]
  },
  'kasir-print-pembayaran.png': {
    title: 'Cetak Struk',
    descriptions: [
      'Halaman untuk memproses pembayaran dan cetak struk.',
      '',
      'Langkah-langkah pembayaran:',
      '',
      '1. Pilih Metode Bayar:',
      '   • Tunai',
      '   • Transfer Bank',
      '   • QRIS',
      '',
      '2. Input Jumlah Bayar:',
      '   • Masukkan nominal yang diterima',
      '   • Sistem auto-hitung kembalian',
      '',
      '3. Klik "Bayar":',
      '   • Invoice berubah jadi Lunas',
      '   • Struk akan cetak otomatis',
      '',
      '4. Jika printer offline:',
      '   • Bisa save sebagai PDF'
    ]
  },
  'karyawan-dashboard.png': {
    title: 'Dashboard Karyawan',
    descriptions: [
      'Halaman utama setelah karyawan login.',
      '',
      'Statistik yang ditampilkan:',
      '• Total pasien hari ini',
      '• Jumlah antrian aktif',
      '• Pasien belum bayar',
      '• Total pendapatan hari ini',
      '',
      'Menu shortcut di bagian bawah:',
      '• Pendaftaran - Daftarkan pasien baru',
      '• Kasir - Proses pembayaran',
      '',
      'Akses cepat ke fitur utama.',
      'Sidebar kiri untuk navigasi lengkap.'
    ]
  },
  'karyawan-antrian-tanpa-pasien.png': {
    title: 'Antrian - Kosong',
    descriptions: [
      'Tampilan saat belum ada pasien dalam antrian.',
      '',
      'Status screen:',
      '• Pesan "Belum ada antrian"',
      '• Tombol "Refresh" untuk update manual',
      '',
      'Auto-refresh aktif setiap 30 detik.',
      'Antrian akan terisi setelah ada',
      'pendaftaran pasien baru.',
      '',
      'Karyawan tidak perlu refresh manual,',
      'sistem会自动更新 antrian.'
    ]
  },
  'karyawan-antrian-dengan-pasien.png': {
    title: 'Antrian - Dengan Pasien',
    descriptions: [
      'Tampilan antrian yang sudah ada pasiennya.',
      '',
      'Kolom tabel:',
      '• No. Antrian',
      '• Nama Pasien',
      '• Dokter Tujuan',
      '• Keluhan Awal',
      '• Status',
      '',
      'Aksi per baris:',
      '• Panggil - Panggil pasien untuk diperiksa',
      '• Detail - Lihat detail pasien',
      '• Update - Ubah status antrian',
      '',
      'Status:',
      '• Menunggu - Pasien belum dipanggil',
      '• Dipanggil - Sedang diperiksa dokter',
      '• Selesai - Selesai pemeriksaan'
    ]
  },
  'karyawan-antrian-siapkan-obat.png': {
    title: 'Antrian - Siapkan Obat',
    descriptions: [
      'Halaman untuk preparing obat setelah dokter memeriksa.',
      '',
      'Workflow persiapan obat:',
      '',
      '1. Dokter sudah mengisi:',
      '   • Form SOAP',
      '   • Resep obat',
      '',
      '2. Karyawan prepare obat:',
      '   • Cek resep dari dokter',
      '   • Siapkan obat dari rak',
      '   • Checklist item yang siap',
      '',
      '3. Klik "Selesai":',
      '   • Pasien mendapat notifikasi',
      '   • Pasien siap ke kasir',
      '',
      'Pastikan obat sudah benar sebelum',
      'konfirmasi selesai.'
    ]
  },
  'karyawan-pendaftaran.png': {
    title: 'Pendaftaran Pasien',
    descriptions: [
      'Form untuk mendaftarkan pasien baru.',
      '',
      'Field yang harus diisi:',
      '',
      'Data Diri:',
      '• Nama lengkap',
      '• Tanggal lahir',
      '• Jenis kelamin',
      '• Alamat lengkap',
      '',
      'Kontak:',
      '• No. HP / WhatsApp',
      '',
      'Kunjungan:',
      '• Keluhan awal / alasan datang',
      '',
      'Setelah submit:',
      '• Pasien masuk antrian',
      '• Dapat nomor antrian',
      '• Pasien menunggu dipanggil'
    ]
  },
  'karyawan-pendaftaran-form-layanan-dokter.png': {
    title: 'Pendaftaran - Pilih Layanan',
    descriptions: [
      'Step 2 dari pendaftaran pasien.',
      '',
      'Opsi yang harus dipilih:',
      '',
      '1. Pilih Layanan:',
      '   • Pemeriksaan Umum',
      '   • Tindakan Khusus',
      '   • Konsultasi',
      '',
      '2. Pilih Dokter:',
      '   • Pilih dari daftar dokter aktif',
      '',
      '3. Pilih Jadwal:',
      '   • Tanggal praktik',
      '   • Jam yang tersedia',
      '',
      'Setelah dipilih:',
      '• Sistem generate nomor antrian',
      '• Pasien siap dilayani'
    ]
  },
  'karyawan-kasir.png': {
    title: 'Kasir',
    descriptions: [
      'Halaman untuk proses pembayaran.',
      '',
      'Fitur utama:',
      '• Daftar invoice belum lunas',
      '• Filter berdasarkan tanggal',
      '• Detail layanan & produk',
      '',
      'Metode pembayaran:',
      '• Tunai',
      '• Transfer bank',
      '• QRIS',
      '',
      'Proses:',
      '1. Pilih invoice',
      '2. Input pembayaran',
      '3. Konfirmasi',
      '',
      'Setelah bayar:',
      '• Invoice status = Lunas',
      '• Struk bisa dicetak'
    ]
  },
  'karyawan-katalog-produk.png': {
    title: 'Katalog Produk',
    descriptions: [
      'Halaman untuk melihat daftar produk farmasi.',
      '',
      'Kolom yang ditampilkan:',
      '• Kode Produk',
      '• Nama Produk',
      '• Harga Jual (Rp)',
      '• Stok Tersedia',
      '• Status',
      '',
      'Fitur search:',
      '• Cari berdasarkan nama',
      '• Cari berdasarkan kode',
      '',
      'Filter:',
      '• Semua',
      '• Tersedia',
      '• Stok Rendah',
      '',
      'Catatan:',
      'Karyawan hanya bisa melihat,',
      'edit produk adalah hak admin.'
    ]
  },
  'karyawan-layanan.png': {
    title: 'Katalog Layanan',
    descriptions: [
      'Halaman untuk melihat daftar layanan klinik.',
      '',
      'Kolom yang ditampilkan:',
      '• Kode Layanan',
      '• Nama Layanan',
      '• Dokter Penanggung',
      '• Harga (Rp)',
      '• Status',
      '',
      'Fitur search untuk cari layanan.',
      '',
      'Catatan penting:',
      'Karyawan hanya bisa melihat (read-only).',
      'Tambah, edit, hapus layanan',
      'adalah hak admin.',
      '',
      'Layanan dibutuhkan saat',
      'pendaftaran pasien baru.'
    ]
  },
  'karyawan-laporan-pembayaran.png': {
    title: 'Laporan Pembayaran',
    descriptions: [
      'Halaman untuk melihat laporan pembayaran.',
      '',
      'Filter yang tersedia:',
      '• Tanggal (harian atau range)',
      '• Status (Semua / Lunas / Belum)',
      '',
      'Data yang ditampilkan:',
      '• Total pendapatan',
      '• Jumlah transaksi',
      '• Rincian per invoice',
      '',
      'Fitur export:',
      '• Download PDF',
      '• Download Excel',
      '',
      'Berguna untuk:',
      '• Rekap harian',
      '• Monitoring piutang',
      '• Laporan ke manajemen'
    ]
  },
  'karyawan-laporan-pdf.png': {
    title: 'Laporan - Format PDF',
    descriptions: [
      'Download laporan dalam format PDF.',
      '',
      'Jenis laporan tersedia:',
      '',
      '1. Laporan Harian:',
      '   Aktivitas satu hari tertentu',
      '',
      '2. Laporan Bulanan:',
      '   Rekap seluruh bulan',
      '',
      '3. Laporan Per Dokter:',
      '   Statistik masing-masing dokter',
      '',
      '4. Laporan Produk:',
      '   Penjualan produk farmasi',
      '',
      '5. Laporan Layanan:',
      '   Penjualan layanan klinik',
      '',
      'Aksi: Preview, Download PDF, Print,',
      'Kirim via WhatsApp.'
    ]
  },
  'admin-dashboard.png': {
    title: 'Dashboard Admin',
    descriptions: [
      'Halaman utama setelah admin login.',
      '',
      'Statistik lengkap:',
      '• Total semua pasien',
      '• Pendapatan bulan ini',
      '• Antrian aktif',
      '• Pasien belum bayar',
      '• Total dokter aktif',
      '',
      'Admin punya akses penuh ke:',
      '• Manajemen dokter',
      '• Manajemen layanan',
      '• Manajemen produk',
      '• Manajemen pengguna',
      '• Semua laporan',
      '',
      'Sidebar kiri untuk navigasi lengkap.'
    ]
  },
  'admin-laporan.png': {
    title: 'Menu Laporan',
    descriptions: [
      'Halaman utama untuk semua laporan klinik.',
      '',
      'Jenis laporan yang tersedia:',
      '',
      '1. HARIAN:',
      '   Aktivitas per hari tertentu',
      '',
      '2. BULANAN:',
      '   Rekap seluruh bulan',
      '',
      '3. PER DOKTER:',
      '   Statistik masing-masing dokter',
      '',
      '4. PRODUK:',
      '   Laporan penjualan produk',
      '',
      '5. LAYANAN:',
      '   Laporan penjualan layanan',
      '',
      'Filter: Pilih tanggal, export PDF/Excel.'
    ]
  },
  'admin-contoh-laporan.png': {
    title: 'Contoh Laporan',
    descriptions: [
      'Preview tampilan laporan sebelum didownload.',
      '',
      'Komponen laporan:',
      '',
      'Header:',
      '• Logo klinik',
      '• Nama dan alamat klinik',
      '• Judul laporan',
      '• Perioda laporan',
      '',
      'Isi:',
      '• Tabel dengan data',
      '• Tanggal, nama pasien, layanan',
      '• Jumlah item dan harga',
      '',
      'Footer:',
      '• Subtotal',
      '• Total keseluruhan',
      '• Tanda tangan (opsional)',
      '',
      'Bisa diedit sebelum export.'
    ]
  },
  'admin-dokter.png': {
    title: 'Manajemen Dokter',
    descriptions: [
      'Halaman CRUD data dokter.',
      '',
      'Field data dokter:',
      '',
      'Data Pribadi:',
      '• Nama lengkap',
      '• No. SIP (Surat Izin Praktik)',
      '• No. HP',
      '• Email',
      '',
      'Spesialisasi:',
      '• Pilih spesialisasi',
      '',
      'Jadwal:',
      '• Atur jam praktik',
      '• Hari kerja',
      '',
      'Aksi:',
      '• Tambah dokter baru',
      '• Edit data dokter',
      '• Toggle aktif/nonaktif',
      '• Atur jadwal praktik'
    ]
  },
  'admin-spesialisasi.png': {
    title: 'Manajemen Spesialisasi',
    descriptions: [
      'Halaman untuk mengelola spesialisasi dokter.',
      '',
      'Field spesialisasi:',
      '• Kode spesialisasi',
      '• Nama spesialisasi',
      '• Deskripsi (opsional)',
      '',
      'Aksi yang tersedia:',
      '• Tambah spesialisasi baru',
      '• Edit nama spesialisasi',
      '• Hapus spesialisasi',
      '',
      'Catatan penting:',
      'Spesialisasi harus dilepas dari',
      'semua dokter terlebih dahulu',
      'sebelum bisa dihapus.',
      '',
      'Contoh: Umum, Anak, Kandungan, dll.'
    ]
  },
  'admin-layanan.png': {
    title: 'Manajemen Layanan',
    descriptions: [
      'Halaman CRUD layanan klinik.',
      '',
      'Field layanan:',
      '',
      'Data Layanan:',
      '• Kode layanan',
      '• Nama layanan',
      '• Harga (Rp)',
      '• Dokter penanggung jawab',
      '• Status: Aktif / Nonaktif',
      '',
      'Aksi yang tersedia:',
      '• Tambah layanan baru',
      '• Edit data layanan',
      '• Hapus layanan',
      '• Toggle aktif/nonaktif',
      '',
      'Layanan muncul saat',
      'karyawan mendaftarkan pasien.'
    ]
  },
  'admin-produk.png': {
    title: 'Manajemen Produk',
    descriptions: [
      'Halaman CRUD produk farmasi.',
      '',
      'Field produk:',
      '',
      'Data Produk:',
      '• Kode produk',
      '• Nama produk',
      '• Harga jual (Rp)',
      '• Stok saat ini',
      '• Stok minimum (alert)',
      '',
      'Supplier:',
      '• Nama supplier',
      '• No. supplier',
      '',
      'Aksi:',
      '• Tambah produk baru',
      '• Edit data produk',
      '• Update stok',
      '• Hapus produk',
      '',
      'Warning muncul jika stok',
      'di bawah stok minimum.'
    ]
  }
};

// Slides config for each role
const roles = {
  dokter: {
    title: 'Panduan Pengguna - Dokter',
    subtitle: 'SIMKlinik Elrhea Clinic',
    color: '059669',
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
    title: 'Panduan Pengguna - Kasir',
    subtitle: 'SIMKlinik Elrhea Clinic',
    color: 'D97706',
    slides: [
      { img: 'login.png' },
      { img: 'kasir-list-invoice.png' },
      { img: 'kasir-invoice-detail.png' },
      { img: 'kasir-struk-invoice.png' },
      { img: 'kasir-print-pembayaran.png' },
    ]
  },
  karyawan: {
    title: 'Panduan Pengguna - Karyawan',
    subtitle: 'SIMKlinik Elrhea Clinic',
    color: '2563EB',
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
    title: 'Panduan Pengguna - Admin',
    subtitle: 'SIMKlinik Elrhea Clinic',
    color: '7C3AED',
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

function createPresentation(roleName, config) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = config.title;
  pres.author = 'SIMKlinik';

  // ===== SLIDE 1: Title =====
  let slide1 = pres.addSlide();
  slide1.background = { color: config.color };

  slide1.addText(config.title, {
    x: 0.5, y: 2.2, w: 12.3, h: 1.2,
    fontSize: 44, fontFace: 'Arial',
    color: COLORS.white, bold: true, align: 'center'
  });

  slide1.addText(config.subtitle, {
    x: 0.5, y: 3.5, w: 12.3, h: 0.6,
    fontSize: 20, fontFace: 'Arial',
    color: COLORS.white, align: 'center'
  });

  slide1.addText('Daftar Isi', {
    x: 0.5, y: 4.4, w: 12.3, h: 0.4,
    fontSize: 14, fontFace: 'Arial',
    color: COLORS.white, align: 'center', italic: true
  });

  // Table of contents
  const tocItems = config.slides.map((s, i) => {
    const desc = pageDescriptions[s.img] || { title: s.img.replace('.png', '') };
    return `${i + 1}. ${desc.title}`;
  });

  const halfLen = Math.ceil(tocItems.length / 2);
  const tocCol1 = tocItems.slice(0, halfLen);
  const tocCol2 = tocItems.slice(halfLen);

  slide1.addText(tocCol1.join('\n'), {
    x: 3.5, y: 4.9, w: 3.2, h: 2.3,
    fontSize: 11, fontFace: 'Arial',
    color: COLORS.white, align: 'left'
  });

  slide1.addText(tocCol2.join('\n'), {
    x: 6.8, y: 4.9, w: 3.2, h: 2.3,
    fontSize: 11, fontFace: 'Arial',
    color: COLORS.white, align: 'left'
  });

  // ===== CONTENT SLIDES =====
  config.slides.forEach((item, idx) => {
    const imgKey = item.img;
    const desc = pageDescriptions[imgKey];

    // Debug: check if description exists
    if (!desc) {
      console.log(`WARNING: No description found for "${imgKey}"`);
    }

    const title = desc ? desc.title : imgKey.replace('.png', '');
    const descLines = desc ? desc.descriptions : ['Deskripsi tidak tersedia untuk halaman ini.'];

    const imgPath = path.join(SS_DIR, item.img);

    // SLIDE: Screenshot
    let slideImg = pres.addSlide();
    slideImg.background = { color: COLORS.dark };

    slideImg.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.3, h: 0.6,
      fill: { color: config.color }
    });

    slideImg.addText(`${idx + 1}. ${title}`, {
      x: 0.3, y: 0.1, w: 10, h: 0.4,
      fontSize: 18, fontFace: 'Arial',
      color: COLORS.white, bold: true, margin: 0
    });

    slideImg.addText(`${idx + 1} / ${config.slides.length}`, {
      x: 12.5, y: 0.15, w: 0.6, h: 0.3,
      fontSize: 12, fontFace: 'Arial',
      color: COLORS.white, align: 'right', margin: 0
    });

    if (fs.existsSync(imgPath)) {
      slideImg.addImage({
        x: 0.3, y: 0.8, w: 12.7, h: 6.5,
        path: imgPath,
        fit: 'contain'
      });
    } else {
      slideImg.addText('Screenshot: ' + item.img + '\n(File tidak ditemukan)', {
        x: 0.5, y: 3.0, w: 12.3, h: 1.5,
        fontSize: 16, fontFace: 'Arial',
        color: COLORS.white, align: 'center'
      });
    }

    // SLIDE: Description
    let slideDesc = pres.addSlide();
    slideDesc.background = { color: COLORS.white };

    slideDesc.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.3, h: 0.8,
      fill: { color: config.color }
    });

    slideDesc.addText(`${idx + 1}. ${title}`, {
      x: 0.5, y: 0.15, w: 10, h: 0.5,
      fontSize: 24, fontFace: 'Arial',
      color: COLORS.white, bold: true, margin: 0
    });

    // Layout based on content length
    if (descLines.length <= 8) {
      slideDesc.addText(descLines.join('\n'), {
        x: 1.5, y: 1.1, w: 10.3, h: 5.8,
        fontSize: 15, fontFace: 'Arial',
        color: COLORS.text, valign: 'top'
      });
    } else if (descLines.length <= 15) {
      slideDesc.addText(descLines.join('\n'), {
        x: 0.8, y: 1.1, w: 11.7, h: 5.8,
        fontSize: 14, fontFace: 'Arial',
        color: COLORS.text, valign: 'top'
      });
    } else {
      const half = Math.ceil(descLines.length / 2);
      const col1 = descLines.slice(0, half);
      const col2 = descLines.slice(half);

      slideDesc.addText(col1.join('\n'), {
        x: 0.5, y: 1.0, w: 6.1, h: 5.8,
        fontSize: 13, fontFace: 'Arial',
        color: COLORS.text, valign: 'top'
      });

      slideDesc.addText(col2.join('\n'), {
        x: 6.8, y: 1.0, w: 6.1, h: 5.8,
        fontSize: 13, fontFace: 'Arial',
        color: COLORS.text, valign: 'top'
      });
    }

    slideDesc.addText('Source: ' + item.img, {
      x: 0.5, y: 7.0, w: 12.3, h: 0.3,
      fontSize: 9, fontFace: 'Consolas',
      color: COLORS.text, align: 'right', margin: 0
    });
  });

  // ===== LAST SLIDE: End =====
  let endSlide = pres.addSlide();
  endSlide.background = { color: config.color };

  endSlide.addText('~ Akhir Panduan ~', {
    x: 0.5, y: 2.8, w: 12.3, h: 1,
    fontSize: 40, fontFace: 'Arial',
    color: COLORS.white, bold: true, align: 'center'
  });

  endSlide.addText(config.title, {
    x: 0.5, y: 4.0, w: 12.3, h: 0.5,
    fontSize: 18, fontFace: 'Arial',
    color: COLORS.white, align: 'center'
  });

  endSlide.addText(`${config.slides.length} halaman tutorial`, {
    x: 0.5, y: 4.6, w: 12.3, h: 0.4,
    fontSize: 14, fontFace: 'Arial',
    color: COLORS.white, align: 'center'
  });

  const outputPath = path.join(OUTPUT_DIR, `${roleName}.pptx`);
  pres.writeFile({ fileName: outputPath })
    .then(() => console.log(`Created: ${OUTPUT_DIR}/${roleName}.pptx`))
    .catch(err => console.error(`Error:`, err));
}

Object.entries(roles).forEach(([name, config]) => {
  createPresentation(name, config);
});

console.log('\nAll PowerPoint guides created in /dokumen folder!');
