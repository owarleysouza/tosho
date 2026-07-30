import { collection, doc, increment, writeBatch } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { Product } from '@/types';

// Single write path for "commit these products into a shop's subcollection"
// — HU-07 (typed/pasted items) and HU-20 (cloned items from a previous
// purchase) both call this instead of each keeping their own batch logic.
// Writes every product and the shop's itemsCount counter in one atomic
// batch, so the denormalized count never drifts from the actual number of
// product documents.
export async function addProductsToShop(
  userUid: string,
  shopUid: string,
  products: Omit<Product, 'uid'>[]
): Promise<Product[]> {
  if (!products.length) return [];

  const productsCollectionRef = collection(
    db,
    `users/${userUid}/shops/${shopUid}/products`
  );
  const shopDocRef = doc(db, `users/${userUid}/shops`, shopUid);

  const batch = writeBatch(db);

  const addedProducts = products.map((product) => {
    const productRef = doc(productsCollectionRef);
    batch.set(productRef, product);
    return { uid: productRef.id, ...product };
  });

  batch.update(shopDocRef, { itemsCount: increment(addedProducts.length) });

  await batch.commit();

  return addedProducts;
}
