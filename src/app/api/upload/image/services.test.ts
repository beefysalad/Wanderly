import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";

const mockUpload = vi.fn();
vi.mock("./cloudinary", () => ({ uploadImageBuffer: (...a: unknown[]) => mockUpload(...a) }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { uploadImageService } = await import("./services");

const image = (bytes = 10, type = "image/png") =>
  new File([new Uint8Array(bytes)], "qr.png", { type });

beforeEach(() => {
  vi.clearAllMocks();
  mockUpload.mockResolvedValue({ secure_url: "https://cdn/x.png", public_id: "pid" });
});

describe("uploadImageService", () => {
  it("rejects non-image files without uploading", async () => {
    await expect(uploadImageService(image(10, "application/pdf"), "users/avatars")).rejects.toThrow(
      ValidationError,
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("rejects files over 5MB", async () => {
    await expect(uploadImageService(image(5 * 1024 * 1024 + 1), "users/avatars")).rejects.toThrow(
      "File size must be less than 5MB",
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("uploads to the requested folder and returns the url and public id", async () => {
    const result = await uploadImageService(image(), "users/avatars", "u1");

    expect(mockUpload).toHaveBeenCalledWith(expect.any(Buffer), "users/avatars");
    expect(result).toEqual({ url: "https://cdn/x.png", publicId: "pid" });
  });
});
