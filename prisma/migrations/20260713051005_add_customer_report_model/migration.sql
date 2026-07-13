-- CreateTable
CREATE TABLE "CustomerReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerKey" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "totalInvoices" INTEGER NOT NULL DEFAULT 0,
    "totalPurchaseAmount" REAL NOT NULL DEFAULT 0,
    "lastPurchaseDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReport_customerKey_key" ON "CustomerReport"("customerKey");
