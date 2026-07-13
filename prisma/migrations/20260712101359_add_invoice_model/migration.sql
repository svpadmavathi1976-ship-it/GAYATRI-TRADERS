-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "receiverGSTIN" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "dispatchedThrough" TEXT NOT NULL,
    "customTransport" TEXT NOT NULL,
    "billOfLading" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "deliveryDate" TEXT NOT NULL,
    "lorryNumber" TEXT NOT NULL,
    "grandTotal" REAL NOT NULL,
    "amountInWords" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_billNumber_key" ON "Invoice"("billNumber");
