import { Badge, type BadgeProps } from "@/components/ui/badge";
import { labelFor, OWNERSHIP_STATUSES, CONDITIONS } from "@/lib/constants";

const STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  IN_COLLECTION: "secondary",
  IN_ROTATION: "info",
  FOR_SALE: "warning",
  LISTED: "warning",
  SALE_PENDING: "purple",
  SOLD: "success",
  TRADED: "outline",
  GIFTED: "outline",
  RETURNED: "destructive",
  ARCHIVED: "outline",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>{labelFor(OWNERSHIP_STATUSES, status)}</Badge>;
}

const CONDITION_VARIANTS: Record<string, BadgeProps["variant"]> = {
  DEADSTOCK: "success",
  NEW_WITHOUT_BOX: "info",
  EXCELLENT: "secondary",
  VERY_GOOD: "secondary",
  GOOD: "warning",
  FAIR: "warning",
  HEAVILY_WORN: "destructive",
  DAMAGED: "destructive",
};

export function ConditionBadge({ condition }: { condition: string }) {
  return <Badge variant={CONDITION_VARIANTS[condition] ?? "secondary"}>{labelFor(CONDITIONS, condition)}</Badge>;
}
