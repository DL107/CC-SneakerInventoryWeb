export const BRANDS = [
  "Nike",
  "Jordan",
  "Adidas",
  "New Balance",
  "ASICS",
  "Saucony",
  "Converse",
  "Vans",
  "Reebok",
  "Puma",
  "Salomon",
  "Hoka",
  "On",
  "Other",
] as const;

export const CATEGORIES = [
  "Lifestyle",
  "Basketball",
  "Running",
  "Training",
  "Skateboarding",
  "Hiking",
  "Casual",
  "Luxury",
  "Other",
] as const;

export const SIZE_SYSTEMS = ["US", "UK", "EU", "CM", "JP"] as const;
export type SizeSystem = (typeof SIZE_SYSTEMS)[number];

export const SIZE_CATEGORIES = [
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
  { value: "UNISEX", label: "Unisex" },
  { value: "GRADE_SCHOOL", label: "Grade School" },
  { value: "PRESCHOOL", label: "Preschool" },
  { value: "TODDLER", label: "Toddler" },
] as const;
export type SizeCategory = (typeof SIZE_CATEGORIES)[number]["value"];

export const CONDITIONS = [
  { value: "DEADSTOCK", label: "Deadstock" },
  { value: "NEW_WITHOUT_BOX", label: "New Without Box" },
  { value: "EXCELLENT", label: "Excellent" },
  { value: "VERY_GOOD", label: "Very Good" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "HEAVILY_WORN", label: "Heavily Worn" },
  { value: "DAMAGED", label: "Damaged" },
] as const;
export type Condition = (typeof CONDITIONS)[number]["value"];

export const OWNERSHIP_STATUSES = [
  { value: "IN_COLLECTION", label: "In Collection" },
  { value: "IN_ROTATION", label: "In Rotation" },
  { value: "FOR_SALE", label: "For Sale" },
  { value: "LISTED", label: "Listed" },
  { value: "SALE_PENDING", label: "Sale Pending" },
  { value: "SOLD", label: "Sold" },
  { value: "TRADED", label: "Traded" },
  { value: "GIFTED", label: "Gifted" },
  { value: "RETURNED", label: "Returned" },
  { value: "ARCHIVED", label: "Archived" },
] as const;
export type OwnershipStatus = (typeof OWNERSHIP_STATUSES)[number]["value"];

// Statuses that reveal the "Sale information" form section.
export const SALE_VISIBLE_STATUSES: OwnershipStatus[] = [
  "FOR_SALE",
  "LISTED",
  "SALE_PENDING",
  "SOLD",
];

// Statuses excluded from "active collection" counts/exports.
export const INACTIVE_STATUSES: OwnershipStatus[] = [
  "SOLD",
  "TRADED",
  "GIFTED",
  "RETURNED",
  "ARCHIVED",
];

export const AUTHENTICATION_STATUSES = [
  { value: "NOT_AUTHENTICATED", label: "Not Authenticated" },
  { value: "PENDING", label: "Pending" },
  { value: "AUTHENTICATED", label: "Authenticated" },
  { value: "REJECTED", label: "Rejected / Failed" },
] as const;
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number]["value"];

export const PHOTO_CATEGORIES = [
  { value: "COVER", label: "Cover Photo" },
  { value: "LEFT_SIDE", label: "Left Side" },
  { value: "RIGHT_SIDE", label: "Right Side" },
  { value: "FRONT", label: "Front" },
  { value: "BACK", label: "Back" },
  { value: "TOP", label: "Top" },
  { value: "OUTSOLE", label: "Outsole" },
  { value: "SIZE_TAG", label: "Size Tag" },
  { value: "BOX", label: "Box" },
  { value: "BOX_LABEL", label: "Box Label" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "DAMAGE", label: "Damage" },
  { value: "OTHER", label: "Other" },
] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]["value"];

export const DEFAULT_STORAGE_LOCATIONS = [
  "Bedroom Closet",
  "Shelf A",
  "Shelf B",
  "Storage Room",
  "Rack 1",
  "Rack 2",
  "Bin 1",
  "Bin 2",
  "Display Shelf",
  "Other",
];

export const MARKETPLACES = [
  "StockX",
  "GOAT",
  "eBay",
  "Grailed",
  "Facebook Marketplace",
  "In Person",
  "Other",
];

export const SORT_OPTIONS = [
  { value: "RECENTLY_ADDED", label: "Recently Added" },
  { value: "OLDEST_ADDED", label: "Oldest Added" },
  { value: "NAME_ASC", label: "Sneaker Name (A–Z)" },
  { value: "BRAND_ASC", label: "Brand (A–Z)" },
  { value: "PRICE_DESC", label: "Highest Purchase Price" },
  { value: "PRICE_ASC", label: "Lowest Purchase Price" },
  { value: "VALUE_DESC", label: "Highest Estimated Value" },
  { value: "VALUE_ASC", label: "Lowest Estimated Value" },
  { value: "PURCHASE_NEWEST", label: "Newest Purchase" },
  { value: "PURCHASE_OLDEST", label: "Oldest Purchase" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export function labelFor<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string | null | undefined
): string {
  return list.find((item) => item.value === value)?.label ?? value ?? "—";
}
