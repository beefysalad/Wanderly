import type { Group } from "@/src/shared/types";

export interface MemberRow {
  email: string;
  name: string;
  imageUrl?: string;
  role: "Owner" | "Member";
  isYou: boolean;
  /** "Joined Sep 2", or an empty string when the date is unknown. */
  joined: string;
}

/** The group's members, the owner first and then everyone else by name. */
export function memberRows(group: Group, userEmail: string): MemberRow[] {
  const rows = (group.memberEmails ?? []).map((email) => {
    const joinedAt = group.memberMetadata?.[email]?.joinedAt;
    return {
      email,
      name: group.memberNames?.[email] || group.memberMetadata?.[email]?.name || email.split("@")[0],
      imageUrl: group.memberMetadata?.[email]?.imageUrl,
      role: (email === group.createdByEmail ? "Owner" : "Member") as MemberRow["role"],
      isYou: email === userEmail,
      joined: joinedAt ? `Joined ${new Date(joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "",
    };
  });

  return rows.sort((a, b) => {
    if (a.role !== b.role) return a.role === "Owner" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
