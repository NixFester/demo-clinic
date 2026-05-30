'use client';

import JadwalDokterView from '@/components/shared/JadwalDokterView';

export default function JadwalDokterPage() {
  return (
    <JadwalDokterView
      withPagination={true}
      hideDelete={false}
      lockDokterOnEdit={true}
    />
  );
}