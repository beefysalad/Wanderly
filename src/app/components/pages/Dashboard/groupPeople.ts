import type { Group } from "@/src/shared/types";
import type { AvatarPerson } from "../../shared/UserAvatar";

/** A group's members as avatar entries, using the best name and photo the group data has. */
export function groupPeople(group: Group): AvatarPerson[] {
  return (group.memberEmails ?? []).map((email) => ({
    key: email,
    name: group.memberNames?.[email] || group.memberMetadata?.[email]?.name || email.split("@")[0],
    imageUrl: group.memberMetadata?.[email]?.imageUrl,
  }));
}
