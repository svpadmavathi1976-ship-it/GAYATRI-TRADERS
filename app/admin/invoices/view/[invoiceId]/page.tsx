'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CreateInvoiceForm from '@/components/admin/invoices/CreateInvoiceForm';
import type { InvoiceFormData } from '@/lib/invoiceUtils';

export default function ViewInvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params?.invoiceId;
  const [initialData, setInitialData] = useState<Partial<InvoiceFormData> | undefined>(undefined);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [invoiceLoadError, setInvoiceLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) {
      setInitialData(undefined);
      setIsLoadingInvoice(false);
      setInvoiceLoadError('Invoice ID was not provided.');
      return;
    }

    let isActive = true;

    const loadInvoice = async () => {
      setIsLoadingInvoice(true);
      setInvoiceLoadError(null);
      setInitialData(undefined);

      try {
        const response = await fetch(`/api/invoices/${invoiceId}`);
        const result = await response.json();

        if (!isActive) {
          return;
        }

        if (!response.ok || !result.invoice) {
          setInitialData(undefined);
          setInvoiceLoadError('The selected invoice could not be loaded.');
          return;
        }

        const invoice = result.invoice;
        setInitialData({
          ...invoice,
          rows: invoice.items ? JSON.parse(invoice.items) : [],
        });
      } catch (error) {
        console.error('Failed to load invoice:', error);
        if (isActive) {
          setInitialData(undefined);
          setInvoiceLoadError('Unable to load the selected invoice right now.');
        }
      } finally {
        if (isActive) {
          setIsLoadingInvoice(false);
        }
      }
    };

    void loadInvoice();

    return () => {
      isActive = false;
    };
  }, [invoiceId]);

  return (
    <div className="w-full">
      <CreateInvoiceForm
        mode="view"
        initialData={initialData}
        invoiceId={invoiceId}
        isLoadingInitialData={isLoadingInvoice}
        initialLoadError={invoiceLoadError}
      />
    </div>
  );
}
