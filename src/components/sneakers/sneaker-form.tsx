"use client";

import { useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import {
  BRANDS,
  CATEGORIES,
  SIZE_SYSTEMS,
  SIZE_CATEGORIES,
  CONDITIONS,
  OWNERSHIP_STATUSES,
  AUTHENTICATION_STATUSES,
  MARKETPLACES,
} from "@/lib/constants";
import { totalAcquisitionCost, netProceeds, profitOrLoss, formatCurrency } from "@/lib/calculations";
import type { SneakerActionState } from "@/lib/actions/sneakers";
import { FormSection, FormField } from "@/components/sneakers/form-section";
import { PhotoUploader, type ExistingPhoto } from "@/components/sneakers/photo-uploader";
import { DuplicateModal } from "@/components/sneakers/duplicate-modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { SwitchField } from "@/components/ui/switch-field";
import { FieldError } from "@/components/ui/field-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

export type SneakerFormDefaults = {
  brand?: string;
  sneakerName?: string;
  model?: string;
  nickname?: string;
  colorway?: string;
  styleCode?: string;
  upc?: string;
  category?: string;
  collaboration?: string;
  releaseDate?: string;
  originalRetailPrice?: number | null;
  size?: number;
  sizeSystem?: string;
  sizeCategory?: string;
  width?: string;
  inventoryNumber: string;
  quantity?: number;
  condition?: string;
  conditionScore?: number | null;
  status?: string;
  originalBoxIncluded?: boolean;
  boxCondition?: string;
  extraLacesIncluded?: boolean;
  accessoriesIncluded?: boolean;
  accessoriesNotes?: string;
  receiptIncluded?: boolean;
  authenticationStatus?: string;
  authenticationProvider?: string;
  storageLocation?: string;
  dateAdded?: string;
  notes?: string;
  tags?: string;
  purchaseDate?: string;
  purchasedFrom?: string;
  orderNumber?: string;
  purchasePrice?: number | null;
  salesTax?: number | null;
  shippingCost?: number | null;
  additionalFees?: number | null;
  estimatedCurrentValue?: number | null;
  userDefinedValue?: number | null;
  minAcceptableSalePrice?: number | null;
  valuationDate?: string;
  valuationNotes?: string;
  marketplace?: string;
  listingDate?: string;
  listingUrl?: string;
  askingPrice?: number | null;
  saleDate?: string;
  salePrice?: number | null;
  marketplaceFees?: number | null;
  sellerPaidShipping?: number | null;
  otherSellingExpenses?: number | null;
  buyerNotes?: string;
  paymentReceived?: boolean;
  trackingNumber?: string;
};

type SneakerFormAction = (prev: SneakerActionState, formData: FormData) => Promise<SneakerActionState>;

export function SneakerForm({
  action,
  defaults,
  storageLocations,
  existingPhotos,
  submitLabel = "Save Sneaker",
}: {
  action: SneakerFormAction;
  defaults: SneakerFormDefaults;
  storageLocations: string[];
  existingPhotos?: ExistingPhoto[];
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<SneakerActionState, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.fieldErrors ?? {};

  const [status, setStatus] = useState(defaults.status ?? "IN_COLLECTION");
  const [quantity, setQuantity] = useState(defaults.quantity ?? 1);
  const [purchasePrice, setPurchasePrice] = useState(defaults.purchasePrice ?? undefined);
  const [salesTax, setSalesTax] = useState(defaults.salesTax ?? undefined);
  const [shippingCost, setShippingCost] = useState(defaults.shippingCost ?? undefined);
  const [additionalFees, setAdditionalFees] = useState(defaults.additionalFees ?? undefined);
  const [salePrice, setSalePrice] = useState(defaults.salePrice ?? undefined);
  const [marketplaceFees, setMarketplaceFees] = useState(defaults.marketplaceFees ?? undefined);
  const [sellerPaidShipping, setSellerPaidShipping] = useState(defaults.sellerPaidShipping ?? undefined);
  const [otherSellingExpenses, setOtherSellingExpenses] = useState(defaults.otherSellingExpenses ?? undefined);

  const [dismissed, setDismissed] = useState(false);

  const showSaleSection = ["FOR_SALE", "LISTED", "SALE_PENDING", "SOLD"].includes(status);

  const acquisitionCost = useMemo(
    () => totalAcquisitionCost({ purchasePrice, salesTax, shippingCost, additionalFees }),
    [purchasePrice, salesTax, shippingCost, additionalFees]
  );
  const proceeds = useMemo(
    () => netProceeds({ salePrice, marketplaceFees, sellerPaidShipping, otherSellingExpenses }),
    [salePrice, marketplaceFees, sellerPaidShipping, otherSellingExpenses]
  );
  const pnl = useMemo(
    () =>
      profitOrLoss(
        { purchasePrice, salesTax, shippingCost, additionalFees },
        { salePrice, marketplaceFees, sellerPaidShipping, otherSellingExpenses }
      ),
    [purchasePrice, salesTax, shippingCost, additionalFees, salePrice, marketplaceFees, sellerPaidShipping, otherSellingExpenses]
  );

  const showDuplicateModal = !!state?.duplicate && !dismissed;

  function submitWithConfirm() {
    if (!formRef.current) return;
    const input = formRef.current.elements.namedItem("confirmDuplicate") as HTMLInputElement | null;
    if (input) input.value = "true";
    formRef.current.requestSubmit();
  }

  const dateStr = (s?: string) => (s ? s.slice(0, 10) : "");

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="confirmDuplicate" defaultValue="false" />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {state.error}
        </p>
      )}

      {showDuplicateModal && state?.duplicate && (
        <DuplicateModal
          duplicate={state.duplicate}
          currentQuantity={quantity}
          onAddSeparatePair={submitWithConfirm}
          onDismiss={() => setDismissed(true)}
        />
      )}

      <FormSection title="Basic Information">
        <FormField>
          <Label htmlFor="brand" required>
            Brand
          </Label>
          <ComboboxInput
            listId="brand-options"
            options={BRANDS}
            id="brand"
            name="brand"
            defaultValue={defaults.brand}
            required
            error={!!errors.brand}
            placeholder="e.g. Nike"
          />
          <FieldError message={errors.brand} />
        </FormField>
        <FormField>
          <Label htmlFor="sneakerName" required>
            Sneaker Name
          </Label>
          <Input id="sneakerName" name="sneakerName" defaultValue={defaults.sneakerName} required error={!!errors.sneakerName} />
          <FieldError message={errors.sneakerName} />
        </FormField>
        <FormField>
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={defaults.model} />
        </FormField>
        <FormField>
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" name="nickname" defaultValue={defaults.nickname} />
        </FormField>
        <FormField>
          <Label htmlFor="colorway">Colorway</Label>
          <Input id="colorway" name="colorway" defaultValue={defaults.colorway} />
        </FormField>
        <FormField>
          <Label htmlFor="styleCode">Style Code / SKU / UPC</Label>
          <Input id="styleCode" name="styleCode" defaultValue={defaults.styleCode} />
        </FormField>
        <FormField>
          <Label htmlFor="upc">UPC</Label>
          <Input id="upc" name="upc" defaultValue={defaults.upc} />
        </FormField>
        <FormField>
          <Label htmlFor="category">Category</Label>
          <ComboboxInput listId="category-options" options={CATEGORIES} id="category" name="category" defaultValue={defaults.category} />
        </FormField>
        <FormField>
          <Label htmlFor="collaboration">Collaboration</Label>
          <Input id="collaboration" name="collaboration" defaultValue={defaults.collaboration} />
        </FormField>
        <FormField>
          <Label htmlFor="releaseDate">Release Date</Label>
          <Input id="releaseDate" name="releaseDate" type="date" defaultValue={dateStr(defaults.releaseDate)} />
        </FormField>
        <FormField>
          <Label htmlFor="originalRetailPrice">Original Retail Price</Label>
          <Input id="originalRetailPrice" name="originalRetailPrice" type="number" step="0.01" min="0" defaultValue={defaults.originalRetailPrice ?? undefined} />
          <FieldError message={errors.originalRetailPrice} />
        </FormField>
      </FormSection>

      <FormSection title="Size Information">
        <FormField>
          <Label htmlFor="size" required>
            Size
          </Label>
          <Input id="size" name="size" type="number" step="0.5" min="0" defaultValue={defaults.size} required error={!!errors.size} />
          <FieldError message={errors.size} />
        </FormField>
        <FormField>
          <Label htmlFor="sizeSystem" required>
            Size System
          </Label>
          <Select id="sizeSystem" name="sizeSystem" defaultValue={defaults.sizeSystem ?? "US"} error={!!errors.sizeSystem}>
            {SIZE_SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <FieldError message={errors.sizeSystem} />
        </FormField>
        <FormField>
          <Label htmlFor="sizeCategory" required>
            Size Category
          </Label>
          <Select id="sizeCategory" name="sizeCategory" defaultValue={defaults.sizeCategory ?? "MEN"} error={!!errors.sizeCategory}>
            {SIZE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <FieldError message={errors.sizeCategory} />
        </FormField>
        <FormField>
          <Label htmlFor="width">Width</Label>
          <Input id="width" name="width" defaultValue={defaults.width} placeholder="e.g. D, Wide" />
        </FormField>
      </FormSection>

      <FormSection title="Inventory Information">
        <FormField>
          <Label htmlFor="inventoryNumber" required>
            Inventory Number
          </Label>
          <Input id="inventoryNumber" name="inventoryNumber" defaultValue={defaults.inventoryNumber} required error={!!errors.inventoryNumber} />
          <FieldError message={errors.inventoryNumber} />
        </FormField>
        <FormField>
          <Label htmlFor="quantity" required>
            Quantity
          </Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            error={!!errors.quantity}
          />
          <FieldError message={errors.quantity} />
        </FormField>
        <FormField>
          <Label htmlFor="condition" required>
            Condition
          </Label>
          <Select id="condition" name="condition" defaultValue={defaults.condition ?? "DEADSTOCK"} error={!!errors.condition}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <FieldError message={errors.condition} />
        </FormField>
        <FormField>
          <Label htmlFor="conditionScore">Condition Score (1–10)</Label>
          <Input id="conditionScore" name="conditionScore" type="number" min={1} max={10} step={1} defaultValue={defaults.conditionScore ?? undefined} error={!!errors.conditionScore} />
          <FieldError message={errors.conditionScore} />
        </FormField>
        <FormField>
          <Label htmlFor="status" required>
            Ownership Status
          </Label>
          <Select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            error={!!errors.status}
          >
            {OWNERSHIP_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <FieldError message={errors.status} />
        </FormField>
        <FormField>
          <Label htmlFor="storageLocation">Storage Location</Label>
          <ComboboxInput listId="storage-options" options={storageLocations} id="storageLocation" name="storageLocation" defaultValue={defaults.storageLocation} />
        </FormField>
        <FormField>
          <Label htmlFor="authenticationStatus">Authentication Status</Label>
          <Select id="authenticationStatus" name="authenticationStatus" defaultValue={defaults.authenticationStatus ?? "NOT_AUTHENTICATED"}>
            {AUTHENTICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField>
          <Label htmlFor="authenticationProvider">Authentication Provider</Label>
          <Input id="authenticationProvider" name="authenticationProvider" defaultValue={defaults.authenticationProvider} />
        </FormField>
        <FormField>
          <Label htmlFor="dateAdded">Date Added</Label>
          <Input id="dateAdded" name="dateAdded" type="date" defaultValue={dateStr(defaults.dateAdded)} />
        </FormField>
        <FormField>
          <Label htmlFor="boxCondition">Box Condition</Label>
          <Input id="boxCondition" name="boxCondition" defaultValue={defaults.boxCondition} />
        </FormField>
        <FormField>
          <Label htmlFor="accessoriesNotes">Accessories Notes</Label>
          <Input id="accessoriesNotes" name="accessoriesNotes" defaultValue={defaults.accessoriesNotes} placeholder="e.g. Extra insoles, keychain" />
        </FormField>
        <FormField>
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" defaultValue={defaults.tags} placeholder="comma, separated, tags" />
        </FormField>

        <FormField className="sm:col-span-2 lg:col-span-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SwitchField name="originalBoxIncluded" label="Original Box" defaultChecked={defaults.originalBoxIncluded} />
            <SwitchField name="extraLacesIncluded" label="Extra Laces" defaultChecked={defaults.extraLacesIncluded} />
            <SwitchField name="accessoriesIncluded" label="Accessories" defaultChecked={defaults.accessoriesIncluded} />
            <SwitchField name="receiptIncluded" label="Receipt" defaultChecked={defaults.receiptIncluded} />
          </div>
        </FormField>

        <FormField className="sm:col-span-2 lg:col-span-3">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={defaults.notes} rows={3} />
        </FormField>
      </FormSection>

      <FormSection title="Purchase Information" description="Total acquisition cost is calculated automatically.">
        <FormField>
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={dateStr(defaults.purchaseDate)} />
        </FormField>
        <FormField>
          <Label htmlFor="purchasedFrom">Purchased From</Label>
          <Input id="purchasedFrom" name="purchasedFrom" defaultValue={defaults.purchasedFrom} />
        </FormField>
        <FormField>
          <Label htmlFor="orderNumber">Order Number</Label>
          <Input id="orderNumber" name="orderNumber" defaultValue={defaults.orderNumber} />
        </FormField>
        <FormField>
          <Label htmlFor="purchasePrice">Purchase Price</Label>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            value={purchasePrice ?? ""}
            onChange={(e) => setPurchasePrice(e.target.value === "" ? undefined : Number(e.target.value))}
            error={!!errors.purchasePrice}
          />
          <FieldError message={errors.purchasePrice} />
        </FormField>
        <FormField>
          <Label htmlFor="salesTax">Sales Tax</Label>
          <Input
            id="salesTax"
            name="salesTax"
            type="number"
            step="0.01"
            min="0"
            value={salesTax ?? ""}
            onChange={(e) => setSalesTax(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </FormField>
        <FormField>
          <Label htmlFor="shippingCost">Shipping Cost</Label>
          <Input
            id="shippingCost"
            name="shippingCost"
            type="number"
            step="0.01"
            min="0"
            value={shippingCost ?? ""}
            onChange={(e) => setShippingCost(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </FormField>
        <FormField>
          <Label htmlFor="additionalFees">Additional Fees</Label>
          <Input
            id="additionalFees"
            name="additionalFees"
            type="number"
            step="0.01"
            min="0"
            value={additionalFees ?? ""}
            onChange={(e) => setAdditionalFees(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </FormField>
        <FormField>
          <Label>Total Acquisition Cost</Label>
          <p className="flex h-10 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm font-semibold dark:border-stone-800 dark:bg-stone-900">
            {formatCurrency(acquisitionCost)}
          </p>
        </FormField>
      </FormSection>

      <FormSection title="Value Information" description="Market values are entered manually in this MVP.">
        <FormField>
          <Label htmlFor="estimatedCurrentValue">Estimated Current Value</Label>
          <Input id="estimatedCurrentValue" name="estimatedCurrentValue" type="number" step="0.01" min="0" defaultValue={defaults.estimatedCurrentValue ?? undefined} />
        </FormField>
        <FormField>
          <Label htmlFor="userDefinedValue">User-Defined Value</Label>
          <Input id="userDefinedValue" name="userDefinedValue" type="number" step="0.01" min="0" defaultValue={defaults.userDefinedValue ?? undefined} />
        </FormField>
        <FormField>
          <Label htmlFor="minAcceptableSalePrice">Minimum Acceptable Sale Price</Label>
          <Input id="minAcceptableSalePrice" name="minAcceptableSalePrice" type="number" step="0.01" min="0" defaultValue={defaults.minAcceptableSalePrice ?? undefined} />
        </FormField>
        <FormField>
          <Label htmlFor="valuationDate">Valuation Date</Label>
          <Input id="valuationDate" name="valuationDate" type="date" defaultValue={dateStr(defaults.valuationDate)} />
        </FormField>
        <FormField className="sm:col-span-2 lg:col-span-2">
          <Label htmlFor="valuationNotes">Valuation Notes</Label>
          <Textarea id="valuationNotes" name="valuationNotes" defaultValue={defaults.valuationNotes} rows={1} />
        </FormField>
      </FormSection>

      {showSaleSection && (
        <FormSection title="Sale Information" description="Shown because the ownership status indicates a sale.">
          <FormField>
            <Label htmlFor="marketplace">Marketplace</Label>
            <ComboboxInput listId="marketplace-options" options={MARKETPLACES} id="marketplace" name="marketplace" defaultValue={defaults.marketplace} />
          </FormField>
          <FormField>
            <Label htmlFor="listingDate">Listing Date</Label>
            <Input id="listingDate" name="listingDate" type="date" defaultValue={dateStr(defaults.listingDate)} />
          </FormField>
          <FormField>
            <Label htmlFor="listingUrl">Listing URL</Label>
            <Input id="listingUrl" name="listingUrl" type="url" defaultValue={defaults.listingUrl} />
          </FormField>
          <FormField>
            <Label htmlFor="askingPrice">Asking Price</Label>
            <Input id="askingPrice" name="askingPrice" type="number" step="0.01" min="0" defaultValue={defaults.askingPrice ?? undefined} />
          </FormField>
          <FormField>
            <Label htmlFor="saleDate" required={status === "SOLD"}>
              Sale Date
            </Label>
            <Input id="saleDate" name="saleDate" type="date" defaultValue={dateStr(defaults.saleDate)} error={!!errors.saleDate} />
            <FieldError message={errors.saleDate} />
          </FormField>
          <FormField>
            <Label htmlFor="salePrice" required={status === "SOLD"}>
              Sale Price
            </Label>
            <Input
              id="salePrice"
              name="salePrice"
              type="number"
              step="0.01"
              min="0"
              value={salePrice ?? ""}
              onChange={(e) => setSalePrice(e.target.value === "" ? undefined : Number(e.target.value))}
              error={!!errors.salePrice}
            />
            <FieldError message={errors.salePrice} />
          </FormField>
          <FormField>
            <Label htmlFor="marketplaceFees">Marketplace Fees</Label>
            <Input
              id="marketplaceFees"
              name="marketplaceFees"
              type="number"
              step="0.01"
              min="0"
              value={marketplaceFees ?? ""}
              onChange={(e) => setMarketplaceFees(e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </FormField>
          <FormField>
            <Label htmlFor="sellerPaidShipping">Seller-Paid Shipping</Label>
            <Input
              id="sellerPaidShipping"
              name="sellerPaidShipping"
              type="number"
              step="0.01"
              min="0"
              value={sellerPaidShipping ?? ""}
              onChange={(e) => setSellerPaidShipping(e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </FormField>
          <FormField>
            <Label htmlFor="otherSellingExpenses">Other Selling Expenses</Label>
            <Input
              id="otherSellingExpenses"
              name="otherSellingExpenses"
              type="number"
              step="0.01"
              min="0"
              value={otherSellingExpenses ?? ""}
              onChange={(e) => setOtherSellingExpenses(e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </FormField>
          <FormField>
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input id="trackingNumber" name="trackingNumber" defaultValue={defaults.trackingNumber} />
          </FormField>
          <FormField className="sm:col-span-2">
            <Label htmlFor="buyerNotes">Buyer Notes</Label>
            <Textarea id="buyerNotes" name="buyerNotes" defaultValue={defaults.buyerNotes} rows={1} />
          </FormField>
          <FormField>
            <SwitchField name="paymentReceived" label="Payment Received" defaultChecked={defaults.paymentReceived} />
          </FormField>

          <FormField>
            <Label>Net Proceeds</Label>
            <p className="flex h-10 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm font-semibold dark:border-stone-800 dark:bg-stone-900">
              {formatCurrency(proceeds)}
            </p>
          </FormField>
          <FormField>
            <Label>Profit / Loss</Label>
            <p
              className={`flex h-10 items-center rounded-lg border px-3 text-sm font-semibold ${
                pnl >= 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              {pnl >= 0 ? "Profit " : "Loss "} {formatCurrency(Math.abs(pnl))}
            </p>
          </FormField>
        </FormSection>
      )}

      <FormSection title="Photos" description="Add photos of the sneaker, box, and accessories. Optional.">
        <FormField className="sm:col-span-2 lg:col-span-3">
          <PhotoUploader existingPhotos={existingPhotos} />
        </FormField>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
        <SubmitButton size="lg">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
