import React from 'react';

export default function InvoiceWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <img
        src="/images/invoice/watermark.png"
        alt=""
        aria-hidden="true"
        className="h-auto w-[600px] max-w-[600px] object-contain opacity-30 select-none"
      />
    </div>
  );
}
