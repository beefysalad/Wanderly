import type { Group, PaymentLog } from "@/src/shared/types";

type PaymentLogSide = "payer" | "payee";

export function getMemberAvatarFromLog(
  log: PaymentLog,
  type: PaymentLogSide,
  group: Group | null,
): string | undefined {
  // First try to use imageUrl from the log itself
  if (type === "payer" && log.payerImageUrl) {
    return log.payerImageUrl;
  }
  if (type === "payee" && log.payeeImageUrl) {
    return log.payeeImageUrl;
  }

  // Fallback to memberMetadata lookup using email
  const email = type === "payer" ? log.payerEmail : log.payeeEmail;
  if (email && group?.memberMetadata?.[email]) {
    return group.memberMetadata[email].imageUrl;
  }

  // Try to find by name or email string
  const nameOrEmail = type === "payer" ? log.payer : log.payee;
  const memberEmail = group?.memberEmails?.find(
    (e) => e === nameOrEmail || e.split("@")[0] === nameOrEmail,
  );
  if (memberEmail && group?.memberMetadata?.[memberEmail]) {
    return group.memberMetadata[memberEmail].imageUrl;
  }

  // Try to find by name
  const foundEmail = Object.entries(group?.memberNames || {}).find(
    ([, name]) => name === nameOrEmail,
  )?.[0];
  if (foundEmail && group?.memberMetadata?.[foundEmail]) {
    return group.memberMetadata[foundEmail].imageUrl;
  }

  return undefined;
}

export function getMemberInitialsFromLog(log: PaymentLog, type: PaymentLogSide): string {
  const nameOrEmail = type === "payer" ? log.payer : log.payee;
  // If it looks like an email, use first 2 chars
  if (nameOrEmail.includes("@")) {
    return nameOrEmail.substring(0, 2).toUpperCase();
  }
  // Otherwise use first letter of each word or first 2 chars
  const parts = nameOrEmail.split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrEmail.substring(0, 2).toUpperCase();
}
