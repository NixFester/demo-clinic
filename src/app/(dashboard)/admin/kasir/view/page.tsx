'use client';

import { useSearchParams } from 'next/navigation';
import InvoiceDetailView from '@/components/shared/InvoiceDetailView';

export default function InvoiceDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') as string;

  return <InvoiceDetailView id={id} backHref="/admin/kasir" />;
}