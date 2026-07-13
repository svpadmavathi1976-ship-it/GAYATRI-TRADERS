'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CreateInvoiceForm from '@/components/admin/invoices/CreateInvoiceForm';
import type { InvoiceFormData } from '@/lib/invoiceUtils';

export default function EditInvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params?.invoiceId;
  const [initialData, setInitialData] = useState<Partial<InvoiceFormData> | undefined>(undefined);

  useEffect(() => {
    if (!invoiceId) {
      return;
    }

    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`);
        const result = await response.json();
        if (!response.ok || !result.invoice) {
          setInitialData(undefined);
          return;
        }

        const invoice = result.invoice;
        setInitialData({
          ...invoice,
          rows: invoice.items ? JSON.parse(invoice.items) : [],
        });
      } catch (error) {
        console.error('Failed to load invoice:', error);
        setInitialData(undefined);
      }
    };

    void loadInvoice();
  }, [invoiceId]);

  return (
    <div className="w-full">
      <CreateInvoiceForm mode="edit" initialData={initialData} invoiceId={invoiceId} />
    </div>
  );
}
