import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportInvoiceToPDF(
  invoiceElement: HTMLElement,
  invoiceNumber: string
) {
  const canvas = await html2canvas(invoiceElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imageData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imageWidth = pageWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;

  pdf.addImage(
    imageData,
    'PNG',
    0,
    0,
    imageWidth,
    imageHeight
  );

  pdf.save(`Invoice_${invoiceNumber}.pdf`);
}