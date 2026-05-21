-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "taxes" REAL,
    "orderDate" DATETIME NOT NULL,
    "trackingCode" TEXT,
    "sizes" TEXT,
    "payment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Informações enviadas',
    "lastUpdate" DATETIME,
    "cpf" TEXT,
    "orderedBy" TEXT,
    "estimatedArrival" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
