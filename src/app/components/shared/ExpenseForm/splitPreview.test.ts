import { describe, expect, it } from "vitest";
import { splitShareCents } from "@/src/app/api/trips/[tripId]/expenses/transformers";
import { previewShares } from "./splitPreview";

const me = "me@x.com";
const member = (email: string) => ({ user: { email }, tempName: null });
const guest = (name: string) => ({ user: null, tempName: name });

describe("previewShares", () => {
  it("previews ₱100 three ways as 33.34 / 33.33 / 33.33, the extra centavo on the payer", () => {
    expect(previewShares("100", [me, "mj@x.com", "rc@x.com"], "mj@x.com")).toEqual([33.33, 33.34, 33.33]);
    expect(previewShares("100", [me, "mj@x.com", "rc@x.com"], "someone@x.com")).toEqual([33.34, 33.33, 33.33]);
  });

  it("matches what the server computes for the saved expense, guests included", () => {
    const saved = {
      amount: 250.01,
      paidBy: null,
      tempPaidBy: "Ate Joy",
      splits: [member(me), guest("Ate Joy"), member("mj@x.com"), guest("Kuya Ben")],
    };

    expect(previewShares("250.01", [me, "Ate Joy", "mj@x.com", "Kuya Ben"], "Ate Joy")).toEqual(
      splitShareCents(saved).map((cents) => cents / 100),
    );
  });

  it("previews zeros while the amount is blank, invalid or negative, and nothing for an empty split", () => {
    expect(previewShares("", [me, "mj@x.com"], me)).toEqual([0, 0]);
    expect(previewShares("abc", [me, "mj@x.com"], me)).toEqual([0, 0]);
    expect(previewShares("-50", [me, "mj@x.com"], me)).toEqual([0, 0]);
    expect(previewShares("1e30", [me, "mj@x.com"], me)).toEqual([0, 0]);
    expect(previewShares("100", [], me)).toEqual([]);
  });
});
