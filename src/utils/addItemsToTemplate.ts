import { collection, doc, increment, writeBatch } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { TemplateItem } from '@/types';

// Template equivalent of addProductsToShop.ts (HU-07/HU-20) — single write
// path for "commit these items into a template's subcollection". Same
// atomic batch pattern: every item doc plus the template's itemsCount
// counter, so the denormalized count (shown on the card and the header)
// never drifts from the actual number of item documents.
export async function addItemsToTemplate(
  userUid: string,
  templateUid: string,
  items: Omit<TemplateItem, 'uid'>[]
): Promise<TemplateItem[]> {
  if (!items.length) return [];

  const itemsCollectionRef = collection(
    db,
    `users/${userUid}/templates/${templateUid}/items`
  );
  const templateDocRef = doc(db, `users/${userUid}/templates`, templateUid);

  const batch = writeBatch(db);

  const addedItems = items.map((item) => {
    const itemRef = doc(itemsCollectionRef);
    batch.set(itemRef, item);
    return { uid: itemRef.id, ...item };
  });

  batch.update(templateDocRef, { itemsCount: increment(addedItems.length) });

  await batch.commit();

  return addedItems;
}
