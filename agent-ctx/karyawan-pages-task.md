# Task: Create 13 Karyawan Pages for SIMKlinik

## Summary
Created all 13 karyawan page files with full standalone implementations. Previously, most karyawan pages were just wrappers delegating to admin pages. Now each page has its own complete implementation.

## Files Created/Modified

1. **Dashboard** (`/karyawan/dashboard/page.tsx`) - Stats cards: total antrian, menunggu, dipanggil, selesai, invoice menunggu bayar, pendapatan. Auto-refresh 30s.

2. **Antrian** (`/karyawan/antrian/page.tsx`) - Table with No Antrian, Pasien, Dokter, Layanan, Status, Aksi. Status update buttons (Panggil/Selesai). Link to Buat Pendaftaran. Auto-refresh 30s.

3. **Pendaftaran Buat** (`/karyawan/pendaftaran/buat/page.tsx`) - Two-step form. Step 1: search/select existing pasien OR create new (dialog). Step 2: select dokter, layanan, keluhan utama, jenis kunjungan (baru/lama/kontrol). Submit POST /api/pendaftaran.

4. **Pasien List** (`/karyawan/pasien/page.tsx`) - Table with No RM, NIK, Nama, Telepon, WA, Tgl Lahir, Aksi. Search by nama/NIK. Tambah Pasien button.

5. **Pasien Detail** (`/karyawan/pasien/[id]/page.tsx`) - Personal info + medical info cards, riwayat kunjungan table.

6. **Pasien Buat** (`/karyawan/pasien/buat/page.tsx`) - Full form: NIK, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, no_telepon, no_whatsapp, golongan_darah, alergi, catatan_kulit. POST /api/pasien.

7. **Kasir** (`/karyawan/kasir/page.tsx`) - Invoice list with status badges. Generate Invoice dialog with pendaftaran selection.

8. **Kasir Detail** (`/karyawan/kasir/[id]/page.tsx`) - Invoice items, discount form (limited by batas_diskon_karyawan), payment form with multi-payment, tunai kembalian calculation.

9. **Follow Up** (`/karyawan/followup/page.tsx`) - Create WA follow-up (select from today's visits), message templates, Kirim WA (wa.me), Tandai Terkirim. History list.

10. **Katalog Produk** (`/karyawan/katalog/produk/page.tsx`) - Full CRUD: add/edit/delete/toggle aktif. Table with Nama, Kategori, Satuan, Harga Jual, Stok, Stok Min, Status, Aksi.

11. **Katalog Layanan** (`/karyawan/katalog/layanan/page.tsx`) - Full CRUD: add/edit/delete/toggle aktif. Table with Nama, Kategori, Harga, Durasi, Status, Aksi.

12. **Katalog Jadwal** (`/karyawan/katalog/jadwal/page.tsx`) - Full CRUD with dokter dropdown. Table with Dokter, Hari, Jam Mulai, Jam Selesai, Kuota, Status, Aksi.

13. **Laporan** (`/karyawan/laporan/page.tsx`) - Tabs: Harian (date picker), Bulanan (month/year picker). Stats: total pasien, baru vs lama, pendapatan. Breakdown metode pembayaran.

## Key Features
- All pages are `'use client'` components
- Indonesian language for all labels
- Loading states with Loader2 spinner
- Error handling with toast notifications
- Currency formatting with Intl.NumberFormat("id-ID")
- Status badges: menunggu/belum_bayar=yellow, dipanggil=blue, selesai/lunas=green, batal=red, draft=gray
- Responsive grid layouts
- Auto-refresh (30s) on dashboard and antrian pages
- Lint passes with no errors
