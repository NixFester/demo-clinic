'use client';

import { useParams } from 'next/navigation';
import InvoiceDetailView from '@/components/shared/InvoiceDetailView';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <InvoiceDetailView id={id} backHref="/admin/kasir" />;
}