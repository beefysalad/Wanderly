import { cn } from "@/lib/utils";
import { initialsOf, paletteFor } from "./avatarUtils";

interface UserAvatarProps {
  name: string;
  /** Anything stable (email, id) so a person keeps the same colour everywhere. */
  colorKey?: string;
  imageUrl?: string | null;
  /** Size and text-size classes, e.g. "size-9 text-xs". */
  className?: string;
}

/** A round photo, or initials on a colour when there isn't one. */
export function UserAvatar({ name, colorKey, imageUrl, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "relative box-border flex flex-none items-center justify-center overflow-hidden rounded-full font-bold",
        imageUrl ? "bg-[#0f172a]" : paletteFor(colorKey || name),
        className,
      )}
    >
      {imageUrl ? (
        // A plain <img>: avatars can come from Cloudinary or Google, and the CSP already allows both.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt='' className='size-full object-cover' />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

export interface AvatarPerson {
  key: string;
  name: string;
  imageUrl?: string | null;
}

interface AvatarStackProps {
  people: AvatarPerson[];
  max?: number;
  /** Size and text-size classes for each avatar. */
  sizeClass?: string;
}

/** Overlapping avatars with a "+N" chip for the rest. */
export function AvatarStack({ people, max = 4, sizeClass = "size-7 text-[10px]" }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div className='flex items-center'>
      {shown.map((person, index) => (
        <UserAvatar
          key={person.key}
          name={person.name}
          colorKey={person.key}
          imageUrl={person.imageUrl}
          className={cn("border-2 border-[#0b1120]", sizeClass, index > 0 && "-ml-2")}
        />
      ))}
      {extra > 0 ? (
        <span
          className={cn(
            "-ml-2 flex flex-none items-center justify-center rounded-full border-2 border-[#0b1120] bg-[#1e293b] font-semibold text-[#94a3b8]",
            sizeClass,
          )}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
