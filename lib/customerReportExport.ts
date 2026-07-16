import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export interface CustomerSummaryData {
  customerName: string;
  gstNumber: string;
  address: string;
  totalInvoices: number;
  totalPurchaseAmount: string;
  lastPurchaseDate: string;
}

export interface CustomerInvoiceExportRow {
  id: string;
  invoiceNumber: string;
  billNumber?: string | null;
  invoiceDate: string;
  products: string;
  bags: string;
  quantity: string;
rate: string;
  invoiceAmount: string;
  paymentMade?: string | null;
  pendingAmount?: string | null;
  runningTotal: string;
  date?: string | null;
  grandTotal?: number | string | null;
}

export interface CustomerReportExportPayload {
  customer: CustomerSummaryData;
  invoices: CustomerInvoiceExportRow[];
}

function formatDateForExport(value?: string | null) {
  if (!value) {
    return '—';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeText(value?: string | null) {
  return value ? String(value).trim() : '—';
}

function parseAmountToNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const normalizedValue = String(value).trim();
  if (normalizedValue === '—') {
    return '';
  }

  const numericValue = Number(normalizedValue.replace(/[^\d.-]/g, ''));

  return Number.isFinite(numericValue) ? numericValue : '';
}

function toExcelDate(value?: string | null) {
  if (!value) {
    return '';
  }

  const normalizedValue = String(value).trim();
  if (normalizedValue === '—') {
    return '';
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue;
  }

  return parsedDate;
}

function formatCurrencyForPdf(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return 'Rs. 0.00';
  }

  const normalizedValue = String(value).trim();

  if (normalizedValue === '—') {
    return 'Rs. 0.00';
  }

  // If it's already formatted like "Rs. 5,999.00", don't format it again.
  if (normalizedValue.startsWith('Rs.')) {
    return normalizedValue;
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue)) {
    return normalizedValue;
  }

  return `Rs. ${numericValue.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function parseCurrency(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const cleaned = String(value)
    .replace('Rs.', '')
    .replace(/,/g, '')
    .trim();

  const numeric = Number(cleaned);

  return Number.isFinite(numeric) ? numeric : null;
}
function formatPaymentValueForIndividualPdf(value?: string | number | null, paymentMadeValue?: string | number | null) {
  const hasPayment =
    paymentMadeValue !== null &&
    paymentMadeValue !== undefined &&
    paymentMadeValue !== '' &&
    String(paymentMadeValue).trim() !== '—' &&
    parseCurrency(paymentMadeValue)! > 0;

  if (!hasPayment) {
    return '-';
  }

  if (value === null || value === undefined || value === '' || String(value).trim() === '—') {
    return '-';
  }

  const numericValue = parseCurrency(value);
  if (numericValue === null) {
  return '--';
  }

  return formatCurrencyForPdf(numericValue);
}

function formatPaymentColumnValue(value?: string | number | null, paymentMadeValue?: string | number | null) {
  const hasPayment = paymentMadeValue !== null && paymentMadeValue !== undefined && paymentMadeValue !== '' && parseCurrency(paymentMadeValue)! > 0;;

  if (!hasPayment) {
    return '--';
  }

  if (value === null || value === undefined || value === '' || String(value).trim() === '—') {
    return '--';
  }

  return String(value).trim();
}

function loadPdfImageDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(null);
          return;
        }
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function getWrappedTextLines(pdf: jsPDF, text: string, maxWidth: number) {
  return pdf.splitTextToSize(String(text), maxWidth);
}

function printWrappedTextBlock(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  pageHeight: number,
  footerHeight: number,
  lineHeight: number,
  headerBottom: number,
) {
  const lines = getWrappedTextLines(pdf, text, maxWidth);
  let currentY = y;

  lines.forEach((line: string) => {
    if (currentY > pageHeight - footerHeight - 8) {
      pdf.addPage();
      currentY = headerBottom;
    }
    pdf.text(line, x, currentY);
    currentY += lineHeight;
  });

  return currentY;
}

function drawPageWatermark(pdf: jsPDF, pageWidth: number, pageHeight: number, watermarkDataUrl?: string | null) {
  if (!watermarkDataUrl) {
    return;
  }

  const watermarkWidth = 92;
  const watermarkHeight = 92;
  const x = (pageWidth - watermarkWidth) / 2;
  const y = (pageHeight - watermarkHeight) / 2;

  pdf.saveGraphicsState();
  const gState = new (pdf as any).GState({ opacity: 0.06 });
  pdf.setGState(gState);
  pdf.addImage(watermarkDataUrl, 'PNG', x, y, watermarkWidth, watermarkHeight);
  pdf.restoreGraphicsState();
}

function renderReportHeader(
  pdf: jsPDF,
  pageWidth: number,
  margin: number,
  title: string,
  leftLogo?: string | null,
  rightLogo?: string | null,
) {
  const headerTop = 16;
  const logoSize = 22;

  if (leftLogo) {
    pdf.addImage(leftLogo, 'PNG', margin, headerTop, logoSize, logoSize);
  }
  if (rightLogo) {
    pdf.addImage(rightLogo, 'PNG', pageWidth - margin - logoSize, headerTop, logoSize, logoSize);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(30, 58, 95);
  pdf.text('GAYATRI TRADERS', pageWidth / 2, headerTop + 8, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  const infoLines = [
    'Prop. S. Suresh',
    'GONGALLAMUDI. Nandivada Mandal. Krishna Dt. A.P.',
    'GSTIN: 37APNPS0530F1ZV',
    'Mobile: 9849953672',
  ];
  infoLines.forEach((line, index) => {
    pdf.text(line, pageWidth / 2, headerTop + 14 + index * 5.3, { align: 'center' });
  });

  const lineY = headerTop + 38;
  pdf.setDrawColor(30, 58, 95);
  pdf.setLineWidth(0.8);
  pdf.line(margin, lineY, pageWidth - margin, lineY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(30, 58, 95);
  pdf.text(title, pageWidth / 2, lineY + 10, { align: 'center' });

  return lineY + 14;
}

function renderReportFooter(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  pageIndex: number,
  totalPages: number,
  generatedAt: string,
  totalCustomers?: number,
) {
  const footerTop = pageHeight - 30;
  pdf.setDrawColor(201, 209, 217);
  pdf.setLineWidth(0.4);
  pdf.line(margin, footerTop, pageWidth - margin, footerTop);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text(`Generated: ${generatedAt}`, margin, footerTop + 5);
  if (typeof totalCustomers === 'number') {
    pdf.text(`Total Customers Included: ${totalCustomers}`, margin, footerTop + 10);
  }

  pdf.text(
    'This is a system-generated report from Gayatri Traders Invoice Management System.',
    margin,
    footerTop + 15,
  );
  pdf.text(`Page ${pageIndex} of ${totalPages}`, pageWidth - margin, footerTop + 15, { align: 'right' });
}

export async function exportAllCustomerReportsToPDF(customerReports: CustomerReportExportPayload[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const headerBottom = 74;
  const footerHeight = 34;
  const totalCustomers = customerReports.length;
  const generatedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const title = 'Customer Reports - Consolidated PDF';

  const logoLeft = await loadPdfImageDataUrl('/images/invoice/lakshmi.png');
  const logoRight = await loadPdfImageDataUrl('/images/invoice/ganesha.png');
  const watermarkDataUrl = await loadPdfImageDataUrl('/images/invoice/watermark.png');

  let yPosition = headerBottom;

  const addCustomerSection = (customerReport: CustomerReportExportPayload, index: number) => {
    if (yPosition > pageHeight - footerHeight - 24) {
      pdf.addPage();
      yPosition = headerBottom;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(30, 58, 95);
    pdf.text(`${index + 1}. ${normalizeText(customerReport.customer.customerName)}`, margin, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(33, 37, 49);
    const summaryItems = [
      { label: 'Customer Name', value: normalizeText(customerReport.customer.customerName) },
      { label: 'GST Number', value: normalizeText(customerReport.customer.gstNumber) },
      { label: 'Address', value: normalizeText(customerReport.customer.address) },
      { label: 'Total Number of Invoices', value: String(customerReport.customer.totalInvoices) },
      { label: 'Total Purchase Amount', value: formatCurrencyForPdf(customerReport.customer.totalPurchaseAmount) },
      { label: 'Last Purchase Date', value: normalizeText(customerReport.customer.lastPurchaseDate) },
    ];

    summaryItems.forEach((item) => {
      yPosition = printWrappedTextBlock(
        pdf,
        `${item.label}: ${item.value}`,
        margin,
        yPosition,
        pageWidth - margin * 2,
        pageHeight,
        footerHeight,
        5.1,
        headerBottom,
      );
    });

    yPosition += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Invoice History', margin, yPosition);
    yPosition += 6;

    if (customerReport.invoices.length === 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('No invoices available for this customer.', margin, yPosition);
      yPosition += 10;
      return;
    }const headers = [
  'Invoice No.',
  'Invoice Date',
  'Products',
  'HSN ACS',
  'No. of Bags',
  'Weight',
  'Rate',
  'Amount',
  'Payment Made',
  'Pending Amount'
];

const columnWidths = [
  18,
  20,
  34,
  16,
  16,
  14,
  14,
  18,
  20,
  20
];
const headerHeight = 8.2;
const cellPadding = 1.5;
const textAlignments = [
  'center',
  'center',
  'left',
  'center',
  'center',
  'right',
  'right',
  'right',
  'right',
  'right'
];
    let currentX = margin;

    const drawTableHeader = () => {
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(176, 183, 193);
      pdf.setLineWidth(0.2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(0, 0, 0);

      headers.forEach((header, headerIndex) => {
        const width = columnWidths[headerIndex];
        pdf.rect(currentX, yPosition, width, headerHeight, 'S');
        const textLines = getWrappedTextLines(pdf, header, width - cellPadding * 2);
        const textX = currentX + width / 2;
        const textY = yPosition + headerHeight / 2 + 0.35;
        pdf.text(textLines, textX, textY, { align: 'center' });
        currentX += width;
      });
    };

    const drawTableRow = (rowValues: string[], _rowIndex: number) => {
      const rowHeight = Math.max(
        8.2,
        ...rowValues.map((value, colIndex) => {
          const wrappedText = getWrappedTextLines(pdf, String(value), columnWidths[colIndex] - cellPadding * 2);
          return 4.8 + wrappedText.length * 3.1;
        }),
      );

      if (yPosition + rowHeight > pageHeight - footerHeight) {
        pdf.addPage();
        yPosition = headerBottom;
        currentX = margin;
        drawTableHeader();
        yPosition += headerHeight;
      }

      currentX = margin;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.9);
      pdf.setTextColor(31, 41, 55);

      rowValues.forEach((value, colIndex) => {
        const width = columnWidths[colIndex];
        const displayValue = colIndex >= 5 ? String(value).replace(/\s+/g, ' ') : String(value);
        const wrappedText = getWrappedTextLines(pdf, displayValue, width - cellPadding * 2);

        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(192, 200, 209);
        pdf.setLineWidth(0.14);
        pdf.rect(currentX, yPosition, width, rowHeight, 'S');

        const textX =
          textAlignments[colIndex] === 'right'
            ? currentX + width - cellPadding
            : textAlignments[colIndex] === 'center'
              ? currentX + width / 2
              : currentX + cellPadding;
        const textY = yPosition + 2.2 + Math.max(0, wrappedText.length - 1) * 1.5;

        if (colIndex >= 5) {
          pdf.text(wrappedText, currentX + width - cellPadding, textY, { align: 'right' });
        } else {
          pdf.text(wrappedText, textX, textY, { align: textAlignments[colIndex] as 'left' | 'center' | 'right' });
        }

        currentX += width;
      });

      yPosition += rowHeight;
    };

    drawTableHeader();
    yPosition += headerHeight;

    customerReport.invoices.forEach((invoice, invoiceIndex) => {
      console.log("Global PDF Invoice:", invoice);
     const rowValues = [
  normalizeText(invoice.invoiceNumber),
   formatDateForExport(invoice.date || invoice.invoiceDate),

  normalizeText(invoice.products),

  '1006400',

  normalizeText(invoice.bags),

  normalizeText(invoice.quantity),

  normalizeText(invoice.rate),

  formatCurrencyForPdf(invoice.invoiceAmount),

  formatPaymentValueForIndividualPdf(
    invoice.paymentMade,
    invoice.paymentMade
  ),

  formatPaymentValueForIndividualPdf(
    invoice.pendingAmount,
    invoice.paymentMade
  ),
];

      drawTableRow(rowValues, invoiceIndex);
    });

    yPosition += 8;
  };

  customerReports.forEach(addCustomerSection);

  const totalPages = pdf.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
    pdf.setPage(pageIndex);
    drawPageWatermark(pdf, pageWidth, pageHeight, watermarkDataUrl);
    renderReportHeader(pdf, pageWidth, margin, title, logoLeft, logoRight);
    renderReportFooter(pdf, pageWidth, pageHeight, margin, pageIndex, totalPages, generatedAt, totalCustomers);
  }

  pdf.save('all_customer_reports.pdf');
}

export function exportAllCustomerReportsToExcel(customerReports: CustomerReportExportPayload[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const rows: Array<Array<string | number | Date>> = [];
  rows.push(['GAYATRI TRADERS']);
  rows.push(['Customer Reports - Consolidated Excel Export']);
  rows.push([]);
rows.push([
  'Customer Name',
  'GST Number',
  'Address',
  'Total Number of Invoices',
  'Total Purchase Amount',
  'Last Purchase Date',
  'Invoice Number',
  'Invoice Date',
  'Product(s)',
  'HSN ACS',
  'No. of Bags',
  'Weight',
  'Rate',
  'Invoice Amount',
  'Payment Made',
  'Pending Amount',
]);

  customerReports.forEach((customerReport) => {
    if (customerReport.invoices.length === 0) {
     rows.push([
  normalizeText(customerReport.customer.customerName),
  normalizeText(customerReport.customer.gstNumber),
  normalizeText(customerReport.customer.address),
  customerReport.customer.totalInvoices,
  parseAmountToNumber(customerReport.customer.totalPurchaseAmount),
  toExcelDate(customerReport.customer.lastPurchaseDate),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
]);
      return;
    }

    customerReport.invoices.forEach((invoice) => {
      
      rows.push([
  normalizeText(customerReport.customer.customerName),
  normalizeText(customerReport.customer.gstNumber),
  normalizeText(customerReport.customer.address),
  customerReport.customer.totalInvoices,
  parseAmountToNumber(customerReport.customer.totalPurchaseAmount),
  toExcelDate(customerReport.customer.lastPurchaseDate),

  normalizeText(invoice.invoiceNumber),
  toExcelDate(invoice.date || invoice.invoiceDate),

  normalizeText(invoice.products),

  '1006400',

  normalizeText(invoice.bags),

  normalizeText(invoice.quantity),

  normalizeText(invoice.rate),

  normalizeText(invoice.invoiceAmount),

  normalizeText(invoice.paymentMade),

  normalizeText(invoice.pendingAmount),
]);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
 worksheet['!cols'] = [
  { wch: 22 }, // Customer Name
  { wch: 22 }, // GST Number
  { wch: 35 }, // Address
  { wch: 18 }, // Total Invoices
  { wch: 22 }, // Total Purchase
  { wch: 18 }, // Last Purchase
  { wch: 15 }, // Invoice Number
  { wch: 18 }, // Invoice Date
  { wch: 38 }, // Products
  { wch: 12 }, // HSN ACS
  { wch: 12 }, // No. of Bags
  { wch: 12 }, // Weight
  { wch: 12 }, // Rate
  { wch: 20 }, // Invoice Amount
  { wch: 20 }, // Payment Made
  { wch: 20 }, // Pending Amount
];
  const workbook = XLSX.utils.book_new();


  const headerRowIndex = 3;
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FF2F3340' } },
    fill: { fgColor: { rgb: 'FFF3ECFF' }, patternType: 'solid' },
    alignment: { vertical: 'center' },
  };
for (let columnIndex = 0; columnIndex < 16; columnIndex += 1) {
    const headerCellRef = XLSX.utils.encode_cell({ c: columnIndex, r: headerRowIndex });
    const headerCell = worksheet[headerCellRef];
    if (headerCell) {
      headerCell.s = headerStyle;
    }
  }

  const currencyColumns = [4, 13, 14, 15];
  const dateColumns = [5, 7];

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    currencyColumns.forEach((columnIndex) => {
      const cellRef = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
      const cell = worksheet[cellRef];
      if (cell) {
        cell.z = '₹ #,##0.00';
      }
    });

    dateColumns.forEach((columnIndex) => {
      const cellRef = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
      const cell = worksheet[cellRef];
      if (cell && cell.v instanceof Date) {
        cell.z = 'dd-mmm-yyyy';
      }
    });
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Reports');
  XLSX.writeFile(workbook, 'all_customer_reports.xlsx');
}

export async function exportCustomerReportToPDF({ customer, invoices }: CustomerReportExportPayload) {
  console.log("PDF invoices:", invoices);
  if (typeof window === 'undefined') {
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const headerBottom = 74;
  const footerHeight = 34;
  const generatedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const title = 'Customer Purchase History Report';
  const logoLeft = await loadPdfImageDataUrl('/images/invoice/lakshmi.png');
  const logoRight = await loadPdfImageDataUrl('/images/invoice/ganesha.png');

  let yPosition = headerBottom;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(30, 58, 95);
  pdf.text('Customer Details', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(33, 37, 49);
  const customerLines = [
    `Customer Name: ${normalizeText(customer.customerName)}`,
    `GST Number: ${normalizeText(customer.gstNumber)}`,
    `Address: ${normalizeText(customer.address)}`,
    `Total Number of Invoices: ${customer.totalInvoices}`,
    `Total Purchase Amount: ${formatCurrencyForPdf(customer.totalPurchaseAmount)}`,
    `Last Purchase Date: ${normalizeText(customer.lastPurchaseDate)}`,
  ];

  customerLines.forEach((line) => {
    yPosition = printWrappedTextBlock(
      pdf,
      line,
      margin,
      yPosition,
      pageWidth - margin * 2,
      pageHeight,
      footerHeight,
      5.1,
      headerBottom,
    );
  });

  yPosition += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 58, 95);
  pdf.text('Invoice History', margin, yPosition);
  yPosition += 7;

  const headers = [
  'Invoice No.',
  'Invoice Date',
  'Products',
  'HSN ACS',
  'No. of Bags',
  'Weight',
  'Rate',
  'Amount',
  'Payment Made',
  'Pending Amount'
];
 const columnWidths = [
  18,
  20,
  34,
  16,
  16,
  14,
  14,
  18,
  20,
  20
];
  const headerHeight = 8.2;
  const cellPadding = 1.5;
  const textAlignments = ['center', 'center', 'center', 'left', 'center', 'right', 'right', 'right', 'right'];
  let currentX = margin;

  const drawTableHeader = () => {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(176, 183, 193);
    pdf.setLineWidth(0.2);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.2);
    pdf.setTextColor(0, 0, 0);

    headers.forEach((header, index) => {
      const width = columnWidths[index];
      pdf.rect(currentX, yPosition, width, headerHeight, 'S');
      const textLines = getWrappedTextLines(pdf, header, width - cellPadding * 2);
      const textX = currentX + width / 2;
      const textY = yPosition + headerHeight / 2 + 0.35;
      pdf.text(textLines, textX, textY, { align: 'center' });
      currentX += width;
    });
  };

  drawTableHeader();
  yPosition += headerHeight;

  invoices.forEach((invoice) => {
    const rowValues = [
  normalizeText(invoice.invoiceNumber),

  formatDateForExport(invoice.date || invoice.invoiceDate),

  normalizeText(invoice.products),

  '1006400',

  normalizeText(invoice.bags),

  normalizeText(invoice.quantity),

  normalizeText(invoice.rate),

  formatCurrencyForPdf(invoice.invoiceAmount),

  formatPaymentValueForIndividualPdf(
    invoice.paymentMade,
    invoice.paymentMade
  ),

  formatPaymentValueForIndividualPdf(
    invoice.pendingAmount,
    invoice.paymentMade
  ),
];
    const rowHeight = Math.max(
      8.2,
      ...rowValues.map((value, index) => {
        const wrappedText = getWrappedTextLines(pdf, String(value), columnWidths[index] - cellPadding * 2);
        return 4.8 + wrappedText.length * 3.1;
      }),
    );

    if (yPosition + rowHeight > pageHeight - footerHeight) {
      pdf.addPage();
      yPosition = headerBottom;
      currentX = margin;
      drawTableHeader();
      yPosition += headerHeight;
    }

    currentX = margin;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.9);
    pdf.setTextColor(31, 41, 55);
    rowValues.forEach((value, index) => {
      const width = columnWidths[index];
      const wrappedText = getWrappedTextLines(pdf, String(value), width - cellPadding * 2);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(192, 200, 209);
      pdf.setLineWidth(0.14);
      pdf.rect(currentX, yPosition, width, rowHeight, 'S');

      const textX =
        textAlignments[index] === 'right'
          ? currentX + width - cellPadding
          : textAlignments[index] === 'center'
            ? currentX + width / 2
            : currentX + cellPadding;
      const textY = yPosition + 2.2 + Math.max(0, wrappedText.length - 1) * 1.5;
      pdf.text(wrappedText, textX, textY, { align: textAlignments[index] as 'left' | 'center' | 'right' });
      currentX += width;
    });
    yPosition += rowHeight;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
    pdf.setPage(pageIndex);
    renderReportHeader(pdf, pageWidth, margin, title, logoLeft, logoRight);
    renderReportFooter(pdf, pageWidth, pageHeight, margin, pageIndex, totalPages, generatedAt);
  }

  const safeCustomerName = normalizeText(customer.customerName).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  pdf.save(`customer_report_${safeCustomerName}.pdf`);
}

export function exportCustomerReportToExcel({ customer, invoices }: CustomerReportExportPayload) {
  if (typeof window === 'undefined') {
    return;
  }

  const rows: Array<Array<string | number>> = [];
  rows.push(['GAYATRI TRADERS']);
  rows.push(['Customer Purchase History Report']);
  rows.push([]);
  rows.push(['Customer Name', normalizeText(customer.customerName)]);
  rows.push(['GST Number', normalizeText(customer.gstNumber)]);
  rows.push(['Address', normalizeText(customer.address)]);
  rows.push(['Total Number of Invoices', customer.totalInvoices]);
  rows.push(['Total Purchase Amount', normalizeText(customer.totalPurchaseAmount)]);
  rows.push(['Last Purchase Date', normalizeText(customer.lastPurchaseDate)]);
  rows.push([]);
  rows.push(['Invoice History']);
  rows.push([
  'Invoice Number',
  'Invoice Date',
  'Product(s)',
  'HSN ACS',
  'No. of Bags',
  'Weight',
  'Rate',
  'Invoice Amount',
  'Payment Made',
  'Pending Amount',
]);

  invoices.forEach((invoice) => {
    rows.push([
  normalizeText(invoice.invoiceNumber),

  formatDateForExport(invoice.date || invoice.invoiceDate),

  normalizeText(invoice.products),

  '1006400',

  normalizeText(invoice.bags),

  normalizeText(invoice.quantity),

  normalizeText(invoice.rate),

  normalizeText(invoice.invoiceAmount),

  normalizeText(invoice.paymentMade),

  normalizeText(invoice.pendingAmount),
]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
 worksheet['!cols'] = [
  { wch: 15 }, // Invoice Number
  { wch: 16 }, // Invoice Date
  { wch: 35 }, // Product
  { wch: 12 }, // HSN
  { wch: 12 }, // Bags
  { wch: 12 }, // Weight
  { wch: 12 }, // Rate
  { wch: 18 }, // Amount
  { wch: 18 }, // Payment Made
  { wch: 18 }, // Pending Amount
];
worksheet['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Report');

  const safeCustomerName = normalizeText(customer.customerName).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  XLSX.writeFile(workbook, `customer_report_${safeCustomerName}.xlsx`);
}
