import prisma from "@/src/lib/prisma";

export function countUsers() {
  return prisma.user.count();
}
