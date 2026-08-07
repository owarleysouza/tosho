// One-time migration: unify the Purchase field name `date` -> `scheduledAt`.
//
// Background: older `shops` documents (Firestore path `users/{uid}/shops/{id}`)
// were written with a `date` field; the app has since moved to `scheduledAt`
// as the canonical field name (see CONTEXT.md, section 3/10). This script
// finds every document across ALL users that still only has `date` and
// copies it to `scheduledAt`, then removes `date`.
//
// Idempotent by design:
//   - A document that already has `scheduledAt` is left completely untouched,
//     even if a leftover `date` also happens to exist on it.
//   - A document with neither field is skipped and logged as a warning
//     (separate data-integrity issue, out of scope for this script).
//   - Running this script twice in a row is a no-op the second time: nothing
//     will match the `date`-without-`scheduledAt` filter anymore.
//
// Usage:
//   node scripts/migrate-scheduled-at.mjs             # dry run (default) — no writes
//   node scripts/migrate-scheduled-at.mjs --apply      # actually commit the writes
//
// Requires a Firebase service account key: the script refuses to run
// without GOOGLE_APPLICATION_CREDENTIALS pointing at a valid key file.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!KEY_PATH) {
  console.error(
    'Missing GOOGLE_APPLICATION_CREDENTIALS env var.\n' +
      'Point it at your service account JSON key, e.g.:\n\n' +
      '  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/migrate-scheduled-at.mjs\n'
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(KEY_PATH, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}\n`);

  const snapshot = await db.collectionGroup('shops').get();

  let toMigrate = 0;
  let alreadyDone = 0;
  let missingBoth = 0;

  // Firestore batches are capped at 500 operations; chunk writes accordingly.
  let batch = db.batch();
  let opsInBatch = 0;
  const commits = [];

  const flushBatch = () => {
    if (opsInBatch === 0) return;
    commits.push(batch.commit());
    batch = db.batch();
    opsInBatch = 0;
  };

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasScheduledAt = data.scheduledAt !== undefined;
    const hasDate = data.date !== undefined;

    if (hasScheduledAt) {
      alreadyDone++;
      continue;
    }

    if (!hasDate) {
      missingBoth++;
      console.warn(`WARN: ${doc.ref.path} has neither 'date' nor 'scheduledAt' — skipped.`);
      continue;
    }

    toMigrate++;
    console.log(`${APPLY ? 'MIGRATING' : 'WOULD MIGRATE'}: ${doc.ref.path}  date=${data.date.toDate().toISOString()} -> scheduledAt`);

    if (APPLY) {
      batch.update(doc.ref, {
        scheduledAt: data.date,
        date: FieldValue.delete(),
      });
      opsInBatch++;
      if (opsInBatch === 500) flushBatch();
    }
  }

  flushBatch();
  if (commits.length > 0) await Promise.all(commits);

  console.log('\nSummary:');
  console.log(`  already using scheduledAt: ${alreadyDone}`);
  console.log(`  ${APPLY ? 'migrated' : 'would migrate'}: ${toMigrate}`);
  console.log(`  skipped (missing both fields): ${missingBoth}`);

  if (!APPLY && toMigrate > 0) {
    console.log('\nThis was a dry run — no documents were changed.');
    console.log('Review the list above, then re-run with --apply to commit.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
