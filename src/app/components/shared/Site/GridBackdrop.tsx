import { cn } from "@/lib/utils";

interface GridBackdropProps {
  /** "fixed" follows the viewport (public pages); "absolute" fills its positioned parent (overlays). */
  position?: "fixed" | "absolute";
  className?: string;
}

/** The faint 72px grid that fades out towards the bottom of the screen. */
export function GridBackdrop({ position = "fixed", className }: GridBackdropProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none inset-0 z-0 [background-image:linear-gradient(rgba(148,163,184,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.055)_1px,transparent_1px)] [background-size:72px_72px] [-webkit-mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_30%,transparent_75%)] [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_30%,transparent_75%)]",
        position,
        className,
      )}
    />
  );
}
