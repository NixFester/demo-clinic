'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

/**
 * PageOnboardingOverlay
 * ----------------------
 * Drop this ONE component once in DashboardLayout (or any shared layout).
 * It auto-detects the current route + figures out a stable localStorage key
 * per page (e.g. "onboarding:dashboard-admin"), looks up the explanation
 * content for that page from CONTENT_MAP below, and shows a full-screen
 * overlay describing what the user can do on that page.
 *
 * Behavior:
 * - Shows only if localStorage[key] is NOT "true" (i.e. missing or false).
 * - Clicking ANYWHERE on the overlay sets localStorage[key] = "true" and
 *   dismisses it permanently (per page, per browser).
 * - If the current route isn't in CONTENT_MAP, nothing renders (no overlay,
 *   no localStorage write) — so you can add pages to the map incrementally.
 */

interface PageContent {
  /** localStorage key suffix, e.g. "dashboard-admin" */
  key: string;
  title: string;
  description?: string;
  points: string[];
}

// ─── Route → Content map ──────────────────────────────────────────────────
// Order matters: more specific patterns should come before generic ones.
// `test` matches the pathname (dynamic segments already normalized to ":id").

const ROUTES: { test: RegExp; content: PageContent }[] = [
  // ── ADMIN ──────────────────────────────────────────────────────────────
  {
    test: /^\/admin\/dashboard$/,
    content: {
      key: 'dashboard-admin',
      title: 'Dashboard Admin',
      points: [
        'Lihat ringkasan antrian hari ini: menunggu, dipanggil, dan selesai.',
        'Pantau total pendapatan hari ini secara real-time.',
        'Gunakan menu di sebelah kiri untuk mengelola seluruh data klinik.',
        'Data diperbarui otomatis setiap 30 detik.',
      ],
    },
  },
  {
    test: /^\/admin\/laporan$/,
    content: {
      key: 'laporan-admin',
      title: 'Laporan',
      points: [
        'Lihat laporan harian: jumlah pasien, pendapatan, dan breakdown metode bayar.',
        'Beralih ke tab "Bulanan" untuk rekap pendapatan per bulan.',
        'Klik "Export" untuk mengunduh laporan dalam bentuk PDF.',
      ],
    },
  },
  {
    test: /^\/admin\/pengguna$/,
    content: {
      key: 'pengguna-admin',
      title: 'Manajemen Pengguna',
      points: [
        'Tambah akun baru untuk admin, dokter, karyawan, atau kasir.',
        'Edit nama, username, password, dan role pengguna.',
        'Klik ikon toggle untuk menonaktifkan/mengaktifkan akun.',
        'Pengguna non-aktif ditampilkan di tabel terpisah di bawah.',
      ],
    },
  },
  {
    test: /^\/admin\/dokter$/,
    content: {
      key: 'dokter-admin',
      title: 'Manajemen Dokter',
      points: [
        'Tambah dokter baru: buat akun pengguna dulu, lalu lengkapi spesialisasi & no. SIP.',
        'Atau pilih akun pengguna ber-role dokter yang sudah ada.',
        'Edit spesialisasi dan no. SIP dokter yang sudah terdaftar.',
        'Nonaktifkan dokter yang sudah tidak praktik lewat tombol toggle.',
      ],
    },
  },
  {
    test: /^\/admin\/spesialisasi$/,
    content: {
      key: 'spesialisasi-admin',
      title: 'Manajemen Spesialisasi',
      points: [
        'Tambah kategori spesialisasi dokter (mis. Umum, Estetika, Gigi).',
        'Klik ikon pensil untuk mengubah nama spesialisasi.',
      ],
    },
  },
  {
    test: /^\/admin\/layanan$/,
    content: {
      key: 'layanan-admin',
      title: 'Manajemen Layanan',
      points: [
        'Tambah layanan klinik beserta kategori, harga, dan durasi.',
        'Edit harga atau durasi layanan kapan saja.',
        'Hapus (nonaktifkan) layanan yang sudah tidak ditawarkan.',
      ],
    },
  },
  {
    test: /^\/admin\/produk$/,
    content: {
      key: 'produk-admin',
      title: 'Manajemen Produk',
      points: [
        'Kelola stok produk/obat: tambah, edit harga, dan update jumlah stok.',
        'Atur stok minimum agar muncul peringatan saat stok menipis.',
        'Status aktif/nonaktif menentukan apakah produk bisa diresepkan.',
      ],
    },
  },
  {
    test: /^\/admin\/jadwal-dokter$/,
    content: {
      key: 'jadwal-dokter-admin',
      title: 'Jadwal Dokter',
      points: [
        'Atur hari, jam praktik, dan kuota pasien untuk setiap dokter.',
        'Kuota ini otomatis membatasi jumlah pendaftaran per hari untuk dokter terkait.',
        'Edit atau hapus jadwal yang sudah tidak berlaku.',
      ],
    },
  },
  {
    test: /^\/admin\/diagnosa$/,
    content: {
      key: 'diagnosa-admin',
      title: 'Diagnosa ICD-10',
      points: [
        'Cari kode atau nama diagnosa ICD-10 yang tersedia di sistem.',
        'Data ini digunakan dokter saat mengisi rekam medis pasien.',
      ],
    },
  },
  {
    test: /^\/admin\/pasien$/,
    content: {
      key: 'pasien-admin',
      title: 'Daftar Pasien',
      points: [
        'Cari pasien berdasarkan nama, NIK, atau nomor rekam medis.',
        'Klik "Detail" untuk melihat data pribadi, medis, dan riwayat kunjungan pasien.',
      ],
    },
  },
  {
    test: /^\/admin\/pasien\/:id$/,
    content: {
      key: 'pasien-detail-admin',
      title: 'Detail Pasien',
      points: [
        'Lihat data pribadi dan informasi medis lengkap pasien.',
        'Lihat seluruh riwayat kunjungan, dokter, layanan, dan status pembayaran.',
      ],
    },
  },
  {
    test: /^\/admin\/antrian$/,
    content: {
      key: 'antrian-admin',
      title: 'Antrian Hari Ini',
      points: [
        'Pantau seluruh antrian pasien hari ini secara real-time (auto-refresh 30 detik).',
        'Panggil pasien yang masih menunggu.',
        'Lihat status RME pasien yang sudah dipanggil/selesai.',
        'Batalkan antrian jika diperlukan.',
      ],
    },
  },
  {
    test: /^\/admin\/rme$/,
    content: {
      key: 'rme-list-admin',
      title: 'Rekam Medis Elektronik',
      points: [
        'Lihat seluruh rekam medis yang dibuat oleh dokter, beserta statusnya (draft/final).',
        'Klik "Lihat" untuk membuka detail RME, diagnosa, tindakan, dan resep pasien.',
      ],
    },
  },
  {
    test: /^\/admin\/rme\/:id$/,
    content: {
      key: 'rme-detail-admin',
      title: 'Detail Rekam Medis',
      points: [
        'Lihat catatan SOAP, diagnosa ICD-10, kondisi, dan tindak lanjut pasien.',
        'Lihat daftar tindakan dan resep obat yang diberikan dokter.',
      ],
    },
  },
  {
    test: /^\/admin\/kasir$/,
    content: {
      key: 'kasir-admin',
      title: 'Kasir',
      points: [
        'Generate invoice untuk pendaftaran yang sudah selesai diperiksa.',
        'Klik "Bayar"/"Lihat" untuk membuka detail invoice dan memproses pembayaran.',
        'Cetak struk invoice langsung dari daftar.',
      ],
    },
  },
  {
    test: /^\/admin\/kasir\/:id$/,
    content: {
      key: 'kasir-detail-admin',
      title: 'Detail Invoice',
      points: [
        'Lihat rincian item, subtotal, diskon, dan total tagihan.',
        'Terapkan diskon (jika invoice belum dibayar).',
        'Proses pembayaran — bisa dengan beberapa metode sekaligus.',
        'Cetak invoice setelah pembayaran selesai.',
      ],
    },
  },
  {
    test: /^\/admin\/pendaftaran\/buat$/,
    content: {
      key: 'pendaftaran-buat-admin',
      title: 'Pendaftaran Baru',
      points: [
        'Cari pasien yang sudah terdaftar, atau daftarkan pasien baru.',
        'Pilih dokter, layanan, dan isi keluhan utama pasien.',
        'Sistem otomatis memberi nomor antrian sesuai urutan.',
      ],
    },
  },
  {
    test: /^\/admin\/followup$/,
    content: {
      key: 'followup-admin',
      title: 'Follow Up WhatsApp',
      points: [
        'Buat pesan follow-up (konfirmasi, pengingat, pascakunjungan, kontrol) untuk pasien.',
        'Pesan otomatis terisi template sesuai jenis follow-up yang dipilih.',
        'Klik "Kirim WA" untuk membuka WhatsApp dengan pesan siap kirim.',
      ],
    },
  },
  {
    test: /^\/admin\/pengaturan$/,
    content: {
      key: 'pengaturan-admin',
      title: 'Pengaturan Sistem',
      points: [
        'Atur nama, alamat, dan nomor telepon klinik yang tampil di invoice.',
        'Atur batas maksimal diskon yang boleh diberikan karyawan.',
        'Atur teks footer yang muncul di setiap invoice.',
      ],
    },
  },

  // ── DOKTER ─────────────────────────────────────────────────────────────
  {
    test: /^\/dokter\/dashboard$/,
    content: {
      key: 'dashboard-dokter',
      title: 'Dashboard Dokter',
      points: [
        'Lihat jumlah antrian Anda hari ini: menunggu, dipanggil, dan selesai.',
        'Data antrian diperbarui otomatis setiap 30 detik.',
      ],
    },
  },
  {
    test: /^\/dokter\/antrian$/,
    content: {
      key: 'antrian-dokter',
      title: 'Antrian Saya',
      points: [
        'Lihat daftar pasien yang akan Anda periksa hari ini.',
        'Panggil pasien yang masih menunggu.',
        'Klik "Buat RME" untuk pasien yang sudah dipanggil agar bisa mulai diperiksa.',
        'Klik "Lihat RME" untuk pasien yang sudah selesai diperiksa.',
      ],
    },
  },
  {
    test: /^\/dokter\/jadwal$/,
    content: {
      key: 'jadwal-dokter-self',
      title: 'Jadwal Saya',
      points: [
        'Lihat hari, jam praktik, dan kuota pasien Anda di klinik.',
        'Hubungi admin jika ada jadwal yang perlu diubah.',
      ],
    },
  },
  {
    test: /^\/dokter\/rme\/buat\/:id$/,
    content: {
      key: 'rme-buat-dokter',
      title: 'Buat Rekam Medis',
      points: [
        'Isi catatan SOAP (Subjektif, Objektif, Assesment, Plan) untuk pasien.',
        'Pilih diagnosa utama dan sekunder (ICD-10) jika ada.',
        'Tambahkan tindakan medis yang dilakukan.',
        'Tambahkan resep obat untuk pasien.',
        'Klik "Finalisasi" jika seluruh data sudah lengkap dan benar — RME tidak bisa diubah lagi setelah ini.',
      ],
    },
  },
  {
    test: /^\/dokter\/rme\/:id$/,
    content: {
      key: 'rme-detail-dokter',
      title: 'Detail Rekam Medis',
      points: [
        'Lengkapi atau perbarui SOAP, diagnosa, tindakan, dan resep selama status masih "draft".',
        'Jika pasien punya RME sebelumnya, ringkasannya akan ditampilkan di langkah pertama.',
        'Klik "Finalisasi" setelah semua data lengkap — RME final bersifat read-only.',
      ],
    },
  },

  // ── KARYAWAN ───────────────────────────────────────────────────────────
  {
    test: /^\/karyawan\/dashboard$/,
    content: {
      key: 'dashboard-karyawan',
      title: 'Dashboard Karyawan',
      points: [
        'Lihat ringkasan antrian hari ini dan jumlah invoice yang belum dibayar.',
        'Pantau pendapatan klinik hari ini.',
      ],
    },
  },
  {
    test: /^\/karyawan\/antrian$/,
    content: {
      key: 'antrian-karyawan',
      title: 'Antrian',
      points: [
        'Panggil pasien yang masih menunggu untuk diarahkan ke dokter.',
        'Tandai antrian "Selesai" setelah pasien selesai diperiksa dokter.',
      ],
    },
  },
  {
    test: /^\/karyawan\/pendaftaran\/buat$/,
    content: {
      key: 'pendaftaran-buat-karyawan',
      title: 'Pendaftaran Baru',
      points: [
        'Cari pasien yang sudah terdaftar, atau daftarkan pasien baru lebih dulu.',
        'Pilih dokter dan layanan yang akan diambil pasien.',
        'Sistem otomatis memberi nomor antrian sesuai urutan harian.',
      ],
    },
  },
  {
    test: /^\/karyawan\/pasien$/,
    content: {
      key: 'pasien-karyawan',
      title: 'Daftar Pasien',
      points: [
        'Cari data pasien berdasarkan nama atau NIK.',
        'Tambah pasien baru lewat tombol "Tambah Pasien".',
        'Klik "Detail" untuk melihat data lengkap dan riwayat kunjungan pasien.',
      ],
    },
  },
  {
    test: /^\/karyawan\/pasien\/buat$/,
    content: {
      key: 'pasien-buat-karyawan',
      title: 'Tambah Pasien Baru',
      points: [
        'Isi NIK, nama, tanggal lahir, dan data kontak pasien.',
        'No. rekam medis akan dibuat otomatis oleh sistem.',
      ],
    },
  },
  {
    test: /^\/karyawan\/pasien\/:id$/,
    content: {
      key: 'pasien-detail-karyawan',
      title: 'Detail Pasien',
      points: [
        'Lihat data pribadi dan informasi medis pasien.',
        'Lihat seluruh riwayat kunjungan pasien ke klinik.',
      ],
    },
  },
  {
    test: /^\/karyawan\/kasir$/,
    content: {
      key: 'kasir-karyawan',
      title: 'Kasir',
      points: [
        'Generate invoice — pilih pendaftaran tertentu atau auto-generate semua sekaligus.',
        'Proses pembayaran dan cetak struk untuk pasien.',
      ],
    },
  },
  {
    test: /^\/karyawan\/kasir\/:id$/,
    content: {
      key: 'kasir-detail-karyawan',
      title: 'Detail Invoice',
      points: [
        'Terapkan diskon sesuai batas yang diizinkan admin.',
        'Proses pembayaran dengan satu atau beberapa metode bayar.',
        'Cetak invoice setelah pembayaran selesai.',
      ],
    },
  },
  {
    test: /^\/karyawan\/followup$/,
    content: {
      key: 'followup-karyawan',
      title: 'Follow Up WhatsApp',
      points: [
        'Buat pesan follow-up untuk pasien yang berkunjung hari ini.',
        'Kirim langsung lewat WhatsApp dengan satu klik.',
      ],
    },
  },
  {
    test: /^\/karyawan\/katalog\/produk$/,
    content: {
      key: 'katalog-produk-karyawan',
      title: 'Katalog Produk',
      points: [
        'Kelola stok dan harga jual produk/obat klinik.',
        'Tambah produk baru atau nonaktifkan yang sudah tidak dijual.',
      ],
    },
  },
  {
    test: /^\/karyawan\/katalog\/layanan$/,
    content: {
      key: 'katalog-layanan-karyawan',
      title: 'Katalog Layanan',
      points: [
        'Kelola daftar layanan klinik beserta harga dan durasinya.',
        'Klik status untuk mengaktifkan/menonaktifkan layanan dengan cepat.',
      ],
    },
  },
  {
    test: /^\/karyawan\/katalog\/jadwal$/,
    content: {
      key: 'katalog-jadwal-karyawan',
      title: 'Jadwal Dokter',
      points: [
        'Atur jadwal praktik dan kuota harian untuk setiap dokter.',
        'Klik status untuk mengaktifkan/menonaktifkan jadwal tertentu.',
      ],
    },
  },
  {
    test: /^\/karyawan\/laporan$/,
    content: {
      key: 'laporan-karyawan',
      title: 'Laporan',
      points: [
        'Lihat ringkasan pasien dan pendapatan klinik harian maupun bulanan.',
        'Lihat breakdown pendapatan berdasarkan metode pembayaran.',
      ],
    },
  },

  // ── KASIR ──────────────────────────────────────────────────────────────
  {
    test: /^\/kasir\/dashboard$/,
    content: {
      key: 'dashboard-kasir',
      title: 'Kasir',
      points: [
        'Lihat daftar pendaftaran yang siap diproses pembayarannya.',
        'Klik "Generate Invoice" untuk pendaftaran yang belum punya invoice.',
        'Klik "Bayar" untuk memproses pembayaran pasien.',
      ],
    },
  },
  {
    test: /^\/kasir\/laporan$/,
    content: {
      key: 'laporan-kasir',
      title: 'Laporan Pembayaran',
      points: [
        'Lihat seluruh pendaftaran yang sudah lunas.',
        'Klik "Detail" untuk membuka kembali rincian invoice.',
      ],
    },
  },
  {
    test: /^\/kasir\/:id$/,
    content: {
      key: 'kasir-detail-kasir',
      title: 'Detail Invoice',
      points: [
        'Lihat rincian item dan total tagihan pasien.',
        'Proses pembayaran dan cetak struk invoice.',
      ],
    },
  },
];

/** Normalizes a pathname's dynamic segments (numbers/ids) into ":id" so it matches the patterns above. */
function normalizePath(pathname: string): string {
  return pathname
    .split('/')
    .map((seg) => (seg && /^[0-9a-zA-Z_-]+$/.test(seg) && /\d/.test(seg) ? ':id' : seg))
    .join('/');
}

function findContent(pathname: string): PageContent | null {
  const normalized = normalizePath(pathname);
  for (const route of ROUTES) {
    if (route.test.test(normalized) || route.test.test(pathname)) {
      return route.content;
    }
  }
  return null;
}

const STORAGE_PREFIX = 'onboarding:';

export default function PageOnboardingOverlay() {
  const pathname = usePathname();
  const [content, setContent] = useState<PageContent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const match = findContent(pathname);
    if (!match) {
      setContent(null);
      setVisible(false);
      return;
    }
    setContent(match);
    try {
      const seen = localStorage.getItem(STORAGE_PREFIX + match.key);
      setVisible(seen !== 'true');
    } catch {
      // localStorage unavailable (SSR/private mode) — don't show to be safe
      setVisible(false);
    }
  }, [pathname]);

  const dismiss = () => {
    if (!content) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + content.key, 'true');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible || !content) return null;

  return (
    <div
      role="button"
      aria-label="Tutup penjelasan halaman"
      onClick={dismiss}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl cursor-default"
      >
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="absolute top-3 right-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-bold text-emerald-700 mb-1">{content.title}</h2>
        {content.description && (
          <p className="text-sm text-gray-500 mb-3">{content.description}</p>
        )}

        <ul className="space-y-2 mb-5">
          {content.points.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-gray-400 text-center">
          Klik di mana saja untuk menutup &mdash; penjelasan ini hanya muncul sekali.
        </p>
      </div>
    </div>
  );
}
