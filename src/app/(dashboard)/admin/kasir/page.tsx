'use client';

import KasirListView from '@/components/shared/KasirListView';

export default function KasirPage() {
  return <KasirListView basePath="/admin/kasir" showGenerateDialog={true} />;
}