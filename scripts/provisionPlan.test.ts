// eslint-disable-next-line @typescript-eslint/no-require-imports
const { planAccount, planRollback, snapshotAccount } = require("./provisionPlan");

const desired = {
  claims: { role: "admin", ownerId: "owner-1" },
  doc: { email: "a@x.com", role: "admin", ownerId: "owner-1" },
};

describe("planAccount", () => {
  it("plans creation when the auth user does not exist", () => {
    const plan = planAccount({ authUser: null, claims: null, doc: null }, desired);
    expect(plan.noop).toBe(false);
    expect(plan.createAuth).toBe(true);
    expect(plan.createDoc).toBe(true);
  });

  it("plans only the differing claim fields for an existing user", () => {
    const plan = planAccount(
      {
        authUser: { uid: "u1" },
        claims: { role: "viewer", ownerId: "owner-1" },
        doc: { email: "a@x.com", role: "admin", ownerId: "owner-1" },
      },
      desired,
    );
    expect(plan.noop).toBe(false);
    expect(plan.claimChanges).toEqual([{ field: "role", from: "viewer", to: "admin" }]);
    expect(plan.docChanges).toEqual([]);
  });

  it("is a no-op when the current state already matches (idempotent)", () => {
    const plan = planAccount(
      {
        authUser: { uid: "u1" },
        claims: { role: "admin", ownerId: "owner-1", extra: "kept" },
        doc: { email: "a@x.com", role: "admin", ownerId: "owner-1", name: "kept" },
      },
      desired,
    );
    expect(plan.noop).toBe(true);
  });

  it("plans a doc write when the users doc is missing but claims match", () => {
    const plan = planAccount(
      { authUser: { uid: "u1" }, claims: desired.claims, doc: null },
      desired,
    );
    expect(plan.noop).toBe(false);
    expect(plan.createDoc).toBe(true);
    expect(plan.claimChanges).toEqual([]);
  });
});

describe("snapshotAccount / planRollback", () => {
  it("rolls back a created account by deleting it", () => {
    const before = snapshotAccount({ authUser: null, claims: null, doc: null });
    expect(planRollback(before, { authUser: { uid: "u1" }, claims: {}, doc: {} })).toMatchObject({
      noop: false,
      deleteAuth: true,
      deleteDoc: true,
    });
  });

  it("restores previous claims and doc for a modified account", () => {
    const before = snapshotAccount({
      authUser: { uid: "u1" },
      claims: { role: "viewer", ownerId: "o" },
      doc: { role: "viewer", ownerId: "o" },
    });
    const plan = planRollback(before, {
      authUser: { uid: "u1" },
      claims: { role: "admin", ownerId: "owner-1" },
      doc: { role: "admin", ownerId: "owner-1" },
    });
    expect(plan.noop).toBe(false);
    expect(plan.restoreClaims).toEqual({ role: "viewer", ownerId: "o" });
    expect(plan.restoreDoc).toEqual({ role: "viewer", ownerId: "o" });
    expect(plan.claimsDiffer).toBe(true);
    expect(plan.docDiffers).toBe(true);
  });

  it("flags a doc deletion when the account had no users doc before", () => {
    const before = snapshotAccount({ authUser: { uid: "u1" }, claims: null, doc: null });
    const plan = planRollback(before, {
      authUser: { uid: "u1" },
      claims: { role: "admin", ownerId: "o" },
      doc: { role: "admin" },
    });
    expect(plan.claimsDiffer).toBe(true);
    expect(plan.restoreClaims).toBeNull();
    expect(plan.docDiffers).toBe(true);
    expect(plan.restoreDoc).toBeNull();
  });

  it("is a no-op when the account is already at the backed-up state", () => {
    const state = {
      authUser: { uid: "u1" },
      claims: { role: "viewer", ownerId: "o" },
      doc: { role: "viewer", ownerId: "o" },
    };
    expect(planRollback(snapshotAccount(state), state).noop).toBe(true);
  });
});
