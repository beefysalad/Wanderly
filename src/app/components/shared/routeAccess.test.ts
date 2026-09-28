import { describe, expect, it } from "vitest";
import type { User } from "firebase/auth";
import { guardOutcome, routeAccess } from "./routeAccess";

const user = { uid: "u1" } as User;

describe("routeAccess", () => {
  it.each(["/", "/about", "/faq", "/reviews", "/how-to", "/features", "/how-it-works"])(
    "treats the marketing page %s as public",
    (path) => {
      expect(routeAccess(path)).toBe("public");
    },
  );

  it.each(["/guest", "/guest/abc123", "/invite/ABC123", "/admin", "/admin/users"])(
    "treats %s as public because the page checks access itself",
    (path) => {
      expect(routeAccess(path)).toBe("public");
    },
  );

  it.each(["/login", "/register"])("treats %s as guest-only", (path) => {
    expect(routeAccess(path)).toBe("guestOnly");
  });

  it.each(["/dashboard", "/groups", "/group/g1", "/trips", "/profile", "/notifications", "/faq/extra"])(
    "requires sign-in for %s",
    (path) => {
      expect(routeAccess(path)).toBe("protected");
    },
  );
});

describe("guardOutcome", () => {
  it("holds a protected page while Firebase has not reported yet", () => {
    expect(guardOutcome("protected", { user: null, loading: true })).toEqual({ render: false, redirectTo: null });
  });

  it("holds a guest-only page while Firebase has not reported yet", () => {
    expect(guardOutcome("guestOnly", { user: null, loading: true })).toEqual({ render: false, redirectTo: null });
  });

  it("sends a signed-out visitor away from a protected page", () => {
    expect(guardOutcome("protected", { user: null, loading: false })).toEqual({ render: false, redirectTo: "/" });
  });

  it("renders a protected page for a signed-in user", () => {
    expect(guardOutcome("protected", { user, loading: false })).toEqual({ render: true, redirectTo: null });
  });

  it("sends a signed-in user from login/register to the dashboard", () => {
    expect(guardOutcome("guestOnly", { user, loading: false })).toEqual({ render: false, redirectTo: "/dashboard" });
  });

  it("renders login/register for a signed-out visitor", () => {
    expect(guardOutcome("guestOnly", { user: null, loading: false })).toEqual({ render: true, redirectTo: null });
  });
});
