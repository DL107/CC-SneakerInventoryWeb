import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@sneakershelf.app";
const DEMO_PASSWORD = "Password123!";

/**
 * Generates a simple synthetic sneaker-photo placeholder (colored panel with
 * brand/model text) so seed data can demonstrate "sneakers with photos"
 * without depending on any external image URL.
 */
async function generateSyntheticPhoto(userId: string, label: string, color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
      <rect width="900" height="900" fill="${color}"/>
      <rect x="60" y="60" width="780" height="780" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="6"/>
      <text x="450" y="470" text-anchor="middle" font-family="sans-serif" font-size="48" fill="white" font-weight="bold">${label}</text>
    </svg>
  `;
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const dir = path.join(process.cwd(), "public", "uploads", userId);
  await mkdir(dir, { recursive: true });

  const fullPath = path.join(dir, `${id}.webp`);
  const thumbPath = path.join(dir, `${id}_thumb.webp`);

  await sharp(Buffer.from(svg)).resize(900, 900).webp({ quality: 82 }).toFile(fullPath);
  await sharp(Buffer.from(svg)).resize(400, 400).webp({ quality: 75 }).toFile(thumbPath);

  return {
    fileUrl: `/uploads/${userId}/${id}.webp`,
    thumbnailUrl: `/uploads/${userId}/${id}_thumb.webp`,
  };
}

async function main() {
  console.log("Seeding Sneaker Shelf demo data…");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo Collector", passwordHash },
  });

  // Clean slate for repeatable seeding.
  await prisma.inventoryTag.deleteMany({ where: { inventoryItem: { userId: user.id } } });
  await prisma.sneakerPhoto.deleteMany({ where: { inventoryItem: { userId: user.id } } });
  await prisma.saleRecord.deleteMany({ where: { inventoryItem: { userId: user.id } } });
  await prisma.purchaseRecord.deleteMany({ where: { inventoryItem: { userId: user.id } } });
  await prisma.inventoryItem.deleteMany({ where: { userId: user.id } });
  await prisma.sneakerProduct.deleteMany({ where: { userId: user.id } });
  await prisma.tag.deleteMany({ where: { userId: user.id } });
  await prisma.storageLocation.deleteMany({ where: { userId: user.id } });

  const storageLocations = [
    "Bedroom Closet",
    "Shelf A",
    "Shelf B",
    "Storage Room",
    "Rack 1",
    "Rack 2",
    "Bin 1",
    "Bin 2",
    "Display Shelf",
  ];
  for (const name of storageLocations) {
    await prisma.storageLocation.create({ data: { userId: user.id, name } });
  }

  const grailTag = await prisma.tag.create({ data: { userId: user.id, name: "grail" } });
  const dailyTag = await prisma.tag.create({ data: { userId: user.id, name: "daily rotation" } });
  const investTag = await prisma.tag.create({ data: { userId: user.id, name: "investment" } });

  let inventoryCounter = 1;
  const nextInventoryNumber = () => `SNK-${String(inventoryCounter++).padStart(6, "0")}`;

  type SeedItem = {
    brand: string;
    name: string;
    model?: string;
    colorway: string;
    styleCode: string;
    category: string;
    releaseDate?: Date;
    retailPrice?: number;
    size: number;
    sizeSystem: string;
    sizeCategory: string;
    condition: string;
    conditionScore?: number;
    status: string;
    storageLocation: string | null;
    originalBoxIncluded: boolean;
    purchaseDate: Date;
    purchasedFrom: string;
    purchasePrice: number;
    salesTax?: number;
    shippingCost?: number;
    estimatedCurrentValue?: number;
    notes?: string;
    tagIds?: string[];
    photo?: { label: string; color: string };
    sale?: {
      marketplace: string;
      listingDate?: Date;
      listingUrl?: string;
      askingPrice?: number;
      saleDate?: Date;
      salePrice?: number;
      marketplaceFees?: number;
      sellerPaidShipping?: number;
      paymentReceived?: boolean;
      trackingNumber?: string;
    };
  };

  const items: SeedItem[] = [
    {
      brand: "Jordan",
      name: "Air Jordan 1 Retro High OG",
      colorway: "Chicago",
      styleCode: "DZ5485-612",
      category: "Basketball",
      releaseDate: new Date("2022-03-19"),
      retailPrice: 180,
      size: 10,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "DEADSTOCK",
      conditionScore: 10,
      status: "IN_COLLECTION",
      storageLocation: "Display Shelf",
      originalBoxIncluded: true,
      purchaseDate: new Date("2022-03-19"),
      purchasedFrom: "Nike SNKRS",
      purchasePrice: 180,
      salesTax: 14.4,
      estimatedCurrentValue: 260,
      notes: "Purchased at retail via SNKRS raffle.",
      tagIds: [grailTag.id],
      photo: { label: "Air Jordan 1\nChicago", color: "#b91c1c" },
    },
    {
      brand: "Nike",
      name: "Dunk Low",
      colorway: "Panda (Black/White)",
      styleCode: "DD1391-100",
      category: "Lifestyle",
      releaseDate: new Date("2021-03-01"),
      retailPrice: 110,
      size: 9.5,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "EXCELLENT",
      conditionScore: 9,
      status: "IN_ROTATION",
      storageLocation: "Bedroom Closet",
      originalBoxIncluded: true,
      purchaseDate: new Date("2023-01-15"),
      purchasedFrom: "StockX",
      purchasePrice: 120,
      shippingCost: 12,
      estimatedCurrentValue: 115,
      tagIds: [dailyTag.id],
    },
    {
      // Intentional duplicate physical pair of the Dunk Low Panda above (same style/size).
      brand: "Nike",
      name: "Dunk Low",
      colorway: "Panda (Black/White)",
      styleCode: "DD1391-100",
      category: "Lifestyle",
      releaseDate: new Date("2021-03-01"),
      retailPrice: 110,
      size: 9.5,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "DEADSTOCK",
      conditionScore: 10,
      status: "IN_COLLECTION",
      storageLocation: "Shelf A",
      originalBoxIncluded: true,
      purchaseDate: new Date("2023-06-02"),
      purchasedFrom: "GOAT",
      purchasePrice: 130,
      shippingCost: 15,
      estimatedCurrentValue: 120,
      notes: "Backup deadstock pair — duplicate of the daily-rotation pair.",
    },
    {
      brand: "Adidas",
      name: "Yeezy Boost 350 V2",
      colorway: "Zebra",
      styleCode: "CP9654",
      category: "Lifestyle",
      releaseDate: new Date("2017-02-25"),
      retailPrice: 220,
      size: 11,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "VERY_GOOD",
      conditionScore: 8,
      status: "LISTED",
      storageLocation: "Shelf A",
      originalBoxIncluded: true,
      purchaseDate: new Date("2020-08-10"),
      purchasedFrom: "eBay",
      purchasePrice: 260,
      estimatedCurrentValue: 230,
      tagIds: [investTag.id],
      sale: {
        marketplace: "GOAT",
        listingDate: new Date("2026-06-01"),
        listingUrl: "https://www.goat.com/example-listing",
        askingPrice: 235,
      },
    },
    {
      brand: "New Balance",
      name: "550",
      colorway: "White/Green",
      styleCode: "BB550WT1",
      category: "Lifestyle",
      retailPrice: 110,
      size: 9,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "GOOD",
      conditionScore: 7,
      status: "IN_COLLECTION",
      storageLocation: "Shelf B",
      originalBoxIncluded: false,
      purchaseDate: new Date("2022-11-20"),
      purchasedFrom: "Foot Locker",
      purchasePrice: 100,
      estimatedCurrentValue: 95,
    },
    {
      brand: "ASICS",
      name: "Gel-Kayano 14",
      colorway: "Cream/Black",
      styleCode: "1201A019-020",
      category: "Running",
      retailPrice: 160,
      size: 8.5,
      sizeSystem: "US",
      sizeCategory: "WOMEN",
      condition: "DEADSTOCK",
      conditionScore: 10,
      status: "IN_COLLECTION",
      storageLocation: "Rack 1",
      originalBoxIncluded: true,
      purchaseDate: new Date("2024-02-14"),
      purchasedFrom: "ASICS.com",
      purchasePrice: 140,
      estimatedCurrentValue: 150,
      photo: { label: "Gel-Kayano 14", color: "#0f766e" },
    },
    {
      brand: "Saucony",
      name: "Grid Shadow 2",
      colorway: "Grey/Silver",
      styleCode: "S70665-36",
      category: "Running",
      retailPrice: 100,
      size: 10,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "FAIR",
      conditionScore: 5,
      status: "IN_COLLECTION",
      storageLocation: "Rack 2",
      originalBoxIncluded: false,
      purchaseDate: new Date("2021-05-09"),
      purchasedFrom: "Local Consignment Shop",
      purchasePrice: 65,
      estimatedCurrentValue: 70,
    },
    {
      brand: "Converse",
      name: "Chuck 70",
      colorway: "Black Hi",
      styleCode: "162050C",
      category: "Skateboarding",
      retailPrice: 85,
      size: 9,
      sizeSystem: "US",
      sizeCategory: "UNISEX",
      condition: "HEAVILY_WORN",
      conditionScore: 3,
      status: "IN_ROTATION",
      storageLocation: "Bin 1",
      originalBoxIncluded: false,
      purchaseDate: new Date("2020-09-01"),
      purchasedFrom: "Converse.com",
      purchasePrice: 70,
      estimatedCurrentValue: 35,
      notes: "Daily skate shoes — heavily worn.",
    },
    {
      brand: "Vans",
      name: "Old Skool",
      colorway: "Black/White",
      styleCode: "VN000D3HY28",
      category: "Skateboarding",
      retailPrice: 70,
      size: 10,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "GOOD",
      conditionScore: 7,
      status: "IN_COLLECTION",
      storageLocation: "Bin 2",
      originalBoxIncluded: true,
      purchaseDate: new Date("2023-04-18"),
      purchasedFrom: "Vans.com",
      purchasePrice: 60,
      estimatedCurrentValue: 55,
    },
    {
      brand: "Reebok",
      name: "Question Mid",
      colorway: "Blue Toe",
      styleCode: "FY6883",
      category: "Basketball",
      retailPrice: 150,
      size: 10.5,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "EXCELLENT",
      conditionScore: 9,
      status: "SOLD",
      storageLocation: null,
      originalBoxIncluded: true,
      purchaseDate: new Date("2021-12-01"),
      purchasedFrom: "Reebok.com",
      purchasePrice: 150,
      estimatedCurrentValue: 175,
      sale: {
        marketplace: "StockX",
        listingDate: new Date("2026-04-01"),
        saleDate: new Date("2026-04-20"),
        salePrice: 185,
        marketplaceFees: 18.5,
        sellerPaidShipping: 0,
        paymentReceived: true,
        trackingNumber: "1Z999AA10123456784",
      },
    },
    {
      brand: "Puma",
      name: "Suede Classic",
      colorway: "Black/White",
      styleCode: "352634-75",
      category: "Casual",
      retailPrice: 75,
      size: 9,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "DEADSTOCK",
      conditionScore: 10,
      status: "IN_COLLECTION",
      storageLocation: "Storage Room",
      originalBoxIncluded: true,
      purchaseDate: new Date("2024-07-04"),
      purchasedFrom: "Puma.com",
      purchasePrice: 70,
      estimatedCurrentValue: 72,
      photo: { label: "Suede Classic", color: "#1d4ed8" },
    },
    {
      brand: "Salomon",
      name: "XT-6",
      colorway: "Black/Magnet",
      styleCode: "L41252900",
      category: "Hiking",
      retailPrice: 210,
      size: 10,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "DEADSTOCK",
      conditionScore: 10,
      status: "IN_COLLECTION",
      storageLocation: "Display Shelf",
      originalBoxIncluded: true,
      purchaseDate: new Date("2025-01-11"),
      purchasedFrom: "Salomon.com",
      purchasePrice: 190,
      estimatedCurrentValue: 230,
      tagIds: [investTag.id],
    },
    {
      brand: "Hoka",
      name: "Bondi 8",
      colorway: "White/White",
      styleCode: "1123202-BWHT",
      category: "Running",
      retailPrice: 165,
      size: 11,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "VERY_GOOD",
      conditionScore: 8,
      status: "IN_COLLECTION",
      storageLocation: "Shelf A",
      originalBoxIncluded: false,
      purchaseDate: new Date("2024-09-22"),
      purchasedFrom: "Hoka.com",
      purchasePrice: 145,
      estimatedCurrentValue: 130,
    },
    {
      brand: "On",
      name: "Cloudmonster",
      colorway: "All Black",
      styleCode: "3MD10221238",
      category: "Running",
      retailPrice: 170,
      size: 10,
      sizeSystem: "US",
      sizeCategory: "MEN",
      condition: "GOOD",
      conditionScore: 7,
      status: "IN_COLLECTION",
      storageLocation: "Shelf B",
      originalBoxIncluded: true,
      purchaseDate: new Date("2023-10-05"),
      purchasedFrom: "On-running.com",
      purchasePrice: 160,
      estimatedCurrentValue: 150,
    },
  ];

  for (const item of items) {
    const product = await prisma.sneakerProduct.create({
      data: {
        userId: user.id,
        brand: item.brand,
        name: item.name,
        model: item.model,
        colorway: item.colorway,
        styleCode: item.styleCode,
        category: item.category,
        releaseDate: item.releaseDate,
        retailPrice: item.retailPrice,
      },
    });

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        userId: user.id,
        sneakerProductId: product.id,
        inventoryNumber: nextInventoryNumber(),
        size: item.size,
        sizeSystem: item.sizeSystem,
        sizeCategory: item.sizeCategory,
        quantity: 1,
        condition: item.condition,
        conditionScore: item.conditionScore,
        status: item.status,
        originalBoxIncluded: item.originalBoxIncluded,
        authenticationStatus: "NOT_AUTHENTICATED",
        storageLocation: item.storageLocation,
        notes: item.notes,
        estimatedCurrentValue: item.estimatedCurrentValue,
        dateAdded: item.purchaseDate,
        tags: item.tagIds ? { create: item.tagIds.map((tagId) => ({ tagId })) } : undefined,
        purchaseRecord: {
          create: {
            purchaseDate: item.purchaseDate,
            purchasedFrom: item.purchasedFrom,
            purchasePrice: item.purchasePrice,
            salesTax: item.salesTax ?? 0,
            shippingCost: item.shippingCost ?? 0,
          },
        },
        saleRecord: item.sale
          ? {
              create: {
                marketplace: item.sale.marketplace,
                listingDate: item.sale.listingDate,
                listingUrl: item.sale.listingUrl,
                askingPrice: item.sale.askingPrice,
                saleDate: item.sale.saleDate,
                salePrice: item.sale.salePrice,
                marketplaceFees: item.sale.marketplaceFees ?? 0,
                sellerPaidShipping: item.sale.sellerPaidShipping ?? 0,
                paymentReceived: item.sale.paymentReceived ?? false,
                trackingNumber: item.sale.trackingNumber,
              },
            }
          : undefined,
      },
    });

    if (item.photo) {
      const { fileUrl, thumbnailUrl } = await generateSyntheticPhoto(user.id, item.photo.label, item.photo.color);
      await prisma.sneakerPhoto.create({
        data: {
          inventoryItemId: inventoryItem.id,
          fileUrl,
          thumbnailUrl,
          category: "COVER",
          displayOrder: 0,
          isCover: true,
        },
      });
    }
  }

  console.log(`Seeded ${items.length} sneakers for ${DEMO_EMAIL}.`);
  console.log(`Demo login — email: ${DEMO_EMAIL}  password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
