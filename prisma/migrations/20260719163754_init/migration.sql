-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sneaker_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "nickname" TEXT,
    "colorway" TEXT,
    "styleCode" TEXT,
    "upc" TEXT,
    "category" TEXT,
    "collaboration" TEXT,
    "releaseDate" DATETIME,
    "retailPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sneaker_products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sneakerProductId" TEXT NOT NULL,
    "size" REAL NOT NULL,
    "sizeSystem" TEXT NOT NULL,
    "sizeCategory" TEXT NOT NULL,
    "width" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT NOT NULL,
    "conditionScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'IN_COLLECTION',
    "originalBoxIncluded" BOOLEAN NOT NULL DEFAULT false,
    "boxCondition" TEXT,
    "extraLacesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "accessoriesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "accessoriesNotes" TEXT,
    "receiptIncluded" BOOLEAN NOT NULL DEFAULT false,
    "authenticationStatus" TEXT NOT NULL DEFAULT 'NOT_AUTHENTICATED',
    "authenticationProvider" TEXT,
    "storageLocation" TEXT,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "estimatedCurrentValue" REAL,
    "userDefinedValue" REAL,
    "minAcceptableSalePrice" REAL,
    "valuationDate" DATETIME,
    "valuationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inventory_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_items_sneakerProductId_fkey" FOREIGN KEY ("sneakerProductId") REFERENCES "sneaker_products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "purchaseDate" DATETIME,
    "purchasedFrom" TEXT,
    "orderNumber" TEXT,
    "purchasePrice" REAL,
    "salesTax" REAL NOT NULL DEFAULT 0,
    "shippingCost" REAL NOT NULL DEFAULT 0,
    "additionalFees" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_records_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "marketplace" TEXT,
    "listingDate" DATETIME,
    "listingUrl" TEXT,
    "askingPrice" REAL,
    "saleDate" DATETIME,
    "salePrice" REAL,
    "marketplaceFees" REAL NOT NULL DEFAULT 0,
    "sellerPaidShipping" REAL NOT NULL DEFAULT 0,
    "otherSellingExpenses" REAL NOT NULL DEFAULT 0,
    "buyerNotes" TEXT,
    "paymentReceived" BOOLEAN NOT NULL DEFAULT false,
    "trackingNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sale_records_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sneaker_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sneaker_photos_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "storage_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "storage_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_tags" (
    "inventoryItemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("inventoryItemId", "tagId"),
    CONSTRAINT "inventory_tags_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "sneaker_products_userId_idx" ON "sneaker_products"("userId");

-- CreateIndex
CREATE INDEX "sneaker_products_userId_styleCode_idx" ON "sneaker_products"("userId", "styleCode");

-- CreateIndex
CREATE INDEX "inventory_items_userId_idx" ON "inventory_items"("userId");

-- CreateIndex
CREATE INDEX "inventory_items_userId_status_idx" ON "inventory_items"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_userId_inventoryNumber_key" ON "inventory_items"("userId", "inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_records_inventoryItemId_key" ON "purchase_records"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_records_inventoryItemId_key" ON "sale_records"("inventoryItemId");

-- CreateIndex
CREATE INDEX "sneaker_photos_inventoryItemId_idx" ON "sneaker_photos"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_userId_name_key" ON "storage_locations"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_userId_name_key" ON "tags"("userId", "name");
