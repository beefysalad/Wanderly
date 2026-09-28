import { describe, expect, it } from "vitest";
import { imageUrlSchema, isAllowedImageUrl } from "./imageUrl";

describe("isAllowedImageUrl", () => {
  it("accepts an empty string (no image)", () => {
    expect(isAllowedImageUrl("")).toBe(true);
  });

  it("accepts a Cloudinary URL", () => {
    expect(isAllowedImageUrl("https://res.cloudinary.com/demo/image/upload/x.jpg")).toBe(true);
  });

  it("accepts a Google avatar URL", () => {
    expect(isAllowedImageUrl("https://lh3.googleusercontent.com/a/x")).toBe(true);
  });

  it("rejects a URL on an unrelated host", () => {
    expect(isAllowedImageUrl("https://evil.com/image.png")).toBe(false);
  });

  it("rejects a host that merely contains the allowed name", () => {
    expect(isAllowedImageUrl("https://res.cloudinary.com.evil.com/x.jpg")).toBe(false);
  });

  it("rejects a non-URL string", () => {
    expect(isAllowedImageUrl("not a url")).toBe(false);
  });

  it("rejects a URL over the length limit", () => {
    const longPath = "a".repeat(2048);
    expect(isAllowedImageUrl(`https://res.cloudinary.com/${longPath}`)).toBe(false);
  });
});

describe("imageUrlSchema", () => {
  it("parses an allowed URL", () => {
    expect(imageUrlSchema.parse("https://res.cloudinary.com/demo/x.jpg")).toBe(
      "https://res.cloudinary.com/demo/x.jpg",
    );
  });

  it("rejects a disallowed host", () => {
    expect(() => imageUrlSchema.parse("https://evil.com/x.jpg")).toThrow();
  });
});
