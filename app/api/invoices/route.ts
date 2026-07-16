import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';

function validateInvoicePayload(payload: Record<string, any>) {
  const errors: Record<string, string> = {};

  const billNumber = typeof payload.billNumber === 'string' ? payload.billNumber.trim() : '';
  const date = typeof payload.date === 'string' ? payload.date.trim() : '';
  const receiverName = typeof payload.receiverName === 'string' ? payload.receiverName.trim() : '';
  const rows = Array.isArray(payload.rows) ? payload.rows : [];

  if (!billNumber) {
    errors.billNumber = 'Bill Number is required.';
  }

  if (!date) {
    errors.date = 'Date is required.';
  }

  if (!receiverName) {
    errors.receiverName = 'Receiver Name is required.';
  }

  if (!rows.length) {
    errors.rows = 'At least one item row is required.';
  }

  rows.forEach((row: any, index: number) => {
    if (!row || typeof row !== 'object') {
      return;
    }

    const quantity = Number(row.quantity);
    const rate = Number(row.rate);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors[`rows.${index}.quantity`] = 'Quantity is required.';
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      errors[`rows.${index}.rate`] = 'Rate is required.';
    }
  });

  // Validate paymentMade if provided
  if (payload.paymentMade !== null && payload.paymentMade !== undefined && payload.paymentMade !== '') {
    const paymentMade = Number(payload.paymentMade);
    if (!Number.isFinite(paymentMade) || paymentMade < 0) {
      errors.paymentMade = 'Payment Made must be a valid non-negative number.';
    }
  }

  return errors;
}

function calculatePendingAmount(grandTotal: number, paymentMade: number | null | undefined): number | null {
  if (paymentMade === null || paymentMade === undefined) {
    return null;
  }
  return grandTotal - paymentMade;
}

function mapInvoiceToListItem(invoice: any) {
  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNumber || invoice.billNumber,
    billNo: invoice.billNo || invoice.billNumber,
    customer: invoice.receiverName,
    date: invoice.date,
    amount: Number(invoice.grandTotal || 0),
    paymentMade: invoice.paymentMade !== null ? Number(invoice.paymentMade || 0) : null,
    pendingAmount: invoice.pendingAmount !== null ? Number(invoice.pendingAmount || 0) : null,
    status: 'Paid' as const,
    createdAt: invoice.createdAt?.toISOString?.() ?? '',
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search')?.trim().toLowerCase() ?? '';
    const customerTerm = searchParams.get('customer')?.trim().toLowerCase() ?? '';
    const limit = Number(searchParams.get('limit') || 0);

    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mappedInvoices = invoices.map(mapInvoiceToListItem);
    const filteredInvoices = mappedInvoices.filter((invoice) => {
      const matchesSearch = !searchTerm || invoice.invoiceNo.toLowerCase().includes(searchTerm) || invoice.billNo.toLowerCase().includes(searchTerm);
      const matchesCustomer = !customerTerm || invoice.customer.toLowerCase().includes(customerTerm);
      return matchesSearch && matchesCustomer;
    });

    const pagedInvoices = limit > 0 ? filteredInvoices.slice(0, limit) : filteredInvoices;

    return NextResponse.json({
      success: true,
      invoices: pagedInvoices,
      total: filteredInvoices.length,
    });
  } catch (error) {
    console.error('Invoice fetch failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load invoices right now.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, any>;
    const errors = validateInvoicePayload(payload);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please fix the highlighted fields and try again.',
          errors,
        },
        { status: 400 }
      );
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { billNumber: payload.billNumber.trim() },
    });

    if (existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice with this Bill Number already exists.',
          errors: {
            billNumber: 'Invoice with this Bill Number already exists.',
          },
        },
        { status: 409 }
      );
    }

    const grandTotal = Number(payload.grandTotal || 0);
    const paymentMade = payload.paymentMade !== null && payload.paymentMade !== undefined && payload.paymentMade !== '' ? Number(payload.paymentMade) : null;
    const pendingAmount = calculatePendingAmount(grandTotal, paymentMade);
    console.log("Saving rows:", JSON.stringify(payload.rows, null, 2));
    const invoice = await prisma.invoice.create({
      data: {
        billNumber: payload.billNumber.trim(),
        date: payload.date.trim(),
        state: typeof payload.state === 'string' ? payload.state : '',
        stateCode: typeof payload.stateCode === 'string' ? payload.stateCode : '',
        receiverName: payload.receiverName.trim(),
        receiverAddress: typeof payload.receiverAddress === 'string' ? payload.receiverAddress : '',
        receiverGSTIN: typeof payload.receiverGSTIN === 'string' ? payload.receiverGSTIN : '',
        invoiceNumber: typeof payload.invoiceNumber === 'string' ? payload.invoiceNumber : '',
        billNo: typeof payload.billNo === 'string' ? payload.billNo : '',
        dispatchedThrough: typeof payload.dispatchedThrough === 'string' ? payload.dispatchedThrough : '',
        customTransport: typeof payload.customTransport === 'string' ? payload.customTransport : '',
        billOfLading: typeof payload.billOfLading === 'string' ? payload.billOfLading : '',
        destination: typeof payload.destination === 'string' ? payload.destination : '',
        deliveryDate: typeof payload.deliveryDate === 'string' ? payload.deliveryDate : '',
        lorryNumber: typeof payload.lorryNumber === 'string' ? payload.lorryNumber : '',
        grandTotal: grandTotal,
        amountInWords: typeof payload.amountInWords === 'string' ? payload.amountInWords : '',
        items: JSON.stringify(payload.rows || []),
        paymentMade: paymentMade,
        pendingAmount: pendingAmount,
      },
    });

    await createActivityLog({
      category: 'invoice',
      title: 'Invoice Created',
      description: `Invoice ${invoice.billNumber} was created for ${invoice.receiverName}.`,
    });

    revalidatePath('/admin/dashboard');

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice saved successfully.',
        invoice: mapInvoiceToListItem(invoice),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invoice save failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to save invoice right now. Please try again later.',
      },
      { status: 500 }
    );
  }
}
