/**
 * Pure planning helpers for scripts/provisionAccount.js — no Firebase calls,
 * so they can be unit-tested and reused by dry-run, apply and rollback.
 *
 * "State" = { authUser: {uid}|null, claims: object|null, doc: object|null }
 * (the Auth user, its custom claims, and its users/{uid} Firestore doc).
 */

function diffFields(current, desired) {
  const changes = [];
  for (const [field, to] of Object.entries(desired)) {
    const from = current ? current[field] : undefined;
    if (from !== to) changes.push({ field, from, to });
  }
  return changes;
}

function sameJson(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// Compares only the fields the script owns (desired.claims / desired.doc);
// anything else on the account (other claims, doc fields) is left alone and
// never counts as a difference — that is what makes re-runs a no-op.
function planAccount(state, desired) {
  const createAuth = !state.authUser;
  const createDoc = !state.doc;
  const claimChanges = createAuth ? [] : diffFields(state.claims, desired.claims);
  const docChanges = createDoc ? [] : diffFields(state.doc, desired.doc);
  const noop = !createAuth && !createDoc && claimChanges.length === 0 && docChanges.length === 0;
  return { noop, createAuth, createDoc, claimChanges, docChanges };
}

// Deep copy of exactly what the script may modify, stored in the backup file.
function snapshotAccount(state) {
  return JSON.parse(
    JSON.stringify({
      existed: !!state.authUser,
      uid: state.authUser ? state.authUser.uid : null,
      claims: state.claims ?? null,
      doc: state.doc ?? null,
    }),
  );
}

// Plan to bring `current` back to a previously snapshotted state.
function planRollback(snapshot, current) {
  if (!snapshot.existed) {
    const deleteAuth = !!current.authUser;
    const deleteDoc = !!current.doc;
    return {
      noop: !deleteAuth && !deleteDoc,
      deleteAuth,
      deleteDoc,
      restoreClaims: null,
      restoreDoc: null,
    };
  }
  const claimsDiffer = !sameJson(current.claims, snapshot.claims);
  const docDiffers = !sameJson(current.doc, snapshot.doc);
  return {
    noop: !claimsDiffer && !docDiffers,
    deleteAuth: false,
    deleteDoc: false,
    claimsDiffer,
    docDiffers,
    restoreClaims: claimsDiffer ? snapshot.claims : null,
    restoreDoc: docDiffers ? snapshot.doc : null,
  };
}

module.exports = { diffFields, planAccount, snapshotAccount, planRollback };
