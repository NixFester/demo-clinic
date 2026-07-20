const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const OUTPUT_DIR = path.join(__dirname, 'dokumen');

// THEME CONFIG
const T = {
  primary: '0D9488', primaryDark: '0F766E', primaryL: '99F6E4',
  accent: '14B8A6', dark: '134E4A',
  bgWhite: 'FFFFFF', bgGray: 'F8FAFC',
  textDark: '1E293B', textMid: '475569', textLight: '94A3B8',
  admin:    { p: '7C3AED', l: 'EDE9FE', d: '4C1D95', a: '8B5CF6', n: 'Admin' },
  karyawan: { p: '2563EB', l: 'DBEAFE', d: '1E3A8A', a: '3B82F6', n: 'Karyawan' },
  dokter:   { p: '059669', l: 'D1FAE5', d: '064E3B', a: '10B981', n: 'Dokter' },
  kasir:    { p: 'D97706', l: 'FEF3C7', d: '92400E', a: 'F59E0B', n: 'Kasir' },
};

// LAYOUT
const W = 13.33, H = 7.5;
const HH = 0.75, FH = 0.35, FY = H - FH, CT = HH + 0.28, CB = FY - 0.12;

// HELPERS
function getC(role) { return T[role] || T.admin; }

function addHeader(slide, pres, role, title, step, total) {
  const c = getC(role);
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: HH, fill: { color: c.p } });
  slide.addShape(pres.ShapeType.rect, { x: 0, y: HH - 0.06, w: W, h: 0.06, fill: { color: c.a } });
  slide.addText(title, { x: 0.45, y: 0.12, w: W - 2.2, h: HH - 0.15, fontSize: 18, fontFace: 'Arial', bold: true, color: 'FFFFFF', margin: 0 });
  if (step && total) slide.addText(step + ' / ' + total, { x: W - 1.2, y: 0.18, w: 0.9, h: 0.35, fontSize: 11, fontFace: 'Arial', color: 'FFFFFF', align: 'right', margin: 0 });
  slide.addShape(pres.ShapeType.roundRect, { x: 0.3, y: HH + 0.1, w: 1.5, h: 0.3, fill: { color: c.l }, rectRadius: 0.05 });
  slide.addText(c.n, { x: 0.3, y: HH + 0.1, w: 1.5, h: 0.3, fontSize: 10, fontFace: 'Arial', bold: true, color: c.d, align: 'center', valign: 'middle', margin: 0 });
}

function addFooter(slide, pres, role, step, total) {
  const c = getC(role);
  slide.addShape(pres.ShapeType.rect, { x: 0, y: FY, w: W, h: FH, fill: { color: c.p } });
  slide.addText('SIMKlinik  |  Alur Kerja Klinik  |  Elrhea Clinic', { x: 0.3, y: FY + 0.06, w: W - 0.6, h: FH - 0.06, fontSize: 9, fontFace: 'Arial', color: 'FFFFFF', align: 'center', margin: 0 });
  if (step && total) slide.addText(step + ' / ' + total, { x: W - 1.2, y: FY + 0.06, w: 0.9, h: FH - 0.06, fontSize: 9, fontFace: 'Arial', color: 'FFFFFF', align: 'right', margin: 0 });
}

function addProgress(slide, pres, role, cur, total) {
  const c = getC(role);
  const y = FY - 0.08, bh = 0.04, filled = (cur / total) * W;
  slide.addShape(pres.ShapeType.rect, { x: 0, y, w: W, h: bh, fill: { color: c.l } });
  slide.addShape(pres.ShapeType.rect, { x: 0, y, w: filled, h: bh, fill: { color: c.a } });
}

function addBullets(slide, pres, role, bullets, x, y, w, h) {
  const c = getC(role);
  const lineH = 0.37;
  let cy = y;
  bullets.forEach(text => {
    slide.addShape(pres.ShapeType.ellipse, { x: x + 0.06, y: cy + 0.1, w: 0.1, h: 0.1, fill: { color: c.a } });
    slide.addText(text, { x: x + 0.26, y: cy, w: w - 0.26, h: lineH, fontSize: 13, fontFace: 'Arial', color: T.textDark, margin: 0 });
    cy += lineH;
  });
}

function addNote(slide, pres, role, text, x, y, w) {
  const c = getC(role);
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.5, fill: { color: c.l }, rectRadius: 0.05 });
  slide.addText(text, { x: x + 0.15, y, w: w - 0.3, h: 0.5, fontSize: 10.5, fontFace: 'Arial', italic: true, color: c.d, valign: 'middle', margin: 0 });
}

function addStepCircle(slide, pres, role, num, x, y, sz) {
  const c = getC(role);
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: sz, h: sz, fill: { color: c.p } });
  slide.addText(String(num), { x, y, w: sz, h: sz, fontSize: sz * 0.45, fontFace: 'Arial', bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
}

// STEPS DATA
const STEPS = [
  { phase: 'Phase 1 - Admin Setup', role: 'admin',
    title: 'Login sebagai Admin',
    bullets: ['Buka aplikasi SIMKlinik di browser', 'Masuk dengan akun Superadmin', 'Halaman Dashboard Admin terbuka'],
    note: 'Admin memiliki akses penuh ke semua fitur manajemen sistem.'
  },
  { role: 'admin',
    title: 'Manajemen Pengguna - Tambah User',
    bullets: ['Buka menu Manajemen Pengguna', 'Klik tombol "Tambah User"', 'Isi: Nama, Email, Password, Role'],
    note: 'Role tersedia: Admin, Dokter, Kasir, Karyawan.'
  },
  { role: 'admin',
    title: 'Simpan User Baru',
    bullets: ['Pilih role yang sesuai untuk setiap user', 'Simpan data user baru', 'Ulangi untuk setiap role yang dibutuhkan'],
    note: 'Setiap role otomatis mendapat menu navigasi sesuai aksesnya.'
  },
  { phase: 'Phase 2 - Karyawan mendaftarkan Pasien', role: 'karyawan',
    title: 'Login sebagai Karyawan',
    bullets: ['Login dengan akun Karyawan', 'Masuk ke Dashboard Karyawan', 'Lihat statistik pasien & antrian hari ini'],
    note: 'Karyawan mengelola pendaftaran dan antrian pasien.'
  },
  { role: 'karyawan',
    title: 'Pendaftaran Pasien Baru',
    bullets: ['Buka menu Pendaftaran', 'Isi data pasien: Nama, Tgl Lahir, JK, Alamat, No. HP', 'Klik "Daftarkan" untuk menyimpan'],
    note: 'Setelah terdaftar, pasien mendapat nomor antrian otomatis.'
  },
  { role: 'karyawan',
    title: 'Pilih Layanan & Dokter',
    bullets: ['Pilih jenis layanan (Pemeriksaan Umum, dll)', 'Pilih dokter penanggung jawab', 'Pilih jadwal/jam praktik yang tersedia'],
    note: 'Layanan menentukan biaya yang akan dibebankan.'
  },
  { role: 'karyawan',
    title: 'Antrian Pasien',
    bullets: ['Pasien masuk ke daftar antrian secara otomatis', 'Karyawan bisa panggil, update status, atau batalkan', 'Antrian auto-refresh setiap 30 detik'],
    note: 'Pasien menunggu dipanggil oleh dokter yang dipilih.'
  },
  { phase: 'Phase 3 - Dokter Memeriksa Pasien', role: 'dokter',
    title: 'Login sebagai Dokter',
    bullets: ['Login dengan akun Dokter', 'Buka menu Antrian Saya', 'Lihat daftar pasien yang menunggu'],
    note: 'Dokter hanya melihat pasien yang jadwalnya sesuai.'
  },
  { role: 'dokter',
    title: 'Panggil Pasien',
    bullets: ['Klik tombol "Panggil" pada pasien di antrian', 'Status pasien berubah menjadi "Dipanggil"', 'Pasien diarahkan ke ruang pemeriksaan'],
    note: 'Panggilan bisa dilakukan berulang jika pasien belum datang.'
  },
  { role: 'dokter',
    title: 'RME - Formulir SOAP',
    bullets: ['Klik "Isi RME" pada pasien yang dipanggil', 'S (Subjective): Keluhan utama & riwayat pasien', 'O (Objective): Tekanan darah, suhu, berat, tinggi', 'A (Assessment): Diagnosis dokter', 'P (Plan): Rencana treatment selanjutnya'],
    note: 'SOAP wajib diisi lengkap untuk dokumentasi medis.'
  },
  { role: 'dokter',
    title: 'Tambah Layanan',
    bullets: ['Pilih jenis layanan dari dropdown', 'Pilih dokter penanggung jawab', 'Klik "Tambah" - harga layanan muncul otomatis', 'Dokter bisa tambahkan multiple layanan'],
    note: 'Total layanan akan masuk ke invoice pasien.'
  },
  { role: 'dokter',
    title: 'Resep Obat',
    bullets: ['Cari obat berdasarkan nama', 'Lihat stok & peringatan stok rendah', 'Input jumlah & aturan pakai (misal: 3x1 sehari)', 'Klik "Simpan Resep"'],
    note: 'Resep akan disiapkan oleh karyawan sebelum pasien bayar.'
  },
  { phase: 'Phase 4 - Karyawan Menyiapkan Obat', role: 'karyawan',
    title: 'Siapkan Obat',
    bullets: ['Buka menu Antrian > Siapkan Obat', 'Lihat daftar resep dari dokter', 'Ambil obat dari rak sesuai resep', 'Cek jumlah & kadaluarsa sebelum konfirmasi'],
    note: 'Pastikan obat benar & lengkap sebelum klik "Selesai".'
  },
  { role: 'karyawan',
    title: 'Konfirmasi Obat Siap',
    bullets: ['Cek setiap item obat sesuai checklist', 'Klik "Selesai" jika semua sudah disiapkan', 'Pasien mendapat notifikasi untuk ke kasir'],
    note: 'Pasien sekarang siap melakukan pembayaran di kasir.'
  },
  { phase: 'Phase 5 - Kasir Memproses Pembayaran', role: 'kasir',
    title: 'Login sebagai Kasir',
    bullets: ['Login dengan akun Kasir', 'Buka menu Invoice', 'Lihat daftar invoice yang belum lunas'],
    note: 'Kasir bertugas memproses semua pembayaran pasien.'
  },
  { role: 'kasir',
    title: 'Generate Invoice',
    bullets: ['Pilih invoice pasien dari daftar', 'Lihat rincian: layanan, produk/obat, subtotal', 'Pastikan semua item sudah benar'],
    note: 'Invoice otomatis terbuat setelah dokter menyelesaikan RME.'
  },
  { role: 'kasir',
    title: 'Proses Pembayaran',
    bullets: ['Pilih metode bayar: Tunai / Transfer / QRIS', 'Input jumlah yang diterima', 'Sistem auto-hitung kembalian', 'Klik "Bayar" - invoice berubah Lunas'],
    note: 'Invoice berubah status menjadi "Lunas" setelah Bayar.'
  },
  { role: 'kasir',
    title: 'Cetak Struk',
    bullets: ['Klik "Cetak Struk" setelah pembayaran berhasil', 'Struk thermal printer otomatis tercetak', 'Jika printer offline: simpan sebagai PDF'],
    note: 'Struk menjadi bukti pembayaran untuk pasien.'
  },
  { phase: 'Phase 6 - Karyawan Follow-up via WhatsApp', role: 'karyawan',
    title: 'Kirim Notifikasi WhatsApp',
    bullets: ['Buka menu Antrian atau Riwayat', 'Pilih pasien yang sudah selesai bayar', 'Klik "Kirim WhatsApp"'],
    note: 'Pesan otomatis berisi info pengambilan obat & jadwal kontrol.'
  },
  { role: 'karyawan',
    title: 'Pesan WhatsApp Otomatis',
    bullets: ['Pesan: nama pasien, nama obat, aturan pakai', 'Tautan jadwal kontrol (jika ada)', 'Nomor WA klinik untuk konfirmasi'],
    note: 'Follow-up WA meningkatkan kepuasan & compliance pasien.'
  },
  { phase: 'Phase 7 - Admin Membuat Laporan', role: 'admin',
    title: 'Menu Laporan',
    bullets: ['Buka menu Laporan dari sidebar', 'Pilih jenis: Harian / Bulanan / Per Dokter / Produk / Layanan', 'Atur filter tanggal sesuai kebutuhan'],
    note: 'Admin bisa melihat semua data aktivitas klinik.'
  },
  { role: 'admin',
    title: 'Filter & Preview Laporan',
    bullets: ['Pilih periode tanggal', 'Pilih jenis laporan yang diinginkan', 'Preview laporan akan tampil di layar'],
    note: 'Preview berguna untuk cek data sebelum download.'
  },
  { role: 'admin',
    title: 'Export PDF',
    bullets: ['Klik tombol "Download PDF"', 'Laporan tersimpan dalam format PDF', 'Bisa langsung di-print atau kirim via email'],
    note: 'PDF mencakup header klinik, data tabel, subtotal & total.'
  },
];

// SLIDE BUILDERS
function createCover(pres) {
  const slide = pres.addSlide();
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: T.primary } });
  slide.addShape(pres.ShapeType.rect, { x: 9.5, y: 0, w: 3.83, h: 2.4, fill: { color: T.dark, transparency: 30 } });
  slide.addShape(pres.ShapeType.ellipse, { x: 11, y: 4.5, w: 3.5, h: 3.5, fill: { color: T.accent, transparency: 70 } });
  slide.addShape(pres.ShapeType.ellipse, { x: -1, y: 5.5, w: 2.5, h: 2.5, fill: { color: T.dark, transparency: 55 } });
  slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.9, w: 3.2, h: 0.5, fill: { color: 'FFFFFF', transparency: 18 } });
  slide.addText('SIMKlinik  Elrhea Clinic', { x: 0.5, y: 0.9, w: 3.2, h: 0.5, fontSize: 11, fontFace: 'Arial', bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
  slide.addText('Alur Kerja Klinik', { x: 0.5, y: 2.0, w: 9.5, h: 1.3, fontSize: 40, fontFace: 'Arial', bold: true, color: 'FFFFFF', margin: 0 });
  slide.addText('Step-by-step panduan operasional SIMKlinik', { x: 0.5, y: 3.3, w: 9.5, h: 0.5, fontSize: 18, fontFace: 'Arial', color: 'FFFFFF', margin: 0 });
  slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.95, w: 3.2, h: 0.05, fill: { color: T.accent } });
  const phases = ['01   Admin - Setup User', '02   Karyawan - Pendaftaran & Antrian', '03   Dokter - Pemeriksaan RME', '04   Karyawan - Siapkan Obat', '05   Kasir - Pembayaran & Struk', '06   Karyawan - Follow-up WA', '07   Admin - Laporan PDF'];
  const half = Math.ceil(phases.length / 2);
  slide.addText(phases.slice(0, half).join('\n'), { x: 0.5, y: 4.15, w: 4.5, h: 2.9, fontSize: 12, fontFace: 'Arial', color: 'FFFFFF', margin: 0 });
  slide.addText(phases.slice(half).join('\n'), { x: 5.2, y: 4.15, w: 4.5, h: 2.9, fontSize: 12, fontFace: 'Arial', color: 'FFFFFF', margin: 0 });
  slide.addShape(pres.ShapeType.rect, { x: 0, y: FY, w: W, h: FH, fill: { color: T.dark } });
  slide.addText('7 Phase  |  ' + STEPS.length + ' Langkah  |  Elrhea Clinic 2026', { x: 0.3, y: FY + 0.06, w: W - 0.6, h: FH - 0.06, fontSize: 9, fontFace: 'Arial', color: 'FFFFFF', align: 'center', margin: 0 });
}

function createPhaseSlide(pres, phaseName) {
  const slide = pres.addSlide();
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: T.dark } });
  slide.addShape(pres.ShapeType.ellipse, { x: -2, y: -2, w: 5, h: 5, fill: { color: T.primary, transparency: 50 } });
  slide.addShape(pres.ShapeType.ellipse, { x: 10, y: 4, w: 4.5, h: 4.5, fill: { color: T.accent, transparency: 60 } });
  slide.addText(phaseName, { x: 0.5, y: 2.8, w: W - 1, h: 1.2, fontSize: 36, fontFace: 'Arial', bold: true, color: 'FFFFFF', align: 'center', margin: 0 });
  slide.addShape(pres.ShapeType.rect, { x: (W - 4) / 2, y: 4.1, w: 4, h: 0.05, fill: { color: T.accent } });
}

function createStepSlide(pres, step, idx, total) {
  const c = getC(step.role);
  const slideNum = idx + 2;
  const slide = pres.addSlide();
  slide.background = { color: T.bgGray };
  addHeader(slide, pres, step.role, step.title, slideNum, total + 2);
  addProgress(slide, pres, step.role, idx + 1, total);
  addStepCircle(slide, pres, step.role, idx + 1, 0.4, CT + 0.1, 0.55);
  const cardX = 1.1, cardY = CT + 0.1, cardW = W - 1.4, cardH = CB - CT - 0.25;
  slide.addShape(pres.ShapeType.roundRect, { x: cardX, y: cardY, w: cardW, h: cardH, fill: { color: T.bgWhite }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: cardX, y: cardY + 0.1, w: 0.07, h: cardH - 0.2, fill: { color: c.p } });
  const bulletX = cardX + 0.25, bulletY = cardY + 0.3, bulletW = cardW - 0.5, bulletH = cardH - 0.6;
  addBullets(slide, pres, step.role, step.bullets, bulletX, bulletY, bulletW, bulletH);
  if (step.note) {
    const noteY = cardY + cardH - 0.62;
    addNote(slide, pres, step.role, step.note, bulletX, noteY, bulletW);
  }
  const counterY = CT + 0.15;
  slide.addShape(pres.ShapeType.ellipse, { x: W - 1.1, y: counterY, w: 0.7, h: 0.7, fill: { color: c.l } });
  slide.addText((idx + 1) + '\nof\n' + total, { x: W - 1.1, y: counterY, w: 0.7, h: 0.7, fontSize: 9, fontFace: 'Arial', bold: true, color: c.d, align: 'center', valign: 'middle', margin: 0 });
  addFooter(slide, pres, step.role, slideNum, total + 2);
}

function createEndSlide(pres) {
  const slide = pres.addSlide();
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: T.primary } });
  slide.addShape(pres.ShapeType.ellipse, { x: -1.5, y: -1.5, w: 4.5, h: 4.5, fill: { color: T.dark, transparency: 50 } });
  slide.addShape(pres.ShapeType.ellipse, { x: 10, y: 4.5, w: 4.5, h: 4.5, fill: { color: T.accent, transparency: 60 } });
  slide.addText('Alur Kerja Klinik', { x: 0.5, y: 2.5, w: W - 1, h: 1.2, fontSize: 40, fontFace: 'Arial', bold: true, color: 'FFFFFF', align: 'center', margin: 0 });
  slide.addText('Selesai', { x: 0.5, y: 3.7, w: W - 1, h: 0.7, fontSize: 24, fontFace: 'Georgia', color: T.primaryL, align: 'center', margin: 0 });
  slide.addShape(pres.ShapeType.rect, { x: 4.5, y: 4.5, w: 4.33, h: 0.04, fill: { color: 'FFFFFF', transparency: 40 } });
  slide.addText(STEPS.length + ' Langkah  |  7 Phase  |  Elrhea Clinic 2026', { x: 0.5, y: 4.65, w: W - 1, h: 0.5, fontSize: 13, fontFace: 'Arial', color: 'FFFFFF', align: 'center', margin: 0 });
  slide.addShape(pres.ShapeType.rect, { x: 0, y: FY, w: W, h: FH, fill: { color: T.dark } });
  slide.addText('SIMKlinik  |  Alur Kerja Klinik  |  Elrhea Clinic', { x: 0.3, y: FY + 0.06, w: W - 0.6, h: FH - 0.06, fontSize: 9, fontFace: 'Arial', color: 'FFFFFF', align: 'center', margin: 0 });
}

function createPresentation() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Alur Kerja Klinik - SIMKlinik';
  pres.author = 'SIMKlinik';
  const total = STEPS.length;
  createCover(pres);
  let phaseSteps = [], phaseName = '', globalStep = 0;
  STEPS.forEach(step => {
    if (step.phase) {
      if (phaseSteps.length > 0) {
        const off = globalStep - phaseSteps.length;
        createPhaseSlide(pres, phaseName);
        phaseSteps.forEach((s, i) => createStepSlide(pres, s, off + i, total));
        globalStep += phaseSteps.length;
      }
      phaseName = step.phase; phaseSteps = [];
    }
    phaseSteps.push(step);
  });
  if (phaseSteps.length > 0) {
    const off = globalStep;
    createPhaseSlide(pres, phaseName);
    phaseSteps.forEach((s, i) => createStepSlide(pres, s, off + i, total));
  }
  createEndSlide(pres);
  const out = path.join(OUTPUT_DIR, 'alur-kerja-klinik.pptx');
  pres.writeFile({ fileName: out }).then(() => console.log('Created: ' + out)).catch(e => console.error(e));
}

createPresentation();
