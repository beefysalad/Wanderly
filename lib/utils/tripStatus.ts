export type TripStatus = "planning" | "finalized" | "ongoing" | "cancelled";

interface StatusStyle {
  label: string;
  /** Pill: text colour, 10% fill, 30% border. */
  pill: string;
}

const STATUS: Record<TripStatus, StatusStyle> = {
  planning: {
    label: "Planning",
    pill: "border-[rgba(148,163,184,.25)] bg-[rgba(148,163,184,.1)] text-[#cbd5e1]",
  },
  finalized: {
    label: "Finalized",
    pill: "border-[rgba(251,191,36,.3)] bg-[rgba(251,191,36,.1)] text-[#fbbf24]",
  },
  ongoing: {
    label: "Ongoing",
    pill: "border-[rgba(52,211,153,.3)] bg-[rgba(52,211,153,.1)] text-[#34d399]",
  },
  cancelled: {
    label: "Cancelled",
    pill: "border-[rgba(248,113,113,.3)] bg-[rgba(248,113,113,.1)] text-[#f87171]",
  },
};

/** A trip with no status yet is still being planned. */
export function getTripStatus(status?: string): StatusStyle & { key: TripStatus } {
  const key = (status && status in STATUS ? status : "planning") as TripStatus;
  return { key, ...STATUS[key] };
}
