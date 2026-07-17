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
 *      "Generate new private key". Save the file as
 *      scripts/serviceAccountKey.json (gitignored, this is the default path —
 *      override with FIREBASE_SERVICE_ACCOUNT_KEY_PATH if you keep it
 *      elsewhere).
 *   2. npm install --save-dev firebase-admin (already done if you're reading
 *      this from the repo).
 *
 * Usage (via the npm scripts in package.json):
 *   npm run provision:bootstrap-owner -- --email=owner@business.com
 *   npm run provision:employee -- --email=empleado@x.com --password=Temp123 \
 *       --owner-email=owner@business.com --name="Nombre Empleado"
 *
 * Commands:
 *   bootstrap-owner --email=owner@business.com
 *     One-time: grants the existing (pre-multi-account) admin account its
 *     role:'admin' + ownerId:<own uid> claims. Run this ONCE before anyone
 *     else logs in, otherwise nothing in the app can resolve ownerId.
 *
 *   create-employee --email=empleado@x.com --password=Temp123 \
 *       --owner-email=owner@business.com [--name="Nombre Empleado"]
 *     Creates a new Firebase Auth account with role:'viewer', scoped to the
 *     given owner's org. Share the email/password with the employee
 *     out-of-band (Signal, in person, etc.) — never over plain email/SMS.
 */
// firebase-admin v13+ dropped the admin.auth()/admin.firestore()/
// admin.credential.cert() namespaced API from the default export — use the
// modular subpath imports instead (same shape as the client SDK's v9+ API).
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

function initAdmin() {
  // Defaults to scripts/serviceAccountKey.json (the gitignored convention
  // used throughout — see the file's own setup comment) so the npm run
  // scripts below work without exporting the env var every time. Override
  // with FIREBASE_SERVICE_ACCOUNT_KEY_PATH if your key lives elsewhere.
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || "./scripts/serviceAccountKey.json";
  const app = initializeApp({
    credential: cert(require(path.resolve(keyPath))),
  });
  return { auth: getAuth(app), db: getFirestore(app) };
}

async function bootstrapOwner({ auth, db }, email) {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role: "admin", ownerId: user.uid });
  await db.doc(`users/${user.uid}`).set(
    {
      email: user.email,
      role: "admin",
      ownerId: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`Done: ${email} (${user.uid}) is now admin/owner of their own org.`);
  console.log("They must log out and back in (or restart the app) for the new claims to take effect.");
}

async function createEmployee({ auth, db }, { email, password, ownerEmail, name }) {
  const owner = await auth.getUserByEmail(ownerEmail);
  const ownerProfile = await db.doc(`users/${owner.uid}`).get();
  const ownerId = ownerProfile.exists ? ownerProfile.data().ownerId || owner.uid : owner.uid;

  const employee = await auth.createUser({
    email,
    password,
    displayName: name || email,
  });
  await auth.setCustomUserClaims(employee.uid, { role: "viewer", ownerId });
  await db.doc(`users/${employee.uid}`).set({
    email,
    name: name || email,
    role: "viewer",
    ownerId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`Done: created employee ${email} (${employee.uid}) under org ${ownerId}.`);
  console.log("Share these credentials with the employee out-of-band (not email/SMS):");
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  const clients = initAdmin();

  if (command === "bootstrap-owner") {
    if (!args.email) throw new Error("--email is required");
    await bootstrapOwner(clients, args.email);
  } else if (command === "create-employee") {
    if (!args.email || !args.password || !args["owner-email"]) {
      throw new Error("--email, --password and --owner-email are required");
    }
    await createEmployee(clients, {
      email: args.email,
      password: args.password,
      ownerEmail: args["owner-email"],
      name: args.name,
    });
  } else {
    console.log("Usage:");
    console.log("  node scripts/provisionAccount.js bootstrap-owner --email=owner@business.com");
    console.log(
      '  node scripts/provisionAccount.js create-employee --email=empleado@x.com --password=Temp123 --owner-email=owner@business.com [--name="Nombre"]',
    );
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exitCode = 1;
});
