# Task: Write 18 SIMKlinik Admin Page Files

## Summary
All 18 admin page files have been successfully rewritten according to the detailed specifications. Each page is a "use client" component using shadcn/ui, Lucide icons, and Indonesian language labels.

## Files Written

1. **Admin Dashboard** (`/admin/dashboard/page.tsx`) - Auto-refresh every 30s, 5 stat cards (total, menunggu, dipanggil, selesai, total_pendapatan), fetches from /api/antrian and /api/laporan/harian
2. **Admin Pengguna** (`/admin/pengguna/page.tsx`) - Table with Loader2 spinner, error messages, pagination, add/edit dialog with role select, toggle aktif
3. **Admin Dokter** (`/admin/dokter/page.tsx`) - Two-step create (pengguna first, then dokter record), select existing pengguna, edit dialog, toggle aktif
4. **Admin Layanan** (`/admin/layanan/page.tsx`) - Kategori select (kecantikan/medis/konsultasi), pagination, Loader2 spinner
5. **Admin Produk** (`/admin/produk/page.tsx`) - Kategori select (skincare/obat/suplemen/lainnya), stok_minimum column, warning Badge when stok < stok_minimum
6. **Admin Jadwal Dokter** (`/admin/jadwal-dokter/page.tsx`) - Pagination, hari select (senin-sabtu), dokter dropdown, Loader2
7. **Admin Diagnosa** (`/admin/diagnosa/page.tsx`) - Searchable ICD-10 list, uses shadcn Button (not local), Loader2
8. **Admin Pasien** (`/admin/pasien/page.tsx`) - Search, Tgl Lahir and JK columns, pagination
9. **Admin Pasien Detail** (`/admin/pasien/[id]/page.tsx`) - Personal info cards + riwayat kunjungan table
10. **Admin Antrian** (`/admin/antrian/page.tsx`) - Auto-refresh 30s, Panggil and Batalkan buttons, status badges
11. **Admin Pendaftaran Buat** (`/admin/pendaftaran/buat/page.tsx`) - Step 1 (search/select/create pasien) + Step 2 (select dokter/layanan/keluhan), new pasien dialog
12. **Admin RME** (`/admin/rme/page.tsx`) - List with Pasien, Dokter, Status, Tanggal, view action
13. **Admin RME Detail** (`/admin/rme/[id]/page.tsx`) - Read-only view: SOAP notes, diagnosa ICD-10, kondisi, tindakan table, resep table
14. **Admin Kasir** (`/admin/kasir/page.tsx`) - Invoice list with Dibayar column, Generate Invoice button
15. **Admin Kasir Detail** (`/admin/kasir/[id]/page.tsx`) - Invoice items, diskon form, multi-payment support, kembalian for tunai, payment history
16. **Admin Follow Up** (`/admin/followup/page.tsx`) - Create form (select pasien, jenis, template message, WA link preview), history list, mark as sent
17. **Admin Laporan** (`/admin/laporan/page.tsx`) - Tabs (Harian/Bulanan), date/month picker, stat cards, breakdown per metode bayar
18. **Admin Pengaturan** (`/admin/pengaturan/page.tsx`) - Settings form (nama, alamat, telepon, batas diskon, footer invoice)

## Key Implementation Details
- All pages use `"use client"` directive
- Loader2 spinner while data is fetching
- Error messages displayed on API failures
- Currency formatted with `Intl.NumberFormat("id-ID")`
- Dates formatted in Indonesian
- Status badge colors: menunggu/belum_bayar/draft=yellow, dipanggil=blue, selesai/lunas/final=green, batal=red
- Pagination with page controls
- Responsive design
- Lint: passes clean
