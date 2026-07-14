import React, { forwardRef } from 'react';
import { X } from 'lucide-react';
import { calculateTotal, numberToWords, type InvoiceFormData, type InvoiceRow } from '@/lib/invoiceUtils';
import InvoiceWatermark from '@/components/admin/invoices/InvoiceWatermark';

interface InvoiceTemplateProps {
  data: Partial<InvoiceFormData> & {
    grandTotal?: number;
    amountInWords?: string;
    rows?: InvoiceRow[];
  };
  parentMode?: 'create' | 'edit' | 'view';
  className?: string;
  isEditable?: boolean;
  onFieldChange?: (field: keyof InvoiceFormData, value: string | number) => void;
  onRowChange?: (rowId: string, field: 'description' | 'customDescription' | 'quantity' | 'rate', value: string | number) => void;
  onAddRow?: () => void;
  onDeleteRow?: (rowId: string) => void;
  fieldErrors?: Record<string, string>;
  rowErrors?: Record<string, { quantity?: string; rate?: string }>;
  showPaymentTracking?: boolean;
  hideEmptyPaymentSection?: boolean;
}

const SECTION_BOX_CLASS = 'mb-0 bg-white';
const HEADER_SECTION_CLASS = 'mb-0 bg-white';
const INPUT_CLASS = 'w-full rounded border border-gray-300 px-1 py-1 text-[12px] font-semibold text-gray-800 outline-none focus:border-blue-500';
const EDITABLE_TEXT_CLASS = 'w-full border-0 border-b border-gray-400 bg-transparent px-0 py-0 text-[12px] font-semibold text-gray-800 outline-none focus:border-blue-500';

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({
  data,
  className,
  isEditable = false,
  onFieldChange,
  onRowChange,
  onAddRow,
  onDeleteRow,
  fieldErrors,
  rowErrors,
  showPaymentTracking = false,
  hideEmptyPaymentSection = false,
  parentMode,
}: InvoiceTemplateProps, ref) => {
  const safeRows = data.rows || [];
  const totalAmount = typeof data.grandTotal === 'number' ? data.grandTotal : calculateTotal(safeRows);
  const amountInWords = data.amountInWords || numberToWords(totalAmount);
  const numericPaymentMade =
    data.paymentMade === null || data.paymentMade === undefined || data.paymentMade === ''
      ? null
      : Number(data.paymentMade);
  const hasPaymentMadeValue = numericPaymentMade !== null && Number.isFinite(numericPaymentMade) && numericPaymentMade > 0;
  const paymentMadeValue = hasPaymentMadeValue ? numericPaymentMade : null;
  const pendingAmountValue =
    paymentMadeValue === null || !Number.isFinite(paymentMadeValue)
      ? null
      : totalAmount - paymentMadeValue;
  let shouldShowPaymentDetails = false;

 if (parentMode === 'create') {
    shouldShowPaymentDetails = hideEmptyPaymentSection
        ? hasPaymentMadeValue
        : Boolean(showPaymentTracking);
} else if (parentMode === 'edit') {
    shouldShowPaymentDetails = true;
} else {
    shouldShowPaymentDetails = hasPaymentMadeValue;
}

  const renderValue = (value: string | number | undefined, fallback = '—') => {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    return value;
  };

  const renderFieldError = (field: string) => {
    if (!fieldErrors?.[field]) {
      return null;
    }

    return <p className="mt-1 text-[9px] font-medium text-red-600">{fieldErrors[field]}</p>;
  };

  const formatCurrencyValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return '—';
    }

    return `Rs. ${value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div ref={ref} className={['invoice-print-shell relative overflow-hidden border-[2px] border-black bg-white p-[3mm] text-[15px]', className].filter(Boolean).join(' ')}>
      <InvoiceWatermark />
      <div className="relative z-10">
        <div className={HEADER_SECTION_CLASS}>
          <div className="mb-2 flex items-start justify-between">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden">
              <img
                src="/images/invoice/lakshmi.png"
                alt="Lakshmi logo"
                className="h-full w-full scale-[1.25] object-contain"
              />
            </div>

            <div className="mx-2 min-w-0 flex-1 text-center">
              <div className="mb-2 flex flex-col items-center">
                <span className="inline-flex rounded-full bg-[#1E3A5F] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  BILL OF SUPPLY
                </span>
                <span className="mt-1 text-[11px] font-bold uppercase text-[#4B5563]">
                  CASH / CREDIT
                </span>
              </div>
              <h1 className="mb-1 whitespace-nowrap text-4xl font-bold text-[#1E3A5F]">
                GAYATRI TRADERS
              </h1>
              <p className="text-sm italic text-[#555555]">Prop : S. Suresh</p>
              <p className="mt-1 text-xs text-[#444444]">
                GONGALLAMUDI. Nandivada Mandal. Krishna Dt. A.P
              </p>
            </div>

            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden">
              <img
                src="/images/invoice/ganesha.png"
                alt="Ganesha logo"
                className="h-full w-full scale-[1.25] object-contain"
              />
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between border-t border-black pt-1.5 text-[11px]">
            <div>
              <p className="font-semibold text-[#2F2F2F]">GSTIN : 37APNPS0530F1ZV</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#2F2F2F]">Cell : 9849953672</p>
            </div>
          </div>

          <div className="mt-2 border-t border-black pt-3 pb-1 text-[10px] text-gray-800">
            <div className="invoice-header-info grid grid-cols-4 gap-3 py-1 text-[12px] font-semibold leading-6">
              <div className="invoice-header-cell flex min-h-[28px] items-center justify-center gap-1.5 whitespace-nowrap text-center">
                <span className="font-semibold text-gray-700">Bill No.</span>
                <span className="font-semibold text-gray-700">:</span>
                {isEditable ? (
                  <div className="min-w-0">
                    <input
                      type="text"
                      value={String(data.billNumber ?? '')}
                      onChange={(event) => onFieldChange?.('billNumber', event.target.value)}
                      className={`${EDITABLE_TEXT_CLASS} w-[110px] max-w-[110px]`}
                    />
                    {renderFieldError('billNumber')}
                  </div>
                ) : (
                  <span className="ml-1 min-w-0 font-bold text-gray-800">{renderValue(data.billNumber)}</span>
                )}
              </div>
              <div className="invoice-header-cell flex min-h-[28px] items-center justify-center gap-1.5 whitespace-nowrap text-center">
                <span className="font-semibold text-gray-700">State</span>
                <span className="font-semibold text-gray-700">:</span>
                {isEditable ? (
                  <div className="min-w-0">
                    <input
                      type="text"
                      value={String(data.state ?? '')}
                      onChange={(event) => onFieldChange?.('state', event.target.value)}
                      className={`${EDITABLE_TEXT_CLASS} w-[110px] max-w-[110px]`}
                    />
                    {renderFieldError('state')}
                  </div>
                ) : (
                  <span className="ml-1 min-w-0 font-bold text-gray-800">{renderValue(data.state)}</span>
                )}
              </div>
              <div className="invoice-header-cell flex min-h-[28px] items-center justify-center gap-1.5 whitespace-nowrap text-center">
                <span className="font-semibold text-gray-700">State Code</span>
                <span className="font-semibold text-gray-700">:</span>
                {isEditable ? (
                  <div className="min-w-0">
                    <input
                      type="text"
                      value={String(data.stateCode ?? '')}
                      onChange={(event) => onFieldChange?.('stateCode', event.target.value)}
                      className={`${EDITABLE_TEXT_CLASS} w-[110px] max-w-[110px]`}
                    />
                    {renderFieldError('stateCode')}
                  </div>
                ) : (
                  <span className="ml-1 min-w-0 font-bold text-gray-800">{renderValue(data.stateCode)}</span>
                )}
              </div>
              <div className="invoice-header-cell flex min-h-[28px] items-center justify-center gap-1.5 whitespace-nowrap text-center">
                <span className="font-semibold text-gray-700">Date</span>
                <span className="font-semibold text-gray-700">:</span>
                {isEditable ? (
                  <div className="min-w-0">
                    <input
                      type="date"
                      value={String(data.date ?? '')}
                      onChange={(event) => onFieldChange?.('date', event.target.value)}
                      className={`${EDITABLE_TEXT_CLASS} w-[110px] max-w-[110px]`}
                    />
                    {renderFieldError('date')}
                  </div>
                ) : (
                  <span className="ml-1 min-w-0 font-bold text-gray-800">{renderValue(data.date)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`${SECTION_BOX_CLASS} text-[12px]`}>
          <h2 className="flex min-h-[28px] items-center justify-center border-b border-black bg-white px-3 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-800">
            Details of Receiver (Billed To)
          </h2>
          <div className="grid grid-cols-[1fr_1px_1fr]">
              <div className="space-y-0 p-3">
              <div className="mb-2 flex items-center whitespace-nowrap py-1.5">
                <span className="w-[150px] shrink-0 text-[12px] font-semibold text-gray-700">Name :</span>
                {isEditable ? (
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={String(data.receiverName ?? '')}
                      onChange={(event) => onFieldChange?.('receiverName', event.target.value)}
                      className={`${EDITABLE_TEXT_CLASS} min-w-0 flex-1`}
                    />
                    {renderFieldError('receiverName')}
                  </div>
                ) : (
                  <span className="min-w-0 flex-1 text-[10px] font-semibold text-gray-800">{renderValue(data.receiverName)}</span>
                )}
              </div>

              <div className="mb-2 flex items-center whitespace-nowrap py-1.5">
                <span className="w-[150px] shrink-0 text-[12px] font-semibold text-gray-700">Address :</span>
                {isEditable ? (
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={String(data.receiverAddress ?? '')}
                      onChange={(event) => onFieldChange?.('receiverAddress', event.target.value)}
                      className={`${EDITABLE_TEXT_CLASS} min-w-0 flex-1`}
                    />
                    {renderFieldError('receiverAddress')}
                  </div>
                ) : (
                  <span className="min-w-0 flex-1 text-[10px] text-gray-800">{renderValue(data.receiverAddress)}</span>
                )}
              </div>

              <div className="mb-2 flex items-center whitespace-nowrap py-1.5">
                <span className="w-[150px] shrink-0 text-[12px] font-semibold text-gray-700">GSTIN/UIN :</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={String(data.receiverGSTIN ?? '')}
                    onChange={(event) => onFieldChange?.('receiverGSTIN', event.target.value)}
                    className={`${EDITABLE_TEXT_CLASS} min-w-0 flex-1`}
                  />
                ) : (
                  <span className="min-w-0 flex-1 text-[10px] font-semibold text-gray-800">{renderValue(data.receiverGSTIN)}</span>
                )}
              </div>

              <div className="flex items-center whitespace-nowrap py-1.5">
                <span className="w-[150px] shrink-0 text-[12px] font-semibold text-gray-700">Invoice No. :</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={String(data.invoiceNumber ?? '')}
                    onChange={(event) => onFieldChange?.('invoiceNumber', event.target.value)}
                    className={`${EDITABLE_TEXT_CLASS} min-w-0 flex-1`}
                  />
                ) : (
                  <span className="min-w-0 flex-1 text-[10px] font-semibold text-gray-800">{renderValue(data.invoiceNumber)}</span>
                )}
              </div>
            </div>

            <div className="w-px bg-black" />

            <div className="space-y-0 p-3">
              <div className="flex items-center whitespace-nowrap py-1.5">
                <span className="w-[150px] shrink-0 whitespace-nowrap text-[12px] font-semibold text-gray-700">
                  Bill No. :
                </span>
                {isEditable ? (
                  <input
                    type="text"
                    value={String(data.billNo ?? '')}
                    onChange={(event) => onFieldChange?.('billNo', event.target.value)}
                    className={`${EDITABLE_TEXT_CLASS} min-w-0 flex-1`}
                  />
                ) : (
                  <span className="min-w-0 flex-1 whitespace-nowrap text-[10px] font-semibold text-gray-800">
                    {renderValue(data.billNo)}
                  </span>
                )}
              </div>

              <div className="flex items-center whitespace-nowrap py-1.5">
                <span className="w-[150px] shrink-0 whitespace-nowrap text-[12px] font-semibold text-gray-700">
                  Dispatched Through :
                </span>
                {isEditable ? (
                  <div className="flex min-w-0 flex-1 gap-2">
                    <select
                      value={String(data.dispatchedThrough ?? 'Lorry')}
                      onChange={(event) => onFieldChange?.('dispatchedThrough', event.target.value)}
                      className={`${EDITABLE_TEXT_CLASS} max-w-[90px]`}
                    >
                      <option value="Lorry">Lorry</option>
                      <option value="Other">Other</option>
                    </select>
                    {String(data.dispatchedThrough ?? 'Lorry') === 'Other' ? (
                      <input
                        type="text"
                        value={String(data.customTransport ?? '')}
                        onChange={(event) => onFieldChange?.('customTransport', event.target.value)}
                        className={`${EDITABLE_TEXT_CLASS} min-w-0 flex-1`}
                        placeholder="Custom transport"
                      />
                    ) : null}
                  </div>
                ) : (
                  <span className="min-w-0 flex-1 whitespace-nowrap text-[10px] font-semibold text-gray-800">
                    {renderValue(
                      data.dispatchedThrough === 'Other' && data.customTransport
                        ? data.customTransport
                        : data.dispatchedThrough
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center whitespace-nowrap py-1.5">
                <span className="w-[150px] shrink-0 whitespace-nowrap text-[12px] font-semibold text-gray-700">
                  Bill of Lading / LR No. :
                </span>
                {isEditable ? (
                  <input
                    type="text"
                    value={String(data.billOfLading ?? '')}
                    onChange={(event) => onFieldChange?.('billOfLading', event.target.value)}
                    className={`${EDITABLE_TEXT_CLASS} min-w-0 flex-1`}
                  />
                ) : (
                  <span className="min-w-0 flex-1 whitespace-nowrap text-[10px] font-semibold text-gray-800">
                    {renderValue(data.billOfLading)}
                  </span>
                )}
              </div>

              <div className="flex items-center whitespace-nowrap py-1.5">
                <span className="w-[150px] shrink-0 whitespace-nowrap text-[12px] font-semibold text-gray-700">
                  Destination :
                </span>
                {isEditable ? (
                  <input
                    type="text"
                    value={String(data.destination ?? '')}
                    onChange={(event) => onFieldChange?.('destination', event.target.value)}
                    className={`${EDITABLE_TEXT_CLASS} min-w-0 flex-1`}
                  />
                ) : (
                  <span className="min-w-0 flex-1 whitespace-nowrap text-[10px] font-semibold text-gray-800">
                    {renderValue(data.destination)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`${SECTION_BOX_CLASS} p-0`}>
          <div className="mb-2 flex items-center justify-end px-2 pt-2"></div>
          <div className="overflow-x-auto min-h-[160px] border border-black">
            <table className="w-full border-collapse text-[12px] [&_th:nth-child(3)]:border-l-0 [&_td:nth-child(3)]:border-l-0 [&_input]:!text-[12px] [&_select]:!text-[12px] [&_textarea]:!text-[12px]">
              <thead>
                <tr>
                  <th className="border border-black bg-gray-50 p-1 text-center font-semibold">S.No.</th>
                  <th className="border border-black bg-gray-50 p-1 text-left font-semibold">Description of Goods</th>
                  <th className="border border-black bg-gray-50 p-1 text-center font-semibold">Quantity</th>
                  <th className="border border-black bg-gray-50 p-1 text-center font-semibold">Rate</th>
                  <th className="border border-black bg-gray-50 p-1 text-center font-semibold">Amount</th>
                  <th className="border border-black bg-gray-50 p-1 text-center font-semibold">Rs.</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const firstRow = safeRows[0];

                  if (firstRow) {
                    const quantityError = rowErrors?.[firstRow.id]?.quantity;
                    const rateError = rowErrors?.[firstRow.id]?.rate;

                    return (
                      <>
                        <tr key={firstRow.id}>
                          <td className="border border-black border-b-0 px-1 py-1.5 text-center">1</td>
                          <td className="border border-black border-b-0 px-1 py-1.5 text-left">
                            {isEditable ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={String(firstRow.description ?? '')}
                                  onChange={(event) => onRowChange?.(firstRow.id, 'description', event.target.value)}
                                  className={`${EDITABLE_TEXT_CLASS} w-full`}
                                />
                                {String(firstRow.description ?? '').toLowerCase() === 'other' ? (
                                  <input
                                    type="text"
                                    value={String(firstRow.customDescription ?? '')}
                                    onChange={(event) => onRowChange?.(firstRow.id, 'customDescription', event.target.value)}
                                    className={`${INPUT_CLASS} w-full`}
                                    placeholder="Custom description"
                                  />
                                ) : null}
                              </div>
                            ) : (
                              <div className="text-[10px] font-semibold text-gray-800">
                                {firstRow.description === 'Other' && firstRow.customDescription ? firstRow.customDescription : firstRow.description}
                              </div>
                            )}
                          </td>
                          <td className="border border-black border-b-0 px-1 py-1.5 text-center">
                            {isEditable ? (
                              <div>
                                <input
                                  type="number"
                                  value={firstRow.quantity || ''}
                                  onChange={(event) => onRowChange?.(firstRow.id, 'quantity', parseFloat(event.target.value) || 0)}
                                  className={`${EDITABLE_TEXT_CLASS} w-[110px] text-center`}
                                />
                                {quantityError ? <p className="mt-1 text-[9px] font-medium text-red-600">{quantityError}</p> : null}
                              </div>
                            ) : (
                              <div className="text-[10px] font-semibold text-gray-800">{firstRow.quantity}</div>
                            )}
                          </td>
                          <td className="border border-black border-b-0 px-1 py-1.5 text-center">
                            {isEditable ? (
                              <div>
                                <input
                                  type="number"
                                  value={firstRow.rate || ''}
                                  onChange={(event) => onRowChange?.(firstRow.id, 'rate', parseFloat(event.target.value) || 0)}
                                  className={`${EDITABLE_TEXT_CLASS} w-[110px] text-center`}
                                />
                                {rateError ? <p className="mt-1 text-[9px] font-medium text-red-600">{rateError}</p> : null}
                              </div>
                            ) : (
                              <div className="text-[10px] font-semibold text-gray-800">{firstRow.rate}</div>
                            )}
                          </td>
                          <td className="border border-black border-b-0 px-1 py-1.5 text-center font-semibold">
                            <div className="text-[10px] font-semibold text-gray-800">{firstRow.amount.toLocaleString('en-IN')}</div>
                          </td>
                          <td className="border border-black border-b-0 px-1 py-1.5 text-center">-
                          </td>
                        </tr>

                        <tr>
                          <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                          <td className="border border-black px-1 py-1.5 border-t-0">
                            <div className="h-[160px] w-full">&nbsp;</div>
                          </td>
                          <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                          <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                          <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                          <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                        </tr>
                      </>
                    );
                  }

                  return (
                    <tr>
                      <td className="border border-black px-1 py-1.5 text-center">1</td>
                      <td className="border border-black px-1 py-1.5 border-t-0">
                        <div className="h-[160px] w-full">&nbsp;</div>
                      </td>
                      <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                      <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                      <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                      <td className="border border-black px-1 py-1.5 border-t-0">&nbsp;</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${SECTION_BOX_CLASS} border border-black text-[12px]`}>
          <div className="space-y-1.5 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-gray-700">Total Amount :</span>
              <span className="text-[12px] font-bold text-gray-800">{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] font-semibold text-gray-700">Total Invoice Amount in Words :</div>
              <div className="flex-1 text-right text-[12px] font-semibold text-gray-800">{amountInWords}</div>
            </div>
          </div>
        </div>

        {shouldShowPaymentDetails ? (
          <div className={`${SECTION_BOX_CLASS} border border-black text-[12px]`}>
            <div className="space-y-2 p-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold text-gray-700">Payment Made :</span>
                {isEditable ? (
                  <div className="w-[140px]">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={data.paymentMade ?? ''}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        onFieldChange?.('paymentMade', nextValue === '' ? '' : parseFloat(nextValue));
                      }}
                      className={`${INPUT_CLASS} w-full text-right`}
                      placeholder="0"
                    />
                    {renderFieldError('paymentMade')}
                  </div>
                ) : (
                  <span className="text-[12px] font-semibold text-gray-800">{formatCurrencyValue(paymentMadeValue)}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold text-gray-700">Pending Amount :</span>
                <span className="text-[12px] font-semibold text-gray-800">{formatCurrencyValue(pendingAmountValue)}</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className={`${SECTION_BOX_CLASS} border border-black text-[12px]`}>
          <div className="grid grid-cols-[1fr_1px_1fr]">
            <div className="p-2.5">
              <div className="flex items-center gap-2">
                <span className="w-24 text-[12px] font-semibold text-gray-700">Delivery Date :</span>
                {isEditable ? (
                  <input
                    type="date"
                    value={String(data.deliveryDate ?? '')}
                    onChange={(event) => onFieldChange?.('deliveryDate', event.target.value)}
                    className={`${INPUT_CLASS} flex-1`}
                  />
                ) : (
                  <span className="flex-1 text-[12px] font-semibold text-gray-800">{renderValue(data.deliveryDate)}</span>
                )}
              </div>
            </div>
            <div className="w-px bg-black" />
            <div className="p-2.5">
              <div className="flex items-center gap-2">
                <span className="w-24 text-[12px] font-semibold text-gray-700">Lorry Number :</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={String(data.lorryNumber ?? '')}
                    onChange={(event) => onFieldChange?.('lorryNumber', event.target.value)}
                    className={`${INPUT_CLASS} flex-1`}
                  />
                ) : (
                  <span className="flex-1 text-[12px] font-semibold text-gray-800">{renderValue(data.lorryNumber)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`${SECTION_BOX_CLASS} border border-black text-[12px]`}>
          <div className="grid grid-cols-[1fr_1px_1fr]">
            <div className="space-y-1 p-2.5">
              <h3 className="text-[12px] font-bold text-gray-800">Bank Details</h3>
              <p className="text-[12px] text-gray-700">
                <span className="font-semibold">Punjab National Bank,</span> GUDIVADA.
              </p>
              <p className="text-[12px] text-gray-700">
                <span className="font-semibold">Bank Account No :</span> <span className="font-mono">00383093000000011</span>
              </p>
              <p className="text-[12px] text-gray-700">
                <span className="font-semibold">IFS Code :</span> <span className="font-mono">PUNB0003830</span>
              </p>
            </div>
            <div className="w-px bg-black" />
            <div className="space-y-1.5 p-2.5">
              <p className="text-justify text-[10px] text-gray-700">Certified that the particulars given above are True and Correct.</p>
              <p className="text-[10px] font-semibold italic text-gray-700">For: Gayatri Traders.</p>
              <div className="mt-4 flex flex-col items-center">
                <div className="h-8 w-full" />
                <div className="w-56 border-t border-black" />
                <p className="mt-1 text-[10px] text-gray-700">Authorised Signatory.</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${SECTION_BOX_CLASS} border border-black p-2.5 text-[12px]`}>
          <h3 className="mb-1 text-[12px] font-bold text-gray-800">Terms & Conditions :</h3>
          <ol className="ml-4 list-decimal space-y-0.5 text-[12px] text-gray-700">
            <li>Goods once sold cannot be taken back.</li>
            <li>All disputes are subject to Gudivada Jurisdiction.</li>
          </ol>
        </div>
      </div>
    </div>
  );
});

export default InvoiceTemplate;