import { ForbiddenError } from "@/lib/errors";

interface ModifyCheck {
  actorId: string;
  /** Users who own the item (creator, payer, assignee, ...). */
  allowedUserIds: (string | null | undefined)[];
  /** The group owner may always override. */
  groupOwnerId: string | null | undefined;
}

export function canModify({ actorId, allowedUserIds, groupOwnerId }: ModifyCheck): boolean {
  return allowedUserIds.includes(actorId) || groupOwnerId === actorId;
}

export function assertCanModify(check: ModifyCheck, message: string): void {
  if (!canModify(check)) {
    throw new ForbiddenError(message);
  }
}
