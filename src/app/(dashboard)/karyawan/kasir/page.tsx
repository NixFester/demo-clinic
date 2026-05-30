'use client';

import KasirListView from '@/components/shared/KasirListView';

export default function KaryawanKasirPage() {
  return <KasirListView basePath="/karyawan/kasir" showGenerateDialog={true} />;
}