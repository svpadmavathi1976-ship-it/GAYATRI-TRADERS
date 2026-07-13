import * as XLSX from 'xlsx';

interface ExcelInvoiceRow {
  description?: string;
  quantity?: number | string;
  rate?: number | string;
  amount?: number | string;
}

export interface ExcelInvoiceData {
  id?: string;
  billNumber?: string;
  date?: string;
  state?: string;
  stateCode?: string;
  receiverName?: string;
  receiverAddress?: string;
  receiverGSTIN?: string;
  invoiceNumber?: string;
  billNo?: string;
  dispatchedThrough?: string;
  customTransport?: string;
  billOfLading?: string;
  destination?: string;
  deliveryDate?: string;
  lorryNumber?: string;
  grandTotal?: number | string;
  amountInWords?: string;
  rows?: ExcelInvoiceRow[];
  paymentMade?: number | string;
  pendingAmount?: number | string;
}

function formatExcelDate(value?: string) {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrencyValue(value?: number | string) {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (numericValue === undefined || numericValue === null || Number.isNaN(numericValue)) {
    return 0;
  }
  return numericValue;
}

function createCell(value: string | number, style?: XLSX.CellObject['s']) {
  return {
    v: value,
    s: style,
  };
}

function applyHeaderStyle(cell: XLSX.CellObject) {
  cell.s = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '7F63C7' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D8CFF4' } },
      bottom: { style: 'thin', color: { rgb: 'D8CFF4' } },
      left: { style: 'thin', color: { rgb: 'D8CFF4' } },
      right: { style: 'thin', color: { rgb: 'D8CFF4' } },
    },
  };
}

function applyTitleStyle(cell: XLSX.CellObject) {
  cell.s = {
    font: { bold: true, sz: 16, color: { rgb: '2F3340' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
}

function applySectionStyle(cell: XLSX.CellObject) {
  cell.s = {
    font: { bold: true, color: { rgb: '2F3340' } },
    fill: { fgColor: { rgb: 'F5EEFF' } },
  };
}

function autoFitColumns(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Array<Array<string | number>>;
  const columnCount = Math.max(1, ...(rows.map((row) => row.length)));
  const widths: Array<{ width: number }> = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const maxLength = rows.reduce((max, row) => {
      const value = row[columnIndex];
      if (value === undefined || value === null) {
        return max;
      }
      return Math.max(max, String(value).length);
    }, 10);

    widths.push({ width: Math.min(40, Math.max(12, Math.ceil(maxLength * 1.2))) });
  }

  sheet['!cols'] = widths;
}

export function exportInvoiceToExcel(invoice: ExcelInvoiceData) {
  if (typeof window === 'undefined') {
    return;
  }

  const billNumber = invoice.billNumber || invoice.billNo || invoice.invoiceNumber || invoice.id || 'invoice';
  const fileName = `Invoice_${billNumber}.xlsx`;

  const rows: Array<Array<string | number | undefined>> = [];

  rows.push([`GAYATRI TRADERS`]);
  rows.push(['Invoice Export']);
  rows.push([]);
  rows.push(['Bill Number', invoice.billNumber || invoice.billNo || '-']);
  rows.push(['Invoice Date', formatExcelDate(invoice.date)]);
  rows.push(['Customer Name', invoice.receiverName || '-']);
  rows.push(['Address', invoice.receiverAddress || '-']);
  rows.push(['GSTIN/UIN', invoice.receiverGSTIN || '-']);
  rows.push(['Dispatch Through', invoice.dispatchedThrough || '-']);
  rows.push(['Bill of Lading / LR No.', invoice.billOfLading || '-']);
  rows.push(['Destination', invoice.destination || '-']);
  rows.push(['Delivery Date', formatExcelDate(invoice.deliveryDate)]);
  rows.push(['Lorry Number', invoice.lorryNumber || '-']);
  rows.push([]);
  rows.push(['Item Details']);
  rows.push(['Description', 'Quantity', 'Rate', 'Amount']);

  const itemRows = Array.isArray(invoice.rows) ? invoice.rows : [];
  itemRows.forEach((row) => {
    rows.push([row.description || '-', row.quantity || 0, row.rate || 0, row.amount || 0]);
  });

  rows.push([]);
  rows.push([
  'Grand Total',
  `Rs. ${Number(invoice.grandTotal || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`,
]);
console.log("Payment Made:", invoice.paymentMade);
console.log("Pending Amount:", invoice.pendingAmount);
console.log("Invoice:", invoice);
  const hasPayment = invoice.paymentMade !== undefined && invoice.paymentMade !== null && invoice.paymentMade !== '' && Number(invoice.paymentMade) !== 0;
  if (hasPayment) {
  rows.push([
    'Payment Made',
    `Rs. ${Number(invoice.paymentMade || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  ]);

  rows.push([
    'Pending Amount',
    `Rs. ${Number(invoice.pendingAmount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  ]);
}
  rows.push(['Amount in Words', invoice.amountInWords || '-']);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const titleCell = worksheet['A1'];
  if (titleCell) {
    applyTitleStyle(titleCell as XLSX.CellObject);
  }

  worksheet['A2'] = createCell('Invoice Export', {
    font: { italic: true, color: { rgb: '6D7280' } },
    alignment: { horizontal: 'center' },
  });

  const detailHeaderCells = ['A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13'];
  detailHeaderCells.forEach((cellRef) => {
    const cell = worksheet[cellRef];
    if (cell) {
      applySectionStyle(cell as XLSX.CellObject);
    }
  });

  const tableHeaderRange = ['A15', 'B15', 'C15', 'D15'];
  tableHeaderRange.forEach((cellRef) => {
    const cell = worksheet[cellRef];
    if (cell) {
      applyHeaderStyle(cell as XLSX.CellObject);
    }
  });

  const itemStartRow = 16;
  const itemEndRow = itemStartRow + itemRows.length - 1;
  for (let rowIndex = itemStartRow; rowIndex <= itemEndRow; rowIndex += 1) {
    const amountCell = worksheet[`D${rowIndex}`];
    if (amountCell) {
      (amountCell as XLSX.CellObject).s = {
        numFmt: '"Rs." #,##0.00',
        alignment: { horizontal: 'right' },
      };
    }

    const rateCell = worksheet[`C${rowIndex}`];
    if (rateCell) {
      (rateCell as XLSX.CellObject).s = {
        numFmt: '"Rs." #,##0.00',
        alignment: { horizontal: 'right' },
      };
    }
  }

  

 

 
  const dateCells = ['B5', 'B12'];
  dateCells.forEach((cellRef) => {
    const cell = worksheet[cellRef];
    if (cell) {
      (cell as XLSX.CellObject).s = {
        ...((cell as XLSX.CellObject).s || {}),
        numFmt: 'dd/mm/yyyy',
      };
    }
  });

  worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  autoFitColumns(worksheet);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice');
  XLSX.writeFile(workbook, fileName);
}
