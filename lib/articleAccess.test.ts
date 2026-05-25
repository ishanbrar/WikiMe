import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { canEditArticle } from "@/lib/articleAccess";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email: "user@example.com",
    ...overrides,
  } as User;
}

describe("canEditArticle", () => {
  it("allows the article owner", () => {
    expect(
      canEditArticle(makeUser({ id: "owner-1" }), {
        userId: "owner-1",
        creatorEmail: "owner@example.com",
      }),
    ).toBe(true);
  });

  it("allows a legacy creator match by email", () => {
    expect(
      canEditArticle(makeUser({ email: "Owner@Example.com" }), {
        userId: undefined,
        creatorEmail: "owner@example.com",
      }),
    ).toBe(true);
  });

  it("allows admins even when they do not own the article", () => {
    expect(
      canEditArticle(
        makeUser({
          id: "admin-1",
          email: "admin@sikhomode.org",
          app_metadata: { role: "admin" },
        }),
        {
          userId: "owner-1",
          creatorEmail: "owner@example.com",
        },
      ),
    ).toBe(true);
  });

  it("blocks signed-out users", () => {
    expect(
      canEditArticle(null, {
        userId: "owner-1",
        creatorEmail: "owner@example.com",
      }),
    ).toBe(false);
  });

  it("blocks signed-in non-admins when ownership is unknown", () => {
    expect(
      canEditArticle(makeUser({ id: "other-user" }), {
        userId: undefined,
        creatorEmail: undefined,
      }),
    ).toBe(false);
  });
});
