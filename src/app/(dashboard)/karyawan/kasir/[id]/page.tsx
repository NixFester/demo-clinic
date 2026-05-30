'use client';

import { useParams } from 'next/navigation';
import InvoiceDetailView from '@/components/shared/InvoiceDetailView';

export default function KaryawanKasirDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <InvoiceDetailView id={id} backHref="/karyawan/kasir" />;
}