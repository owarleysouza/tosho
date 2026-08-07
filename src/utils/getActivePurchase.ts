import { Timestamp } from 'firebase/firestore';

export interface ActivePurchaseCandidate {
  isDone: boolean;
  scheduledAt?: Timestamp;
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
    // No candidate picked yet — always take this one. This has to be its
    // own branch, separate from the "-Infinity" below: `closest` being
    // undefined means "nothing compared so far", not "an actual candidate
    // with no date", and conflating the two made the very first pending
    // purchase permanently lose to an empty accumulator.
    if (!closest) return purchase;

    // A purchase without a scheduled date is treated as the most urgent
    // (-Infinity) rather than the least: an undated pending purchase still
    // needs to surface as the active one instead of being permanently
    // unreachable behind any dated purchase.
    const purchaseMillis = purchase.scheduledAt?.toMillis() ?? -Infinity;
    const closestMillis = closest.scheduledAt?.toMillis() ?? -Infinity;

    return purchaseMillis < closestMillis ? purchase : closest;
  }, undefined);
}
