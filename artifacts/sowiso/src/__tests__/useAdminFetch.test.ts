/**
 * Tests for the useAdminFetch hook — the single guard that detects expired
 * admin sessions and automatically signs the user out + redirects.
 *
 * Scenarios covered:
 *   1. 403 on a users-list fetch (tab fetch) → logout + /signin?error=session_expired
 *   2. 403 on a Google-status fetch (sub-component fetch) → same
 *   3. Non-403 errors (401, 500) → no logout, response passed through
 *   4. Successful (200) response → no logout, response passed through
 *   5. Network errors → rejection propagates, no spurious logout
 *   6. credentials: include is always sent regardless of caller options
 *   7. Caller-supplied options are merged into the request
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── mock wouter ──────────────────────────────────────────────────────────────
const mockSetLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/admin", mockSetLocation],
}));

// ─── mock @/lib/auth ──────────────────────────────────────────────────────────
const mockLogout = vi.fn();

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

// ─── import after mocks ───────────────────────────────────────────────────────
import { useAdminFetch } from "../lib/useAdminFetch";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeResponse(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response;
}

function getHook() {
  const { result } = renderHook(() => useAdminFetch());
  return result;
}

// ─── setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockSetLocation.mockClear();
  mockLogout.mockClear();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── 403 on a tab fetch (users list) ─────────────────────────────────────────

describe("useAdminFetch — 403 on users-list tab fetch", () => {
  it("calls logout() when /api/admin/users returns 403", async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(403));

    const hook = getHook();
    await act(async () => {
      await hook.current("/api/admin/users?q=&page=1&limit=50");
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("redirects to /signin?error=session_expired when /api/admin/users returns 403", async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(403));

    const hook = getHook();
    await act(async () => {
      await hook.current("/api/admin/users?q=&page=1&limit=50");
    });

    expect(mockSetLocation).toHaveBeenCalledWith("/signin?error=session_expired");
  });

  it("still resolves with the 403 Response object (caller decides what to do with it)", async () => {
    const forbidden = makeResponse(403);
    vi.mocked(fetch).mockResolvedValue(forbidden);

    const hook = getHook();
    let res!: Response;
    await act(async () => {
      res = await hook.current("/api/admin/users");
    });

    expect(res.status).toBe(403);
  });
});

// ─── 403 on a sub-component fetch (Google OAuth status) ──────────────────────

describe("useAdminFetch — 403 on Google-status sub-component fetch", () => {
  it("calls logout() when /api/auth/google/status returns 403", async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(403));

    const hook = getHook();
    await act(async () => {
      await hook.current("/api/auth/google/status");
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("redirects to /signin?error=session_expired when /api/auth/google/status returns 403", async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(403));

    const hook = getHook();
    await act(async () => {
      await hook.current("/api/auth/google/status");
    });

    expect(mockSetLocation).toHaveBeenCalledWith("/signin?error=session_expired");
  });
});

// ─── Non-403 error responses must NOT trigger logout ─────────────────────────

describe("useAdminFetch — non-403 responses pass through without logout", () => {
  it.each([401, 500, 404, 422])(
    "does not call logout() or redirect on HTTP %i",
    async (status) => {
      vi.mocked(fetch).mockResolvedValue(makeResponse(status));

      const hook = getHook();
      await act(async () => {
        await hook.current("/api/admin/users");
      });

      expect(mockLogout).not.toHaveBeenCalled();
      expect(mockSetLocation).not.toHaveBeenCalled();
    }
  );
});

// ─── Successful responses ─────────────────────────────────────────────────────

describe("useAdminFetch — successful response", () => {
  it("does not call logout() or redirect on HTTP 200", async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(200, { users: [] }));

    const hook = getHook();
    await act(async () => {
      await hook.current("/api/admin/users");
    });

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it("resolves with the response object on HTTP 200", async () => {
    const ok = makeResponse(200, { users: [] });
    vi.mocked(fetch).mockResolvedValue(ok);

    const hook = getHook();
    let res!: Response;
    await act(async () => {
      res = await hook.current("/api/admin/users");
    });

    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
  });
});

// ─── Network errors ───────────────────────────────────────────────────────────

describe("useAdminFetch — network errors", () => {
  it("propagates the rejection without calling logout()", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network failure"));

    const hook = getHook();
    await act(async () => {
      await expect(hook.current("/api/admin/users")).rejects.toThrow("Network failure");
    });

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });
});

// ─── Request options ──────────────────────────────────────────────────────────

describe("useAdminFetch — request options", () => {
  it("always sends credentials: include", async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(200));

    const hook = getHook();
    await act(async () => {
      await hook.current("/api/admin/users");
    });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect((options as RequestInit).credentials).toBe("include");
  });

  it("merges caller options while preserving credentials: include", async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(200));

    const hook = getHook();
    await act(async () => {
      await hook.current("/api/admin/stripe/seed/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/admin/stripe/seed/student");
    expect((options as RequestInit).method).toBe("POST");
    expect((options as RequestInit).credentials).toBe("include");
  });

  it("defaults to credentials: include when no credentials option is supplied by the caller", async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(200));

    const hook = getHook();
    await act(async () => {
      await hook.current("/api/admin/users", { method: "GET" });
    });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect((options as RequestInit).credentials).toBe("include");
  });
});
