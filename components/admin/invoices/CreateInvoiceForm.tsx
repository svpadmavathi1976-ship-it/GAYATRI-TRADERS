'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ArrowLeft } from 'lucide-react';
import { exportInvoiceToExcel } from '@/lib/excelExport';
import {
  numberToWords,
  calculateTotal,
  calculateAmount,
  type InvoiceRow,
  type InvoiceFormData,
} from '@/lib/invoiceUtils';
import InvoiceTemplate from '@/components/admin/invoices/InvoiceTemplate';

const createDefaultRows = (): InvoiceRow[] => [
  {
    id: '1',
    description: 'Raw Broken Rice / Damage Rice',
        bags: 0,
    quantity: 0,
    rate: 0,
    amount: 0,
  },
];

const createDefaultInvoiceData = (overrides: Partial<InvoiceFormData> = {}): InvoiceFormData => {
  const { rows: overrideRows, ...restOverrides } = overrides;

  return {
    date: new Date().toISOString().split('T')[0],
    billNumber: '',
    state: 'Andhra Pradesh',
    stateCode: '37',
    receiverName: '',
    receiverAddress: '',
    receiverGSTIN: '',
    invoiceNumber: '',
    billNo: '',
    dispatchedThrough: 'Lorry',
    customTransport: '',
    billOfLading: '',
    destination: '',
    deliveryDate: '',
    lorryNumber: '',
    paymentMade: null,
    pendingAmount: null,
    ...restOverrides,
    rows: overrideRows?.length ? overrideRows : createDefaultRows(),
  };
};

export const getInvoiceFormDataById = (invoiceId?: string): InvoiceFormData => {
  const invoiceSuffix = String(invoiceId ?? '').replace(/[^\d]/g, '');
  const suffix = invoiceSuffix ? Number(invoiceSuffix) : 1001;

  return createDefaultInvoiceData({
    invoiceNumber: invoiceId ?? `INV-${suffix}`,
    billNo: `BILL-${String(suffix).padStart(3, '0')}`,
    receiverName: `Customer ${suffix}`,
    receiverAddress: 'Main Road, GUDIVADA',
    billNumber: String(suffix % 1000),
    date: new Date().toISOString().split('T')[0],
    rows: [
      {
        id: '1',
        description: 'Raw Broken Rice / Damage Rice',
        bags: 0,
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ],
  });
};

interface CreateInvoiceFormProps {
  mode?: 'create' | 'view' | 'edit';
  initialData?: Partial<InvoiceFormData>;
  invoiceId?: string;
  isLoadingInitialData?: boolean;
  initialLoadError?: string | null;
}

export default function CreateInvoiceForm({
  mode = 'create',
  initialData,
  invoiceId,
  isLoadingInitialData = false,
  initialLoadError = null,
}: CreateInvoiceFormProps) {
  const router = useRouter();
  const invoiceShellRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>(() => createDefaultInvoiceData(initialData));

  useEffect(() => {
    setFormData(createDefaultInvoiceData(initialData));
  }, [initialData]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, { quantity?: string; rate?: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const isReadOnly = mode === 'view';
  const isEditable = mode !== 'view';

  const validateInvoiceData = useCallback((data: InvoiceFormData) => {
    const errors: Record<string, string> = {};
    const rowValidationErrors: Record<string, { quantity?: string; rate?: string }> = {};

    if (!data.billNumber.trim()) {
      errors.billNumber = 'Bill Number is required.';
    }

    if (!data.date) {
      errors.date = 'Date is required.';
    }

    if (!data.receiverName.trim()) {
      errors.receiverName = 'Receiver Name is required.';
    }

    if (!data.rows.length) {
      errors.rows = 'At least one item row is required.';
    }

    data.rows.forEach((row) => {
      const rowError: { quantity?: string; rate?: string } = {};

      if (!row.quantity || row.quantity <= 0) {
        rowError.quantity = 'Quantity is required.';
      }

      if (!row.rate || row.rate <= 0) {
        rowError.rate = 'Rate is required.';
      }

      if (Object.keys(rowError).length > 0) {
        rowValidationErrors[row.id] = rowError;
      }
    });

    const totalAmount = calculateTotal(data.rows);
    if (data.paymentMade !== null && data.paymentMade !== undefined && data.paymentMade !== '') {
      const paymentMadeValue = Number(data.paymentMade);
      if (!Number.isFinite(paymentMadeValue) || paymentMadeValue < 0) {
        errors.paymentMade = 'Payment Made must be a valid non-negative number.';
      } else if (paymentMadeValue > totalAmount) {
        errors.paymentMade = 'Payment Made cannot exceed Total Amount.';
      }
    }

    return { errors, rowValidationErrors };
  }, []);

  const updateFormField = useCallback((field: keyof InvoiceFormData, value: string | number) => {
    const normalizedValue =
      field === 'paymentMade'
        ? value === ''
          ? null
          : typeof value === 'string'
            ? (value.trim() === '' ? null : Number(value))
            : Number(value)
        : value;

    setFormData((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const updateRow = useCallback((id: string, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = calculateAmount(
              field === 'quantity' ? Number(value) : updated.quantity,
              field === 'rate' ? Number(value) : updated.rate
            );
          }
          console.log("Updated Row:", updated);
          return updated;
        }
        return row;
      }),
    }));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    const newId = (Math.max(...formData.rows.map((row) => parseInt(row.id, 10) || 0)) + 1).toString();
    setFormData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: newId,
          description: 'Raw Broken Rice / Damage Rice',
          bags: 0,
          quantity: 0,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  }, [formData.rows]);

  const deleteRow = useCallback((id: string) => {
    if (formData.rows.length > 1) {
      setFormData((prev) => ({
        ...prev,
        rows: prev.rows.filter((row) => row.id !== id),
      }));
    }
  }, [formData.rows.length]);

  const handleClearForm = useCallback(() => {
    setFormData(createDefaultInvoiceData());
    setFieldErrors({});
    setRowErrors({});
  }, []);

  const totalAmount = calculateTotal(formData.rows);
  const normalizedPaymentMade =
    formData.paymentMade === null || formData.paymentMade === undefined || formData.paymentMade === ''
      ? null
      : Number(formData.paymentMade);
  const pendingAmountValue =
    normalizedPaymentMade === null || !Number.isFinite(normalizedPaymentMade)
      ? null
      : Math.max(totalAmount - normalizedPaymentMade, 0);
  const shouldShowPendingAmount = normalizedPaymentMade !== null && Number.isFinite(normalizedPaymentMade);
  const invoiceTemplateData = {
    ...formData,
    grandTotal: totalAmount,
    amountInWords: numberToWords(totalAmount),
    paymentMade: normalizedPaymentMade,
    pendingAmount: pendingAmountValue,
    rows: formData.rows,
  };

  useEffect(() => {
    setFieldErrors((prev) => {
      const next = { ...prev };

      if (normalizedPaymentMade === null || !Number.isFinite(normalizedPaymentMade)) {
        delete next.paymentMade;
        return next;
      }

      if (normalizedPaymentMade < 0) {
        next.paymentMade = 'Payment Made must be a valid non-negative number.';
      } else if (normalizedPaymentMade > totalAmount) {
        next.paymentMade = 'Payment Made cannot exceed Total Amount.';
      } else {
        delete next.paymentMade;
      }

      return next;
    });
  }, [normalizedPaymentMade, totalAmount]);

  const handleSave = async () => {
    const validation = validateInvoiceData(formData);

    setFieldErrors(validation.errors);
    setRowErrors(validation.rowValidationErrors);

    if (Object.keys(validation.errors).length > 0 || Object.keys(validation.rowValidationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const isEditMode = mode === 'edit';
      const endpoint = isEditMode && invoiceId ? `/api/invoices/${invoiceId}` : '/api/invoices';
      const paymentPayloadValue =
        formData.paymentMade === null || formData.paymentMade === undefined || formData.paymentMade === ''
          ? null
          : Number(formData.paymentMade);
      const pendingPayloadValue =
        paymentPayloadValue === null ? null : Math.max(totalAmount - paymentPayloadValue, 0);
      const payload = {
        ...formData,
        paymentMade: paymentPayloadValue,
        grandTotal: totalAmount,
        amountInWords: numberToWords(totalAmount),
      } as Record<string, unknown>;

      if (paymentPayloadValue === null) {
        delete payload.pendingAmount;
      } else {
        payload.pendingAmount = pendingPayloadValue;
      }

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setFieldErrors(result.errors || { general: result.message || 'Unable to save invoice.' });
        toast.error(result.message || 'Unable to save invoice.');
        return;
      }

      toast.success(result.message || (isEditMode ? 'Invoice updated successfully.' : 'Invoice saved successfully.'));
      router.push('/admin/invoices');
    } catch (error) {
      console.error('Failed to save invoice:', error);
      toast.error('Unable to save invoice right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    const element = invoiceShellRef.current;

    if (!element) {
      toast.error('The invoice could not be prepared for PDF download.');
      return;
    }

    const invoiceSource = (initialData || formData) as Partial<InvoiceFormData> & {
      grandTotal?: number;
      amountInWords?: string;
      rows?: InvoiceRow[];
      paymentMade?: number | string;
      pendingAmount?: number | string;
    };

    const hasInvoiceContent = Boolean(
      invoiceSource.billNumber ||
        invoiceSource.billNo ||
        invoiceSource.receiverName ||
        invoiceSource.invoiceNumber ||
        invoiceSource.rows?.some((row) => row.quantity || row.rate || row.amount)
    );

    if (!hasInvoiceContent) {
      toast.error('The selected invoice could not be found.');
      return;
    }

    setIsGeneratingPdf(true);

    const originalStyles = {
      width: element.style.width,
      maxWidth: element.style.maxWidth,
      overflow: element.style.overflow,
      position: element.style.position,
      left: element.style.left,
      top: element.style.top,
      zIndex: element.style.zIndex,
      boxSizing: element.style.boxSizing,
      margin: element.style.margin,
      padding: element.style.padding,
    };

    try {
      element.style.width = '810px';
      element.style.padding = '8px';
      element.style.maxWidth = '794px';
      element.style.overflow = 'visible';
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.zIndex = '-9999';
      element.style.boxSizing = 'border-box';
      element.style.margin = '0';

      await new Promise((resolve) => window.setTimeout(resolve, 50));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const finalWidth = imgHeight > pdfHeight ? (pdfHeight * imgWidth) / imgHeight : imgWidth;
      const finalHeight = imgHeight > pdfHeight ? pdfHeight : imgHeight;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, finalWidth, finalHeight);

      const billReference = (invoiceSource.billNumber || invoiceSource.billNo || '000').toString();
      const safeBillReference = billReference.replace(/[^a-zA-Z0-9.-]/g, '_');
      pdf.save(`Invoice_${safeBillReference}.pdf`);
      try {
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'invoice',
            title: 'Invoice PDF Downloaded',
            description: `Invoice ${invoiceSource.billNumber || invoiceSource.billNo || 'unknown'} PDF was downloaded.`,
          }),
        });
      } catch (error) {
        console.error('Failed to log invoice PDF activity:', error);
      }
      toast.success('Invoice PDF downloaded successfully.');
    } catch (error) {
      console.error('Failed to generate invoice PDF:', error);
      toast.error('Unable to generate the invoice PDF right now.');
    } finally {
      element.style.width = originalStyles.width;
      element.style.maxWidth = originalStyles.maxWidth;
      element.style.overflow = originalStyles.overflow;
      element.style.position = originalStyles.position;
      element.style.left = originalStyles.left;
      element.style.top = originalStyles.top;
      element.style.zIndex = originalStyles.zIndex;
      element.style.boxSizing = originalStyles.boxSizing;
      element.style.margin = originalStyles.margin;
      element.style.padding = originalStyles.padding;
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    const invoiceSource = (initialData || formData) as Partial<InvoiceFormData> & {
      grandTotal?: number;
      amountInWords?: string;
      rows?: InvoiceRow[];
      paymentMade?: number | string;
      pendingAmount?: number | string;
    };

    const hasInvoiceContent = Boolean(
      invoiceSource.billNumber ||
        invoiceSource.billNo ||
        invoiceSource.receiverName ||
        invoiceSource.invoiceNumber ||
        invoiceSource.rows?.some((row) => row.quantity || row.rate || row.amount)
    );

    if (!hasInvoiceContent) {
      toast.error('The selected invoice could not be found.');
      return;
    }

    try {
      exportInvoiceToExcel({
        billNumber: invoiceSource.billNumber,
        date: invoiceSource.date,
        receiverName: invoiceSource.receiverName,
        receiverAddress: invoiceSource.receiverAddress,
        receiverGSTIN: invoiceSource.receiverGSTIN,
        billNo: invoiceSource.billNo,
        dispatchedThrough: invoiceSource.dispatchedThrough,
        billOfLading: invoiceSource.billOfLading,
        destination: invoiceSource.destination,
        deliveryDate: invoiceSource.deliveryDate,
        lorryNumber: invoiceSource.lorryNumber,
        grandTotal: invoiceSource.grandTotal || calculateTotal(invoiceSource.rows || []),
        amountInWords: invoiceSource.amountInWords,
        rows: invoiceSource.rows || [],
        paymentMade: invoiceSource.paymentMade,
        pendingAmount: invoiceSource.pendingAmount,
      });
      try {
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'invoice',
            title: 'Invoice Excel Downloaded',
            description: `Invoice ${invoiceSource.billNumber || invoiceSource.billNo || 'unknown'} Excel export was downloaded.`,
          }),
        });
      } catch (error) {
        console.error('Failed to log invoice Excel activity:', error);
      }
      toast.success('Invoice exported to Excel successfully.');
    } catch (error) {
      console.error('Failed to export invoice to Excel:', error);
      toast.error('Unable to export the invoice as Excel right now.');
    }
  };
  

  const isInvoiceLoading = mode === 'view' && (isLoadingInitialData || (initialData === undefined && !initialLoadError));
  const hasLoadError = mode === 'view' && Boolean(initialLoadError);

  if (isInvoiceLoading) {
    return (
      <div className="print-invoice-root min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-800">Preparing invoice…</p>
            <p className="text-sm text-gray-600">Loading the saved invoice details before printing.</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasLoadError) {
    return (
      <div className="print-invoice-root min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-800">Unable to load invoice</p>
            <p className="text-sm text-gray-600">{initialLoadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="print-invoice-root min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push('/admin/invoices')}
          className="print:hidden mb-4 inline-flex w-fit items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-gray-400 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          <span>Back to Invoices</span>
        </button>

        <div ref={invoiceShellRef} className="fixed left-0 top-0 -z-50">
          <InvoiceTemplate data={invoiceTemplateData} parentMode={mode} hideEmptyPaymentSection />
        </div>

        <div className="space-y-6">
          {Object.keys(fieldErrors).length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-semibold">Please fix the highlighted fields before saving.</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <InvoiceTemplate
              data={invoiceTemplateData}
              isEditable={isEditable}
              onFieldChange={updateFormField}
              onRowChange={updateRow}
              onAddRow={addRow}
              onDeleteRow={deleteRow}
              fieldErrors={fieldErrors}
              rowErrors={rowErrors}
              showPaymentTracking={mode === 'create'}
              parentMode={mode}
            />
          </div>

          <div className="print:hidden mt-8 flex justify-center gap-4">
            {isReadOnly ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/invoices/edit/${invoiceId ?? ''}`)}
                  className="rounded bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
                >
                  Edit Invoice
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={isGeneratingPdf}
                  className="rounded bg-[#7F63C7] px-6 py-2 font-semibold text-white transition hover:bg-[#6A4DB3] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGeneratingPdf ? 'Preparing PDF...' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadExcel()}
                  className="rounded bg-[#7F63C7] px-6 py-2 font-semibold text-white transition hover:bg-[#6A4DB3]"
                >
                  Excel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? (mode === 'edit' ? 'Updating...' : 'Saving...') : mode === 'edit' ? 'Update Invoice' : 'Save Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={isGeneratingPdf}
                  className="rounded bg-[#7F63C7] px-6 py-2 font-semibold text-white transition hover:bg-[#6A4DB3] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGeneratingPdf ? 'Preparing PDF...' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadExcel()}
                  className="rounded bg-[#7F63C7] px-6 py-2 font-semibold text-white transition hover:bg-[#6A4DB3]"
                >
                  Excel
                </button>
                {mode === 'create' ? (
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="rounded bg-gray-600 px-6 py-2 font-semibold text-white transition hover:bg-gray-700"
                  >
                    Clear Form
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/admin/invoices')}
                    className="rounded bg-gray-600 px-6 py-2 font-semibold text-white transition hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
