/** Shared class strings for the app's form fields, so every form looks the same. */
export const FIELD_LABEL = "font-mono text-[10px] uppercase tracking-[.16em] text-[#94a3b8]";

export const INPUT =
  "w-full rounded-xl border border-white/[.1] bg-[rgba(15,23,42,.6)] px-[15px] py-[13px] text-[15px] text-[#f8fafc] transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[#475569] focus:border-[rgba(251,191,36,.55)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(251,191,36,.12)]";

export const FIELD_ERROR = "text-[13px] text-[#f87171]";

/** Full-width gradient submit button. */
export const SUBMIT_BUTTON =
  "mt-[6px] flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-xl bg-[linear-gradient(100deg,#fbbf24,#f97316)] p-4 text-base font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)] disabled:cursor-not-allowed disabled:opacity-60";

/** A selectable pill, e.g. a category or payment method. */
export const CHIP = "flex cursor-pointer items-center gap-2 rounded-full border px-[14px] py-2 text-[13px] font-semibold";
export const CHIP_ON = "border-[rgba(251,191,36,.55)] bg-[rgba(251,191,36,.1)] text-[#f8fafc]";
export const CHIP_OFF = "border-white/[.1] bg-transparent text-[#cbd5e1]";
