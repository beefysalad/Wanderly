import prisma from "@/lib/prisma";

/**
 * Generates a random 6-character alphanumeric code (uppercase letters and numbers)
 * Excludes similar-looking characters (0, O, I, 1) for better readability
 */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded: 0, O, I, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a unique group code that doesn't exist in the database
 * Retries up to 10 times if code collision occurs
 */
export async function generateUniqueGroupCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateCode();
    const existing = await prisma.group.findUnique({
      where: { code },
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error(
    "Failed to generate unique group code after multiple attempts"
  );
}
