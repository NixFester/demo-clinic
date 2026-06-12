import InvoiceDetailView from '@/components/shared/InvoiceDetailView';

interface KasirInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function KasirInvoicePage({
  params,
}: KasirInvoicePageProps) {
  const { id } = await params;

  return <InvoiceDetailView id={id} backHref="/kasir/dashboard" />;
}