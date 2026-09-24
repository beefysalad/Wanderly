import { describe, expect, it } from "vitest";
import { uploadFolderSchema } from "./schemas";

describe("uploadFolderSchema", () => {
  it("defaults to the QR-code folder and accepts the avatar folder", () => {
    expect(uploadFolderSchema.parse(undefined)).toBe("expenses/qr-codes");
    expect(uploadFolderSchema.parse("users/avatars")).toBe("users/avatars");
  });

  it("rejects arbitrary folder paths", () => {
    expect(uploadFolderSchema.safeParse("../../admin").success).toBe(false);
    expect(uploadFolderSchema.safeParse("other").success).toBe(false);
  });
});
