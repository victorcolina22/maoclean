#!/usr/bin/env node
/**
 * One-off admin script — NOT part of the Expo app bundle, run manually from
 * a trusted machine with `node scripts/provisionAccount.js <command> ...`.
 *
 * Custom Claims (role/ownerId) can only be set with the Admin SDK, which
 * requires a service account key — never from the client app. That's why
 * this exists as a standalone script instead of in-app UI (see the decision
 * to skip Cloud Functions for now).
 *
 * Setup:
 *   1. Firebase Console → Project Settings → Service Accounts →
 *      "Generate new private key" FOR THE TARGET PROJECT (dev or prod).
 *      Save it as scripts/serviceAccountKey.json (gitignored, default path)
 *      or point FIREBASE_SERVICE_ACCOUNT_KEY_PATH at it.
 *
 * SAFETY MODEL
 *   - DRY-RUN BY DEFAULT: without --apply nothing is written. It prints the
 *     exact current state and the exact changes that would be made.
 *   - --apply also requires --confirm-project=<project_id of the key>, so a
 *     key for the wrong project (dev vs prod) can never be used by accident.
 *   - IDEMPOTENT: it only compares/writes the fields it owns (role, ownerId,
 *     email, name). Re-running a finished command reports "already up to
 *     date" and writes nothing — use a dry-run to validate the final state.
 *   - BACKUP BEFORE WRITE: on --apply, the pre-change state of every touched
 *     account (claims + users/{uid} doc) is saved to scripts/backups/
 *     (gitignored) BEFORE any mutation. Passwords are never stored.
 *   - ROLLBACK: `rollback --file=<backup>` restores that state. It is also
 *     dry-run by default and takes its own safety backup before applying.
 *   - POST-VERIFY: after --apply the state is re-read and re-planned; the
 *     command fails loudly unless the plan is now a no-op.
 *
 * Commands (all accept --apply --confirm-project=<id>):
 *   bootstrap-owner --email=owner@business.com
 *     Grants an EXISTING account role:'admin' + ownerId:<own uid>.
 *
 *   promote-admin --email=new-admin@x.com --owner-email=owner@business.com
 *     Makes an EXISTING account an admin of the owner's org (ownerId is
 *     taken from the owner's claims). The owner must have been bootstrapped.
 *
 *   create-employee --email=e@x.com --password=Temp123 \
 *       --owner-email=owner@business.com [--name="Nombre"]
 *     Creates (or aligns) a role:'viewer' account in the owner's org. The
 *     password is only used when the Auth account has to be created and is
 *     never changed on an existing account.
 *
 *   rollback --file=scripts/backups/<file>.json
 *     Restores claims + users doc from a backup. Accounts that the backed-up
 *     command CREATED are deleted (Auth + users doc).
 *
 * Typical flow:
 *   node scripts/provisionAccount.js promote-admin --email=... --owner-email=...
 *   node scripts/provisionAccount.js promote-admin --email=... --owner-email=... \
 *       --apply --confirm-project=maoclean-app
 *   node scripts/provisionAccount.js promote-admin --email=... --owner-email=...   # → "already up to date"
 */
// firebase-admin v13+ dropped the admin.auth()/admin.firestore()/
// admin.credential.cert() namespaced API from the default export — use the
// modular subpath imports instead (same shape as the client SDK's v9+ API).
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");
const { planAccount, snapshotAccount, planRollback } = require("./provisionPlan");

const DEFAULT_BACKUP_DIR = "./scripts/backups";
const TS_TAG = "__timestamp";

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] === undefined ? true : m[2];
  }
  return args;
}

function initAdmin() {
  // Defaults to scripts/serviceAccountKey.json (the gitignored convention).
  // Override with FIREBASE_SERVICE_ACCOUNT_KEY_PATH if your key lives elsewhere.
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || "./scripts/serviceAccountKey.json";
  const key = require(path.resolve(keyPath));
  const app = initializeApp({ credential: cert(key) });
  return { auth: getAuth(app), db: getFirestore(app), projectId: key.project_id };
}

// Firestore Timestamps -> JSON-safe tagged values (and back), so backups
// round-trip exactly and state comparisons work on plain data.
function serialize(value) {
  if (value instanceof Timestamp) return { [TS_TAG]: [value.seconds, value.nanoseconds] };
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  }
  return value;
}

function revive(value) {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object") {
    if (TS_TAG in value) return new Timestamp(value[TS_TAG][0], value[TS_TAG][1]);
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, revive(v)]));
  }
  return value;
}

async function readState({ auth, db }, email) {
  let authUser = null;
  try {
    authUser = await auth.getUserByEmail(email);
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
  }
  if (!authUser) return { authUser: null, claims: null, doc: null };
  const snap = await db.doc(`users/${authUser.uid}`).get();
  return {
    authUser: { uid: authUser.uid, email: authUser.email },
    claims: authUser.customClaims ?? null,
    doc: snap.exists ? serialize(snap.data()) : null,
  };
}

function writeBackup(cfg, command, entries) {
  fs.mkdirSync(path.resolve(cfg.backupDir), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.resolve(cfg.backupDir, `${stamp}-${command}.json`);
  const payload = { version: 1, command, projectId: cfg.projectId, createdAt: new Date().toISOString(), entries };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), { mode: 0o600 });
  // Read it back: never mutate anything unless the backup is provably on disk.
  const check = JSON.parse(fs.readFileSync(file, "utf8"));
  if (check.entries.length !== entries.length) throw new Error(`Backup verification failed: ${file}`);
  return file;
}

function requireConfirmation(cfg) {
  if (cfg.confirmProject !== cfg.projectId) {
    throw new Error(
      `--apply requires --confirm-project=${cfg.projectId} (the project_id of the service account key in use). ` +
        "This guards against running with a dev key against prod, or vice versa.",
    );
  }
}

function describePlan(plan) {
  const lines = [];
  if (plan.createAuth) lines.push("  + create Auth account");
  for (const c of plan.claimChanges) lines.push(`  ~ claim ${c.field}: ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`);
  if (plan.createDoc) lines.push("  + create users/{uid} doc");
  for (const c of plan.docChanges) lines.push(`  ~ users doc ${c.field}: ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`);
  return lines;
}

async function applyAccountPlan({ auth, db }, { email, state, plan, desired, password, displayName }) {
  let uid = state.authUser ? state.authUser.uid : null;
  if (plan.createAuth) {
    const created = await auth.createUser({ email, password, displayName });
    uid = created.uid;
  }
  if (plan.createAuth || plan.claimChanges.length > 0) {
    // setCustomUserClaims replaces the whole object — keep unrelated claims.
    await auth.setCustomUserClaims(uid, { ...(state.claims || {}), ...desired.claims });
  }
  const docRef = db.doc(`users/${uid}`);
  if (plan.createDoc) {
    await docRef.set({
      ...desired.doc,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else if (plan.docChanges.length > 0) {
    await docRef.set({ ...desired.doc, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return uid;
}

/**
 * Shared engine: read state -> plan -> (dry-run report | backup -> apply ->
 * post-verify). `buildDesired(state)` returns { claims, doc } or throws.
 */
async function changeAccount(clients, cfg, { command, email, buildDesired, password, displayName }) {
  const state = await readState(clients, email);
  const desired = buildDesired(state);
  const plan = planAccount(state, desired);

  console.log(`[${cfg.apply ? "APPLY" : "DRY-RUN"}] project=${cfg.projectId} ${command} ${email}`);
  console.log("Current state:", JSON.stringify(snapshotAccount(state)));

  if (plan.noop) {
    console.log("Already up to date — nothing to do.");
    return;
  }
  if (plan.createAuth && !password) {
    throw new Error("--password is required because this Auth account does not exist yet");
  }

  console.log("Planned changes:");
  describePlan(plan).forEach((l) => console.log(l));

  if (!cfg.apply) {
    console.log(`\nDry-run: nothing was written. Re-run with --apply --confirm-project=${cfg.projectId} to execute.`);
    return;
  }
  requireConfirmation(cfg);

  const backupFile = writeBackup(cfg, command, [{ email, snapshot: snapshotAccount(state) }]);
  console.log(`Backup saved: ${backupFile}`);

  const uid = await applyAccountPlan(clients, { email, state, plan, desired, password, displayName });

  const after = await readState(clients, email);
  if (!planAccount(after, desired).noop) {
    throw new Error(`Post-verification failed for ${email}; restore with: rollback --file=${backupFile}`);
  }
  console.log(`Done and verified: ${email} (${uid}) now has ${JSON.stringify(desired.claims)}.`);
  if (plan.createAuth) {
    console.log("Share these credentials out-of-band (not email/SMS). The password is NOT stored in the backup:");
    console.log(`  email: ${email}`);
    console.log(`  password: ${password}`);
  }
  console.log("The user must log out and back in for the new claims to take effect.");
  console.log(`Rollback if needed: node scripts/provisionAccount.js rollback --file=${backupFile} --apply --confirm-project=${cfg.projectId}`);
}

function requireExisting(state, email) {
  if (!state.authUser) throw new Error(`No Auth account found for ${email}. Create it first (e.g. Firebase Console → Authentication).`);
}

async function resolveOwnerId(clients, ownerEmail) {
  const owner = await readState(clients, ownerEmail);
  requireExisting(owner, ownerEmail);
  const ownerId = owner.claims && owner.claims.ownerId;
  if (!ownerId || owner.claims.role !== "admin") {
    throw new Error(`${ownerEmail} has no admin/ownerId claims yet — run bootstrap-owner for it first.`);
  }
  return ownerId;
}

async function rollback(clients, cfg, file) {
  const backup = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  if (backup.projectId !== cfg.projectId) {
    throw new Error(`Backup is for project ${backup.projectId} but the key in use is ${cfg.projectId}. Aborting.`);
  }

  const items = [];
  for (const entry of backup.entries) {
    const state = await readState(clients, entry.email);
    const snap = entry.snapshot;
    if (snap.existed && !state.authUser) throw new Error(`${entry.email} no longer exists in Auth; cannot restore automatically.`);
    if (snap.existed && state.authUser.uid !== snap.uid) throw new Error(`${entry.email} was recreated (uid changed); cannot restore automatically.`);
    items.push({ entry, state, plan: planRollback(snap, state) });
  }

  console.log(`[${cfg.apply ? "APPLY" : "DRY-RUN"}] project=${cfg.projectId} rollback of ${backup.command} (${backup.createdAt})`);
  for (const { entry, plan } of items) {
    console.log(`- ${entry.email}: ${plan.noop ? "already at backed-up state" : ""}`);
    if (plan.deleteAuth) console.log("  x delete Auth account (it was created by the backed-up command)");
    if (plan.deleteDoc) console.log("  x delete users/{uid} doc");
    if (plan.claimsDiffer) console.log(`  ~ claims -> ${JSON.stringify(entry.snapshot.claims)}`);
    if (plan.docDiffers) console.log(`  ~ users doc -> ${entry.snapshot.doc === null ? "(delete)" : "restore backed-up doc"}`);
  }
  if (items.every((i) => i.plan.noop)) return console.log("Nothing to roll back.");
  if (!cfg.apply) {
    return console.log(`\nDry-run: nothing was written. Re-run with --apply --confirm-project=${cfg.projectId} to execute.`);
  }
  requireConfirmation(cfg);

  const safety = writeBackup(cfg, "pre-rollback", items.map((i) => ({ email: i.entry.email, snapshot: snapshotAccount(i.state) })));
  console.log(`Safety backup of current state saved: ${safety}`);

  for (const { entry, state, plan } of items) {
    if (plan.noop) continue;
    const uid = state.authUser.uid;
    const docRef = clients.db.doc(`users/${uid}`);
    if (plan.deleteDoc) await docRef.delete();
    if (plan.deleteAuth) await clients.auth.deleteUser(uid);
    if (plan.claimsDiffer) await clients.auth.setCustomUserClaims(uid, entry.snapshot.claims);
    if (plan.docDiffers) {
      if (entry.snapshot.doc === null) await docRef.delete();
      else await docRef.set(revive(entry.snapshot.doc));
    }
  }

  for (const { entry, plan } of items) {
    const after = await readState(clients, entry.email);
    if (!planRollback(entry.snapshot, after).noop) throw new Error(`Rollback verification failed for ${entry.email}`);
    if (!plan.noop) console.log(`Restored and verified: ${entry.email}`);
  }
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);
  const clients = initAdmin();
  const cfg = {
    projectId: clients.projectId,
    apply: args.apply === true,
    confirmProject: args["confirm-project"],
    backupDir: args["backup-dir"] || DEFAULT_BACKUP_DIR,
  };
  const need = (...names) => {
    const missing = names.filter((n) => !args[n] || args[n] === true);
    if (missing.length) throw new Error(`Missing required: ${missing.map((n) => `--${n}`).join(", ")}`);
  };

  if (command === "bootstrap-owner") {
    need("email");
    await changeAccount(clients, cfg, {
      command,
      email: args.email,
      buildDesired: (state) => {
        requireExisting(state, args.email);
        const { uid } = state.authUser;
        return {
          claims: { role: "admin", ownerId: uid },
          doc: { email: state.authUser.email, role: "admin", ownerId: uid },
        };
      },
    });
  } else if (command === "promote-admin") {
    need("email", "owner-email");
    const ownerId = await resolveOwnerId(clients, args["owner-email"]);
    await changeAccount(clients, cfg, {
      command,
      email: args.email,
      buildDesired: (state) => {
        requireExisting(state, args.email);
        return {
          claims: { role: "admin", ownerId },
          doc: { email: state.authUser.email, role: "admin", ownerId },
        };
      },
    });
  } else if (command === "create-employee") {
    need("email", "owner-email");
    const ownerId = await resolveOwnerId(clients, args["owner-email"]);
    const name = typeof args.name === "string" ? args.name : args.email;
    await changeAccount(clients, cfg, {
      command,
      email: args.email,
      password: typeof args.password === "string" ? args.password : undefined,
      displayName: name,
      buildDesired: () => ({
        claims: { role: "viewer", ownerId },
        doc: { email: args.email, name, role: "viewer", ownerId },
      }),
    });
  } else if (command === "rollback") {
    need("file");
    await rollback(clients, cfg, args.file);
  } else {
    console.log("Usage (dry-run by default; add --apply --confirm-project=<project_id> to execute):");
    console.log("  node scripts/provisionAccount.js bootstrap-owner --email=owner@business.com");
    console.log("  node scripts/provisionAccount.js promote-admin --email=admin@x.com --owner-email=owner@business.com");
    console.log('  node scripts/provisionAccount.js create-employee --email=e@x.com --password=Temp123 --owner-email=owner@business.com [--name="Nombre"]');
    console.log("  node scripts/provisionAccount.js rollback --file=scripts/backups/<file>.json");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exitCode = 1;
});
