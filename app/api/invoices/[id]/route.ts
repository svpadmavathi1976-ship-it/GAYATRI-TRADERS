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

function mapInvoiceRecord(invoice: any) {
  return {
    id: invoice.id,
    billNumber: invoice.billNumber,
    date: invoice.date,
    state: invoice.state,
    stateCode: invoice.stateCode,
    receiverName: invoice.receiverName,
    receiverAddress: invoice.receiverAddress,
    receiverGSTIN: invoice.receiverGSTIN,
    invoiceNumber: invoice.invoiceNumber,
    billNo: invoice.billNo,
    dispatchedThrough: invoice.dispatchedThrough,
    customTransport: invoice.customTransport,
    billOfLading: invoice.billOfLading,
    destination: invoice.destination,
    deliveryDate: invoice.deliveryDate,
    lorryNumber: invoice.lorryNumber,
    grandTotal: Number(invoice.grandTotal || 0),
    amountInWords: invoice.amountInWords,
    items: invoice.items,
    paymentMade: invoice.paymentMade !== null ? Number(invoice.paymentMade || 0) : null,
    pendingAmount: invoice.pendingAmount !== null ? Number(invoice.pendingAmount || 0) : null,
    createdAt: invoice.createdAt?.toISOString?.() ?? '',
  };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: mapInvoiceRecord(invoice),
    });
  } catch (error) {
    console.error('Invoice lookup failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load invoice details right now.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        billNumber: payload.billNumber.trim(),
        NOT: {
          id: params.id,
        },
      },
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

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
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

    revalidatePath('/admin/dashboard');

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully.',
      invoice: mapInvoiceRecord(updatedInvoice),
    });
  } catch (error) {
    console.error('Invoice update failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to update invoice right now. Please try again later.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return PUT(request, { params });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });

    if (!invoice) {
      return NextResponse.json({ success: false, message: 'Invoice not found.' }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    await createActivityLog({
      category: 'invoice',
      title: 'Invoice Deleted',
      description: `Invoice ${invoice.billNumber} was deleted.`,
    });

    revalidatePath('/admin/dashboard');

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully.',
    });
  } catch (error) {
    console.error('Invoice deletion failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to delete invoice right now.',
      },
      { status: 500 }
    );
  }
}
