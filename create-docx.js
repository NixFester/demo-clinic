const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, PageBreak, ImageRun,
  ShadingType
} = require('docx');
const fs = require('fs');
const path = require('path');

const SS_DIR = path.join(__dirname, 'ss');
const OUTPUT_DIR = path.join(__dirname, 'dokumen');

// Helper functions
function createHeading(text, level = 1) {
  const sizes = { 1: 32, 2: 28, 3: 24, 4: 20 };
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: sizes[level] * 2, color: '374151' })],
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: 400, after: 200 }
  });
}

function createParagraph(text, bold = false) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, color: '374151', bold })],
    spacing: { before: 100, after: 100 }
  });
}

function createBullet(text, indent = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, color: '374151' })],
    numbering: { reference: 'bullet-list', level: indent },
    spacing: { before: 50, after: 50 }
  });
}

function createImage(filename, width = 5) {
  const imgPath = path.join(SS_DIR, filename);
  if (!fs.existsSync(imgPath)) return null;
  try {
    const image = fs.readFileSync(imgPath);
    return new ImageRun({
      data: image,
      transformation: { width, height: width * 0.6 },
      type: 'png'
    });
  } catch (e) {
    return null;
  }
}

function createImageParagraph(img) {
  if (!img) return null;
  return new Paragraph({
    children: [img],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 }
  });
}

function createTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 22, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
    shading: { fill: '028090', type: ShadingType.CLEAR },
    width: { size: 25, type: WidthType.PERCENTAGE }
  }));

  const bodyRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 22, color: '374151' })] })],
      width: { size: 25, type: WidthType.PERCENTAGE }
    }))
  }));

  return new Table({
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

function createPageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ===== DOKTER GUIDE =====
function createDokterGuide() {
  const sections = [
    { heading: '1. Login', bullets: [
      'Buka halaman login sistem SIMKlinik',
      'Masukkan email/username dan password',
      'Klik tombol "Masuk"',
      'Pilih role "Dokter" saat login'
    ], img: 'login.png' },

    { heading: '2. Dashboard Dokter', bullets: [
      'Melihat statistik antrian hari ini',
      'Melihat jumlah pasien sudah dilayani',
      'Melihat jadwal praktik hari ini',
      'Mendapat notifikasi pasien baru'
    ], img: 'dokter-dashboard.png' },

    { heading: '3. Antrian Saya', bullets: [
      'Melihat daftar pasien yang menunggu',
      'Kolom yang ditampilkan: No. Antrian, Nama, Keluhan, Status',
      'Klik tombol "Isi RME" untuk membuat rekam medis',
      'Klik "Panggil" untuk memanggil pasien',
      'Halaman auto-refresh setiap 30 detik'
    ], img: 'dokter-antrian.png' },

    { heading: '4. RME - Riwayat Pasien', bullets: [
      'Melihat rekam medis elektronik pasien sebelumnya',
      'Melihat daftar RME yang sudah dibuat',
      'Melihat tanggal, jam, diagnosis, dan tindakan',
      'Berguna untuk memahami riwayat treatment pasien'
    ], img: 'dokter-rme-sebelumnya.png' },

    { heading: '5. RME - Formulir SOAP', bullets: [
      'Formulir utama untuk mengisi Rekam Medis Elektronik',
      'S - Subjective: Keluhan utama pasien dan riwayat penyakit',
      'O - Objective: Tekanan darah, suhu tubuh, berat & tinggi badan',
      'A - Assessment: Diagnosis dokter',
      'P - Plan: Rencana treatment selanjutnya'
    ], img: 'dokter-rme-pengisian-soap-form.png' },

    { heading: '6. RME - Pilih Layanan', bullets: [
      'Memilih layanan atau tindakan medis',
      'Jenis layanan: Pemeriksaan Umum, Tindakan Medis, Konsultasi',
      'Pilih dokter yang menangani',
      'Bisa tambahkan multiple layanan',
      'Harga layanan muncul otomatis'
    ], img: 'dokter-pengisian-form-layanan.png' },

    { heading: '7. RME - Resep Obat', bullets: [
      'Membuat resep obat untuk pasien',
      'Search obat berdasarkan nama',
      'Lihat stok obat yang tersedia',
      'Input jumlah dan aturan pakai',
      'Warning jika stok hampir habis',
      'Resep bisa dicetak atau kirim ke kasir'
    ], img: 'dokter-form-resep-obat.png' }
  ];

  const doc = new Document({
    numbering: { config: [{ reference: 'bullet-list', levels: [{ level: 0, format: 'bullet', text: '•' }, { level: 1, format: 'bullet', text: '○' }] }] },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: 'PANDUAN PENGGUNA SISTEM', bold: true, size: 56, color: '028090' })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'DOKTER', bold: true, size: 72, color: '059669' })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: 'SIMKlinik Elrhea Clinic', size: 32, color: '6B7280' })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 400 } }),
        createPageBreak(),
        createHeading('Daftar Isi', 1),
        ...sections.map((s, i) => new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${s.heading}`, size: 24 })], spacing: { before: 100, after: 50 } })),
        createPageBreak()
      ]
    }, {
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: sections.flatMap((s, idx) => {
        const content = [
          createHeading(s.heading, 2),
          ...s.bullets.map(b => createBullet(b)),
          createParagraph('')
        ];
        if (s.img) {
          const img = createImage(s.img, 6);
          if (img) {
            content.push(createImageParagraph(img));
          }
        }
        content.push(createPageBreak());
        return content;
      })
    }]
  });

  return doc;
}

// ===== KASIR GUIDE =====
function createKasirGuide() {
  const sections = [
    { heading: '1. Login', bullets: [
      'Buka halaman login sistem SIMKlinik',
      'Masukkan email/username dan password',
      'Klik tombol "Masuk"',
      'Pilih role "Kasir" saat login'
    ], img: 'login.png' },

    { heading: '2. Daftar Invoice', bullets: [
      'Melihat semua invoice pembayaran',
      'Kolom: No. Invoice, Nama Pasien, Tanggal, Total, Status',
      'Filter: Semua, Belum Lunas, Lunas',
      'Klik baris untuk lihat detail'
    ], img: 'kasir-list-invoice.png' },

    { heading: '3. Detail Invoice', bullets: [
      'Melihat rincian tagihan pasien',
      'Data pasien: Nama, No. Rekam Medis',
      'Daftar layanan dan harga',
      'Daftar produk/obat',
      'Subtotal, Diskon, Total akhir'
    ], img: 'kasir-invoice-detail.png' },

    { heading: '4. Struk Pembayaran', bullets: [
      'Preview struk sebelum cetak',
      'Format thermal printer',
      'Header: Logo, nama, alamat klinik',
      'Isi: No. Invoice, tanggal, item, total',
      'Footer: Pesan terima kasih'
    ], img: 'kasir-struk-invoice.png' },

    { heading: '5. Proses Pembayaran', bullets: [
      'Pilih metode bayar: Tunai, Transfer, QRIS',
      'Input jumlah bayar',
      'Sistem auto-hitung kembalian',
      'Klik "Bayar" untuk konfirmasi',
      'Invoice berubah jadi Lunas',
      'Struk cetak otomatis',
      'Jika printer offline, bisa save PDF'
    ], img: 'kasir-print-pembayaran.png' }
  ];

  const doc = new Document({
    numbering: { config: [{ reference: 'bullet-list', levels: [{ level: 0, format: 'bullet', text: '•' }] }] },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: 'PANDUAN PENGGUNA SISTEM', bold: true, size: 56, color: '028090' })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'KASIR', bold: true, size: 72, color: 'D97706' })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: 'SIMKlinik Elrhea Clinic', size: 32, color: '6B7280' })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 400 } }),
        createPageBreak(),
        createHeading('Daftar Isi', 1),
        ...sections.map((s, i) => new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${s.heading}`, size: 24 })], spacing: { before: 100, after: 50 } })),
        createPageBreak()
      ]
    }, {
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: sections.flatMap((s, idx) => {
        const content = [
          createHeading(s.heading, 2),
          ...s.bullets.map(b => createBullet(b)),
          createParagraph('')
        ];
        if (s.img) {
          const img = createImage(s.img, 6);
          if (img) {
            content.push(createImageParagraph(img));
          }
        }
        content.push(createPageBreak());
        return content;
      })
    }]
  });

  return doc;
}

// ===== KARYAWAN GUIDE =====
function createKaryawanGuide() {
  const sections = [
    { heading: '1. Login', bullets: [
      'Buka halaman login sistem SIMKlinik',
      'Masukkan email/username dan password',
      'Klik tombol "Masuk"',
      'Pilih role "Karyawan" saat login'
    ], img: 'login.png' },

    { heading: '2. Dashboard Karyawan', bullets: [
      'Melihat statistik: Total pasien, Antrian aktif, Belum bayar, Pendapatan',
      'Menu shortcut di bagian bawah',
      'Akses cepat ke Pendaftaran dan Kasir',
      'Sidebar kiri untuk navigasi lengkap'
    ], img: 'karyawan-dashboard.png' },

    { heading: '3. Antrian - Kosong', bullets: [
      'Tampilan saat belum ada pasien',
      'Pesan "Belum ada antrian"',
      'Tombol Refresh untuk update manual',
      'Auto-refresh setiap 30 detik'
    ], img: 'karyawan-antrian-tanpa-pasien.png' },

    { heading: '4. Antrian - Dengan Pasien', bullets: [
      'Daftar pasien yang mengantri',
      'Kolom: No. Antrian, Nama, Dokter, Keluhan, Status',
      'Aksi: Panggil, Detail, Update Status',
      'Status: Menunggu, Dipanggil, Selesai'
    ], img: 'karyawan-antrian-dengan-pasien.png' },

    { heading: '5. Siapkan Obat', bullets: [
      'Persiapan obat setelah dokter memeriksa',
      'Cek resep dari dokter',
      'Siapkan obat dari rak',
      'Checklist item yang siap',
      'Klik Selesai setelah siap',
      'Pasien siap ke kasir'
    ], img: 'karyawan-antrian-siapkan-obat.png' },

    { heading: '6. Pendaftaran Pasien Baru', bullets: [
      'Form untuk daftarkan pasien baru',
      'Data diri: Nama, Tanggal lahir, Jenis kelamin, Alamat',
      'Kontak: No. HP / WhatsApp',
      'Kunjungan: Keluhan awal',
      'Setelah submit, pasien masuk antrian'
    ], img: 'karyawan-pendaftaran.png' },

    { heading: '7. Pendaftaran - Pilih Layanan', bullets: [
      'Step 2 dari pendaftaran',
      'Pilih layanan: Pemeriksaan Umum, Tindakan, Konsultasi',
      'Pilih dokter yang tersedia',
      'Pilih tanggal dan jam',
      'Sistem generate nomor antrian'
    ], img: 'karyawan-pendaftaran-form-layanan-dokter.png' },

    { heading: '8. Kasir', bullets: [
      'Proses pembayaran invoice',
      'Daftar invoice belum lunas',
      'Filter berdasarkan tanggal',
      'Metode: Tunai, Transfer, QRIS',
      'Setelah bayar, status jadi Lunas'
    ], img: 'karyawan-kasir.png' },

    { heading: '9. Katalog Produk', bullets: [
      'Melihat daftar produk farmasi',
      'Kolom: Kode, Nama, Harga, Stok, Status',
      'Search berdasarkan nama/kode',
      'Filter: Semua, Tersedia, Stok Rendah',
      'Karyawan hanya bisa melihat (read-only)'
    ], img: 'karyawan-katalog-produk.png' },

    { heading: '10. Katalog Layanan', bullets: [
      'Melihat daftar layanan klinik',
      'Kolom: Kode, Nama, Dokter, Harga, Status',
      'Search untuk cari layanan',
      'Read-only untuk karyawan'
    ], img: 'karyawan-layanan.png' },

    { heading: '11. Laporan Pembayaran', bullets: [
      'Melihat laporan pembayaran',
      'Filter: Tanggal, Status',
      'Data: Total pendapatan, Jumlah transaksi',
      'Export: PDF, Excel'
    ], img: 'karyawan-laporan-pembayaran.png' },

    { heading: '12. Laporan - Format PDF', bullets: [
      'Download laporan dalam format PDF',
      'Jenis: Harian, Bulanan, Per Dokter, Produk, Layanan',
      'Preview sebelum download',
      'Bisa kirim via WhatsApp'
    ], img: 'karyawan-laporan-pdf.png' }
  ];

  const doc = new Document({
    numbering: { config: [{ reference: 'bullet-list', levels: [{ level: 0, format: 'bullet', text: '•' }] }] },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: 'PANDUAN PENGGUNA SISTEM', bold: true, size: 56, color: '028090' })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'KARYAWAN', bold: true, size: 72, color: '2563EB' })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: 'SIMKlinik Elrhea Clinic', size: 32, color: '6B7280' })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 400 } }),
        createPageBreak(),
        createHeading('Daftar Isi', 1),
        ...sections.map((s, i) => new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${s.heading}`, size: 24 })], spacing: { before: 100, after: 50 } })),
        createPageBreak()
      ]
    }, {
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: sections.flatMap((s) => {
        const content = [
          createHeading(s.heading, 2),
          ...s.bullets.map(b => createBullet(b)),
          createParagraph('')
        ];
        if (s.img) {
          const img = createImage(s.img, 6);
          if (img) {
            content.push(createImageParagraph(img));
          }
        }
        content.push(createPageBreak());
        return content;
      })
    }]
  });

  return doc;
}

// ===== ADMIN GUIDE =====
function createAdminGuide() {
  const sections = [
    { heading: '1. Login', bullets: [
      'Buka halaman login sistem SIMKlinik',
      'Masukkan email/username dan password',
      'Klik tombol "Masuk"',
      'Pilih role "Admin" atau "Superadmin"'
    ], img: 'login.png' },

    { heading: '2. Dashboard Admin', bullets: [
      'Statistik lengkap klinik',
      'Total pasien, Pendapatan bulan ini',
      'Antrian aktif, Pasien belum bayar',
      'Total dokter aktif',
      'Akses penuh ke semua fitur'
    ], img: 'admin-dashboard.png' },

    { heading: '3. Menu Laporan', bullets: [
      'Akses ke semua laporan klinik',
      'Jenis laporan: Harian, Bulanan, Per Dokter, Produk, Layanan',
      'Filter berdasarkan tanggal',
      'Export ke PDF atau Excel'
    ], img: 'admin-laporan.png' },

    { heading: '4. Contoh Laporan', bullets: [
      'Preview laporan sebelum download',
      'Header: Logo, nama, alamat klinik',
      'Isi: Tabel dengan data',
      'Footer: Subtotal, Total, Tanda tangan'
    ], img: 'admin-contoh-laporan.png' },

    { heading: '5. Manajemen Dokter', bullets: [
      'CRUD data dokter',
      'Field: Nama, No. SIP, No. HP, Email',
      'Spesialisasi dokter',
      'Jadwal praktik',
      'Aksi: Tambah, Edit, Toggle Aktif'
    ], img: 'admin-dokter.png' },

    { heading: '6. Manajemen Spesialisasi', bullets: [
      'CRUD spesialisasi dokter',
      'Field: Kode, Nama, Deskripsi',
      'Aksi: Tambah, Edit, Hapus',
      'Catatan: Lepas dari dokter dulu sebelum hapus'
    ], img: 'admin-spesialisasi.png' },

    { heading: '7. Manajemen Layanan', bullets: [
      'CRUD layanan klinik',
      'Field: Kode, Nama, Harga, Dokter, Status',
      'Aksi: Tambah, Edit, Hapus, Toggle',
      'Layanan muncul saat pendaftaran'
    ], img: 'admin-layanan.png' },

    { heading: '8. Manajemen Produk', bullets: [
      'CRUD produk farmasi',
      'Field: Kode, Nama, Harga, Stok, Supplier',
      'Stok minimum untuk alert',
      'Aksi: Tambah, Edit, Update Stok, Hapus',
      'Warning jika stok di bawah minimum'
    ], img: 'admin-produk.png' }
  ];

  const doc = new Document({
    numbering: { config: [{ reference: 'bullet-list', levels: [{ level: 0, format: 'bullet', text: '•' }] }] },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: 'PANDUAN PENGGUNA SISTEM', bold: true, size: 56, color: '028090' })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'ADMIN', bold: true, size: 72, color: '7C3AED' })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: 'SIMKlinik Elrhea Clinic', size: 32, color: '6B7280' })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 400 } }),
        createPageBreak(),
        createHeading('Daftar Isi', 1),
        ...sections.map((s, i) => new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${s.heading}`, size: 24 })], spacing: { before: 100, after: 50 } })),
        createPageBreak()
      ]
    }, {
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: sections.flatMap((s) => {
        const content = [
          createHeading(s.heading, 2),
          ...s.bullets.map(b => createBullet(b)),
          createParagraph('')
        ];
        if (s.img) {
          const img = createImage(s.img, 6);
          if (img) {
            content.push(createImageParagraph(img));
          }
        }
        content.push(createPageBreak());
        return content;
      })
    }]
  });

  return doc;
}

// Create all documents
async function createAllGuides() {
  console.log('Creating guides...');

  const guides = [
    { name: 'Panduan-Dokter', doc: createDokterGuide() },
    { name: 'Panduan-Kasir', doc: createKasirGuide() },
    { name: 'Panduan-Karyawan', doc: createKaryawanGuide() },
    { name: 'Panduan-Admin', doc: createAdminGuide() }
  ];

  for (const guide of guides) {
    const buffer = await Packer.toBuffer(guide.doc);
    const filePath = path.join(OUTPUT_DIR, `${guide.name}.docx`);
    fs.writeFileSync(filePath, buffer);
    console.log(`Created: ${guide.name}.docx`);
  }

  console.log('\nAll guides created in /dokumen folder!');
}

createAllGuides().catch(console.error);
