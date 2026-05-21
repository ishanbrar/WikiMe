import { describe, expect, it } from "vitest";
import {
  isTransientFailure,
  isTransientHttpStatus,
  isTransientNetworkError,
  withTransientRetry,
} from "@/lib/transientRetry";

describe("transientRetry", () => {
  it("classifies common HTTP statuses as transient", () => {
    expect(isTransientHttpStatus(502)).toBe(true);
    expect(isTransientHttpStatus(503)).toBe(true);
    expect(isTransientHttpStatus(504)).toBe(true);
    expect(isTransientHttpStatus(400)).toBe(false);
  });

  it("detects network-style TypeErrors", () => {
    expect(isTransientNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isTransientNetworkError(new TypeError("Load failed"))).toBe(true);
    expect(
      isTransientNetworkError(new TypeError("undefined is not a function")),
    ).toBe(false);
  });

  it("detects wrapped API transient messages", () => {
    expect(
      isTransientFailure(new Error("Article API returned HTTP 503 (transient).")),
    ).toBe(true);
    expect(
      isTransientFailure(
        new Error("Realism article: Article API returned HTTP 502 (transient)."),
      ),
    ).toBe(true);
    expect(isTransientFailure(new Error("Invalid request"))).toBe(false);
  });

  it("retries until success", async () => {
    let n = 0;
    const result = await withTransientRetry(
      async () => {
        n += 1;
        if (n < 3) throw new TypeError("Failed to fetch");
        return "ok";
      },
      { maxAttempts: 5, baseDelayMs: 1 },
    );
    expect(result).toBe("ok");
    expect(n).toBe(3);
  });

  it("stops on non-transient errors", async () => {
    let n = 0;
    await expect(
      withTransientRetry(
        async () => {
          n += 1;
          throw new Error("Invalid request");
        },
        { maxAttempts: 4, baseDelayMs: 1 },
      ),
    ).rejects.toThrow("Invalid request");
    expect(n).toBe(1);
  });
});
