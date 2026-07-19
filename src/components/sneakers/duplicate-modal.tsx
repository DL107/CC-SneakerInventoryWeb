"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { labelFor, OWNERSHIP_STATUSES } from "@/lib/constants";
import { increaseExistingQuantityAction, type DuplicateMatch } from "@/lib/actions/sneakers";

export function DuplicateModal({
  duplicate,
  currentQuantity,
  onAddSeparatePair,
  onDismiss,
}: {
  duplicate: DuplicateMatch;
  currentQuantity: number;
  onAddSeparatePair: () => void;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function close() {
    setOpen(false);
    onDismiss();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>A similar sneaker already exists in your inventory.</DialogTitle>
          <DialogDescription>
            We found an active pair with the same style code and size. Choose how you&apos;d like to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 dark:border-stone-800">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
            {duplicate.coverPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={duplicate.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {duplicate.brand} {duplicate.name}
            </p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">
              {duplicate.inventoryNumber} · {duplicate.styleCode ?? "No style code"} · Size {duplicate.size}{" "}
              {duplicate.sizeSystem} · {labelFor(OWNERSHIP_STATUSES, duplicate.status)}
            </p>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-1">
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              close();
              onAddSeparatePair();
            }}
          >
            Add as Separate Pair
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await increaseExistingQuantityAction(duplicate.id, currentQuantity || 1);
              });
            }}
          >
            Increase Quantity on Existing Record
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              router.push(`/sneakers/${duplicate.id}/edit`);
            }}
          >
            Update Existing Record
          </Button>
          <Button variant="ghost" disabled={pending} onClick={close}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
