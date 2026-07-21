import { Timestamp } from 'firebase/firestore';

export interface ActivePurchaseCandidate {
  isDone: boolean;
  scheduledAt?: Timestamp;
  date?: Timestamp;
}

// RN-06 — active purchase = pending purchase whose scheduledAt is closest to now.
// Sorting ascending naturally satisfies "including overdue ones": an overdue
// purchase has an earlier timestamp than any future one, so it always wins.
// RN-08 — tie-break by time is implicit, since scheduledAt already carries the
// full date+time as a single instant; comparing timestamps resolves same-day ties.
// RN-07 (in_progress) isn't modeled yet — every candidate here is still "pending"
// (isDone === false). Once HU-06 introduces the in_progress status, this helper
// should prioritize the in_progress purchase (there can only ever be one) before
// falling back to this soonest-pending logic.
export function getActivePurchase<T extends ActivePurchaseCandidate>(
  purchases: T[]
): T | undefined {
  const pending = purchases.filter((purchase) => !purchase.isDone);

  return pending.reduce<T | undefined>((closest, purchase) => {
    const purchaseMillis = (purchase.scheduledAt ?? purchase.date)?.toMillis() ?? Infinity;
    const closestMillis = (closest?.scheduledAt ?? closest?.date)?.toMillis() ?? Infinity;

    return purchaseMillis < closestMillis ? purchase : closest;
  }, undefined);
}
