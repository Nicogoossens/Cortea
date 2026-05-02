import { describe, it, expect } from "vitest";
import {
  hasFullAccess,
  hasBasicAccess,
  isCounselDomainAccessible,
  isCompassRegionLocked,
  isCompassRegionDetailLocked,
  type SubscriptionTier,
} from "../lib/tier-access";

const GUEST_REGIONS = ["GB"];
const ACTIVE_REGIONS = ["GB", "CN", "CA", "AU"];

// ─── hasFullAccess ───────────────────────────────────────────────────────────

describe("hasFullAccess", () => {
  it("returns true for traveller", () => {
    expect(hasFullAccess("traveller")).toBe(true);
  });

  it("returns true for ambassador", () => {
    expect(hasFullAccess("ambassador")).toBe(true);
  });

  it("returns false for basic", () => {
    expect(hasFullAccess("basic")).toBe(false);
  });

  it("returns false for guest", () => {
    expect(hasFullAccess("guest")).toBe(false);
  });
});

// ─── hasBasicAccess ──────────────────────────────────────────────────────────

describe("hasBasicAccess", () => {
  it("returns true for authenticated basic user", () => {
    expect(hasBasicAccess("basic", true)).toBe(true);
  });

  it("returns false for unauthenticated user regardless of tier", () => {
    expect(hasBasicAccess("basic", false)).toBe(false);
    expect(hasBasicAccess("guest", false)).toBe(false);
  });

  it("returns false for traveller (they have full access, not basic)", () => {
    expect(hasBasicAccess("traveller", true)).toBe(false);
  });

  it("returns false for ambassador", () => {
    expect(hasBasicAccess("ambassador", true)).toBe(false);
  });
});

// ─── isCounselDomainAccessible ───────────────────────────────────────────────

describe("isCounselDomainAccessible – Traveller tier", () => {
  const traveller: SubscriptionTier = "traveller";

  it("unlocks every domain regardless of limit-reached status", () => {
    const domains = [
      { isDomainFree: true },
      { isDomainFree: false },
    ];
    const limitStates = [true, false];

    for (const { isDomainFree } of domains) {
      for (const limitReached of limitStates) {
        expect(
          isCounselDomainAccessible(traveller, true, limitReached, isDomainFree),
        ).toBe(true);
      }
    }
  });
});

describe("isCounselDomainAccessible – Ambassador tier", () => {
  it("unlocks every domain", () => {
    expect(isCounselDomainAccessible("ambassador", true, false, false)).toBe(true);
    expect(isCounselDomainAccessible("ambassador", true, true, false)).toBe(true);
  });
});

describe("isCounselDomainAccessible – Basic tier", () => {
  it("allows access to free domains when limit not reached", () => {
    expect(isCounselDomainAccessible("basic", true, false, true)).toBe(true);
  });

  it("blocks access to premium domains even when limit not reached", () => {
    expect(isCounselDomainAccessible("basic", true, false, false)).toBe(false);
  });

  it("blocks all access once limit is reached", () => {
    expect(isCounselDomainAccessible("basic", true, true, true)).toBe(false);
    expect(isCounselDomainAccessible("basic", true, true, false)).toBe(false);
  });
});

describe("isCounselDomainAccessible – Guest / unauthenticated", () => {
  it("blocks all domains for unauthenticated users", () => {
    expect(isCounselDomainAccessible("guest", false, false, true)).toBe(false);
    expect(isCounselDomainAccessible("guest", false, false, false)).toBe(false);
  });
});

// ─── isCompassRegionLocked (regions list view) ───────────────────────────────

describe("isCompassRegionLocked – Traveller", () => {
  it("never locks any region for a Traveller", () => {
    for (const code of ACTIVE_REGIONS) {
      expect(
        isCompassRegionLocked("traveller", true, GUEST_REGIONS, code),
      ).toBe(false);
    }
  });
});

describe("isCompassRegionLocked – Ambassador", () => {
  it("never locks any region for an Ambassador", () => {
    for (const code of ACTIVE_REGIONS) {
      expect(
        isCompassRegionLocked("ambassador", true, GUEST_REGIONS, code),
      ).toBe(false);
    }
  });
});

describe("isCompassRegionLocked – Basic (authenticated)", () => {
  it("does not lock any region for an authenticated basic user", () => {
    for (const code of ACTIVE_REGIONS) {
      expect(
        isCompassRegionLocked("basic", true, GUEST_REGIONS, code),
      ).toBe(false);
    }
  });
});

describe("isCompassRegionLocked – Guest (unauthenticated)", () => {
  it("locks non-guest regions for visitors", () => {
    expect(isCompassRegionLocked("guest", false, GUEST_REGIONS, "CN")).toBe(true);
    expect(isCompassRegionLocked("guest", false, GUEST_REGIONS, "CA")).toBe(true);
    expect(isCompassRegionLocked("guest", false, GUEST_REGIONS, "AU")).toBe(true);
  });

  it("does not lock the guest-unlocked region (GB)", () => {
    expect(isCompassRegionLocked("guest", false, GUEST_REGIONS, "GB")).toBe(false);
  });
});

// ─── isCompassRegionDetailLocked (region detail page) ────────────────────────

describe("isCompassRegionDetailLocked – authenticated users", () => {
  const tiers: SubscriptionTier[] = ["basic", "traveller", "ambassador"];

  it("never locks for any authenticated user regardless of tier", () => {
    for (const code of ACTIVE_REGIONS) {
      expect(isCompassRegionDetailLocked(true, GUEST_REGIONS, code)).toBe(false);
    }
  });

  it("does not reference tier — only isAuthenticated matters", () => {
    for (const _tier of tiers) {
      expect(isCompassRegionDetailLocked(true, GUEST_REGIONS, "CN")).toBe(false);
    }
  });
});

describe("isCompassRegionDetailLocked – unauthenticated visitors", () => {
  it("locks non-guest regions", () => {
    expect(isCompassRegionDetailLocked(false, GUEST_REGIONS, "CN")).toBe(true);
    expect(isCompassRegionDetailLocked(false, GUEST_REGIONS, "CA")).toBe(true);
    expect(isCompassRegionDetailLocked(false, GUEST_REGIONS, "AU")).toBe(true);
  });

  it("does not lock the guest-unlocked region (GB)", () => {
    expect(isCompassRegionDetailLocked(false, GUEST_REGIONS, "GB")).toBe(false);
  });
});
