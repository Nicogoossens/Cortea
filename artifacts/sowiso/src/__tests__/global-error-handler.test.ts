import { describe, it, expect, vi } from "vitest";
import { globalErrorHandler } from "../../../api-server/src/lib/error-handler";

/**
 * Verifies the api-server's global Express error handler produces a clean
 * JSON 500 response, never leaks the stack trace in production, and routes
 * the error through req.log when one is attached. The handler is exercised
 * directly with mock req/res so the test stays free of an HTTP server and
 * doesn't pull in the whole app graph (db, stripe, …).
 */

interface MockResponse {
  statusCode: number | null;
  body: unknown;
  headersSent: boolean;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
}

function makeRes(headersSent = false): MockResponse {
  const res: MockResponse = {
    statusCode: null,
    body: null,
    headersSent,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function makeReq(reqId = "req-test-1") {
  const log = { error: vi.fn() };
  return {
    id: reqId,
    log,
  } as unknown as Parameters<typeof globalErrorHandler>[1];
}

describe("globalErrorHandler", () => {
  it("returns JSON 500 with reqId and stack in non-production", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const err = new Error("boom-development");
    const req = makeReq("req-dev-1");
    const res = makeRes();
    const next = vi.fn();

    globalErrorHandler(err, req, res as never, next);

    expect((res as unknown as MockResponse).statusCode).toBe(500);
    const body = (res as unknown as MockResponse).body as {
      error: string;
      reqId: string;
      stack?: string;
    };
    expect(body.error).toBe("Internal server error");
    expect(body.reqId).toBe("req-dev-1");
    expect(body.stack).toBeTypeOf("string");
    expect(body.stack).toContain("boom-development");
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = prev;
  });

  it("omits the stack when NODE_ENV=production", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    // Re-import the module so the `isProduction` constant inside it is
    // recomputed under the new env. Vite/Vitest caches ESM modules, so we
    // need a fresh evaluation to flip the production flag.
    vi.resetModules();
    const mod = await import("../../../api-server/src/lib/error-handler");

    const err = new Error("boom-production");
    const req = makeReq("req-prod-1");
    const res = makeRes();
    const next = vi.fn();

    mod.globalErrorHandler(err, req, res as never, next);

    expect((res as unknown as MockResponse).statusCode).toBe(500);
    const body = (res as unknown as MockResponse).body as {
      error: string;
      reqId: string;
      stack?: string;
    };
    expect(body.error).toBe("Internal server error");
    expect(body.reqId).toBe("req-prod-1");
    expect(body.stack).toBeUndefined();

    process.env.NODE_ENV = prev;
  });

  it("logs through req.log.error with the error and reqId", () => {
    const err = new Error("logged-error");
    const req = makeReq("req-log-1");
    const log = (req as unknown as { log: { error: ReturnType<typeof vi.fn> } }).log;
    const res = makeRes();
    const next = vi.fn();

    globalErrorHandler(err, req, res as never, next);

    expect(log.error).toHaveBeenCalledTimes(1);
    const [meta, msg] = log.error.mock.calls[0];
    expect(meta).toMatchObject({ err, reqId: "req-log-1" });
    expect(msg).toMatch(/unhandled/i);
  });

  it("does nothing extra when headers were already sent", () => {
    const err = new Error("late-failure");
    const req = makeReq("req-late-1");
    const res = makeRes(true);
    const originalStatus = res.status;
    res.status = vi.fn(() => res) as unknown as typeof res.status;
    const next = vi.fn();

    globalErrorHandler(err, req, res as never, next);

    expect(res.status).not.toHaveBeenCalled();
    expect((res as unknown as MockResponse).body).toBeNull();
    res.status = originalStatus;
  });
});
