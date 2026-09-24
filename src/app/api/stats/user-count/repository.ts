import prisma from "@/lib/prisma";

export function countUsers() {
  return prisma.user.count();
}
