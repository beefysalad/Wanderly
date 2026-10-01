import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./schemas";

describe("updateProfileSchema", () => {
  it("requires at least one field", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a Cloudinary or Google-hosted photoURL", () => {
    expect(updateProfileSchema.safeParse({ photoURL: "https://res.cloudinary.com/demo/x.jpg" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ photoURL: "https://lh3.googleusercontent.com/a/x" }).success).toBe(true);
  });

  it("rejects a photoURL on an unrelated host", () => {
    expect(updateProfileSchema.safeParse({ photoURL: "https://evil.com/x.jpg" }).success).toBe(false);
  });
});
