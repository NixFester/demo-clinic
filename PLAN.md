# Complete Report System - Implementation Plan

## Overview
This plan implements a comprehensive, redesigned report system for SIMKlinik that includes:

1. **PHP Handler Updates** - Add new data queries for extended reports
2. **API Route Updates** - Create new endpoints for new report types
3. **Type Definitions** - Update TypeScript types for new data
4. **UI Redesign** - Modern card-based design with charts

## Files to Create/Modify

### 1. PHP Handler: `upload/handlers.php`

**New functions to add:**

```php
// ─── Enhanced Daily Report ───
function laporan_harian(PDO $pdo, array $data): array
- Add: selesai/batal/antrian counts from pendaftaran status
- Add: revenue by service category (kecantikan/medis/konsultasi)
- Add: revenue by product category (skincare/obat/suplemen/lainnya)
- Add: top 5 services by revenue
- Add: top 5 products by revenue
- Add: doctor performance (patient count + revenue per doctor)

// ─── New: Service Category Report ───
function laporan_layanan(PDO $pdo, array $data): array
- Breakdown by category: kecantikan, medis, konsultasi
- Revenue and transaction count per category
- Top services per category

// ─── New: Product Sales Report ───
function laporan_produk(PDO $pdo, array $data): array
- Breakdown by category: skincare, obat, suplemen, lainnya
- Revenue and quantity sold per category
- Top products by revenue

// ─── New: Doctor Performance Report ───
function laporan_dokter(PDO $pdo, array $data): array
- Patient count per doctor
- Revenue per doctor
- Average per patient
- Service breakdown per doctor

// ─── New: RME Statistics Report ───
function laporan_rme(PDO $pdo, array $data): array
- Total RME created
- Breakdown by status: draft, final, batal
- RME per doctor

// ─── New: Custom Date Range Report ───
function laporan_range(PDO $pdo, array $data): array
- Accept start_date and end_date
- All metrics: patients, revenue, invoices, breakdowns
```

### 2. TypeScript Types: `src/types/api-items.ts`

**New interfaces:**

```typescript
// ─── Service Breakdown ───
export interface LaporanPerKategori {
  kategori: KategoriLayanan | KategoriProduk;
  total: number;
  jumlah: number;
}

export interface LaporanTopItem {
  nama: string;
  jumlah: number;
  total: number;
}

// ─── Doctor Performance ───
export interface LaporanPerDokter {
  nama_dokter: string;
  jumlah_pasien: number;
  total_pendapatan: number;
  rata-rata: number;
}

// ─── Enhanced LaporanHarian ───
export interface LaporanHarian {
  // existing fields...
  selesai: number;
  batal: number;
  antrian: number;
  // NEW:
  per_kategori_layanan: LaporanPerKategori[];
  per_kategori_produk: LaporanPerKategori[];
  top_layanan: LaporanTopItem[];
  top_produk: LaporanTopItem[];
  per_dokter: LaporanPerDokter[];
  rme_stats: {
    total: number;
    draft: number;
    final: number;
  };
}

// ─── Enhanced LaporanBulanan ───
export interface LaporanBulanan {
  // existing fields...
  // NEW:
  per_kategori_layanan: LaporanPerKategori[];
  per_kategori_produk: LaporanPerKategori[];
  per_dokter: LaporanPerDokter[];
  rme_stats: {
    total: number;
    draft: number;
    final: number;
  };
}

// ─── New Report Types ───
export interface LaporanLayanan {
  tanggal: string;
  per_kategori: LaporanPerKategori[];
  top_layanan: LaporanTopItem[];
  total_pendapatan: number;
}

export interface LaporanProduk {
  tanggal: string;
  per_kategori: LaporanPerKategori[];
  top_produk: LaporanTopItem[];
  total_pendapatan: number;
}

export interface LaporanDokter {
  tanggal: string;
  per_dokter: LaporanPerDokter[];
  total_pasien: number;
  total_pendapatan: number;
}

export interface LaporanRME {
  tanggal: string;
  total: number;
  per_status: { status: StatusRME; jumlah: number }[];
  per_dokter: { nama_dokter: string; jumlah: number }[];
}

export interface LaporanRange {
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_pendapatan: number;
  total_invoice: number;
  total_pasien: number;
  pasien_baru: number;
  pasien_lama: number;
  per_metode: LaporanPerMetode[];
  per_kategori_layanan: LaporanPerKategori[];
  per_kategori_produk: LaporanPerKategori[];
  per_hari: LaporanPerHari[];
  per_dokter: LaporanPerDokter[];
}
```

### 3. New API Routes

**Create:**
- `src/app/api/laporan/layanan/route.ts` - Service category report
- `src/app/api/laporan/produk/route.ts` - Product sales report
- `src/app/api/laporan/dokter/route.ts` - Doctor performance report
- `src/app/api/laporan/rme/route.ts` - RME statistics
- `src/app/api/laporan/range/route.ts` - Custom date range

### 4. Admin Laporan Page: `src/app/(dashboard)/admin/laporan/page.tsx`

**Complete redesign with:**

#### Layout Structure:
```
┌─────────────────────────────────────────────────────────────┐
│  Laporan & Analisis                    [Export PDF]          │
├─────────────────────────────────────────────────────────────┤
│  [Harian] [Bulanan] [Layanan] [Produk] [Dokter] [RME] [Custom]│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Total   │ │Revenue  │ │ Invoice │ │ Pasien  │ │ RME     │ │
│  │ Pasien  │ │ (Rp)    │ │ Count   │ │ Baru    │ │ Final   │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌─────────────────────────────┐ │
│  │ Revenue Chart         │  │ Payment Method Breakdown    │ │
│  │ (Line/Bar Chart)      │  │ (Pie Chart)                 │ │
│  └───────────────────────┘  └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌─────────────────────────────┐ │
│  │ Service Categories     │  │ Doctor Performance          │ │
│  │ (Bar Chart)            │  │ (Horizontal Bar)            │ │
│  └───────────────────────┘  └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Detailed Data Table                                     ││
│  │ [Date Range] [Category Filter] [Export CSV]              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### Features:
1. **Tab Navigation** - 7 tabs for different report types
2. **Summary Cards** - Key metrics with colored backgrounds and icons
3. **Charts** - Using Recharts (already installed):
   - Interactive charts with tooltips on hover
   - Line chart for revenue trends
   - Bar chart for category comparison
   - Pie chart for payment method distribution
4. **Data Tables** - Sortable tables with pagination
5. **Filters** - Date pickers with custom range (calendar UI), category dropdown filters
6. **Export** - PDF with full detail, CSV for data
7. **Loading States** - Skeleton loaders
8. **Responsive Design** - Works on mobile

### 5. Kasir Laporan Page: `src/app/(dashboard)/kasir/laporan/page.tsx`

**Enhanced with:**
- Payment method breakdown
- Invoice status summary
- Basic charts
- Cleaner table design

### 6. Karyawan Laporan Page: `src/app/(dashboard)/karyawan/laporan/page.tsx`

**Updated to match new design system with:**
- Same card-based layout
- Basic revenue/payment info
- Export functionality

## Implementation Order

1. **Phase 1: PHP Backend**
   - Update `laporan_harian()` with new data
   - Update `laporan_bulanan()` with new data
   - Add `laporan_layanan()`, `laporan_produk()`, `laporan_dokter()`, `laporan_rme()`, `laporan_range()`

2. **Phase 2: TypeScript Types**
   - Update `src/types/api-items.ts` with new interfaces
   - Add new types for all report types

3. **Phase 3: API Routes**
   - Create new route files for each report type
   - Add validation and error handling

4. **Phase 4: Admin UI Redesign**
   - Complete rewrite of admin laporan page
   - Add chart components
   - Implement tab navigation
   - Add PDF/CSV export
   - Polish responsive design

5. **Phase 5: Kasir & Karyawan UI**
   - Update kasir laporan with new design
   - Update karyawan laporan with new design

## Color Scheme

For cards:
- Total Pasien: `bg-blue-50 border-blue-200` → `text-blue-700`
- Pendapatan: `bg-emerald-50 border-emerald-200` → `text-emerald-700`
- Invoice: `bg-purple-50 border-purple-200` → `text-purple-700`
- Pasien Baru: `bg-teal-50 border-teal-200` → `text-teal-700`
- Selesai: `bg-green-50 border-green-200` → `text-green-700`
- RME: `bg-orange-50 border-orange-200` → `text-orange-700`

Chart colors (consistent):
- Primary: `hsl(160, 84%, 39%)` (emerald)
- Secondary: `hsl(210, 92%, 45%)` (blue)
- Tertiary: `hsl(280, 85%, 55%)` (purple)
- Accent: `hsl(30, 92%, 50%)` (orange)

## Dependencies

All required packages are already installed:
- `@react-pdf/renderer` - PDF generation (already in use)
- `recharts` - Charts (already in shadcn/ui chart.tsx)
- `lucide-react` - Icons (already in use)
- `sonner` - Toast notifications (already in use)

## Testing Checklist

- [ ] Daily report shows all new data
- [ ] Monthly report shows all new data
- [ ] New report types (layanan, produk, dokter, rme, range) work
- [ ] PDF export includes all data
- [ ] CSV export works
- [ ] Charts render correctly
- [ ] Responsive on mobile
- [ ] Loading states work
- [ ] Error handling works
- [ ] Role-based access works (admin, kasir, karyawan)
