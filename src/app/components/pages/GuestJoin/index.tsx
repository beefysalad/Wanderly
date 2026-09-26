"use client";

import { motion, useAnimationControls } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";
import api from "@/lib/axios";
import { setGuestSession } from "@/lib/guest-session";
import { AuthItem, FIELD_LABEL, FormError, INPUT, SUBMIT_BUTTON } from "../../shared/AuthForm/AuthParts";
import { EASE, useRevealDistance } from "../../shared/Site/motion";

const CODE_LENGTH = 6;

interface FoundTrip {
  groupId: string;
  groupName: string;
  guestToken: string;
}

const clean = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const GuestJoin = () => {
  const router = useRouter();
  const [chars, setChars] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [found, setFound] = useState<FoundTrip | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const shake = useAnimationControls();
  const distance = useRevealDistance(18);

  const code = chars.join("");
  const complete = code.length === CODE_LENGTH;

  const edit = (next: string[]) => {
    setChars(next);
    // Changing the code invalidates a trip that was already found.
    setFound(null);
    setError(null);
  };

  const onChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = clean(event.target.value).slice(-1);
    const next = chars.slice();
    next[index] = value;
    edit(next);
    if (value && index < CODE_LENGTH - 1) boxes.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !chars[index] && index > 0) boxes.current[index - 1]?.focus();
  };

  // Pasting a whole code fills every box at once.
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = clean(event.clipboardData.getData("text")).slice(0, CODE_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    edit(Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? ""));
    boxes.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const lookUp = async () => {
    if (!complete) {
      boxes.current[chars.findIndex((c) => !c)]?.focus();
      shake.start({ x: [0, -6, 6, 0], transition: { duration: 0.3 } });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/groups/validate-code", { code });
      const { groupId, groupName, guestToken } = response.data ?? {};
      if (!groupId) throw new Error("Invalid response from server");
      setFound({ groupId, groupName: groupName ?? "this trip", guestToken });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "We couldn't find a trip with that code.");
    } finally {
      setLoading(false);
    }
  };

  const join = (event: React.FormEvent) => {
    event.preventDefault();
    if (!found) return;
    const guestName = name.trim();
    if (!guestName) {
      setError("Tell us what to call you first.");
      return;
    }
    setGuestSession(code, guestName, found.groupId, found.guestToken);
    router.push(`/guest/group/${found.groupId}`);
  };

  return (
    <main className='relative flex min-h-screen flex-col items-center justify-center bg-[#020617] px-[clamp(20px,4vw,48px)] py-[clamp(32px,6vw,72px)] font-[family-name:var(--font-geist-sans)] leading-[normal] text-[#f8fafc]'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0 [background-image:linear-gradient(rgba(148,163,184,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.05)_1px,transparent_1px)] [background-size:72px_72px] [-webkit-mask-image:radial-gradient(ellipse_70%_55%_at_50%_35%,#000_10%,transparent_70%)] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_35%,#000_10%,transparent_70%)]'
      />

      <AuthItem index={0} start={0.18} className='relative z-[1] mb-[clamp(28px,4vw,42px)]'>
        <Link href='/' className='flex items-center gap-[10px] text-inherit'>
          <Image src='/wanderly.png' alt='Wanderly' width={34} height={34} className='size-[34px] object-contain' />
          <span className='text-xl font-extrabold tracking-[-.02em] text-[#f8fafc]'>Wanderly</span>
        </Link>
      </AuthItem>

      <motion.div
        initial={{ opacity: 0, y: distance + 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: EASE }}
        className='relative z-[1] box-border w-full max-w-[520px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[clamp(26px,3.5vw,40px)] text-center shadow-[0_50px_100px_-50px_rgba(0,0,0,.9)]'
      >
        <AuthItem index={1} start={0.18}>
          <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(251,191,36,.28)] bg-[rgba(251,191,36,.06)] px-[14px] py-[6px] font-mono text-[10px] uppercase tracking-[.16em] text-[#fcd34d]'>
            Guest mode
          </div>
        </AuthItem>
        <AuthItem index={2} start={0.18}>
          <h1 className='mb-[10px] text-[clamp(26px,3.2vw,36px)] font-extrabold tracking-[-.03em]'>
            Got a code? You&apos;re in.
          </h1>
        </AuthItem>
        <AuthItem index={3} start={0.18}>
          <p className='mb-7 text-[15px] leading-[1.65] text-[#94a3b8]'>
            Enter the six characters someone sent you. No account, no password, nothing to install — just a read-only
            look at the trip.
          </p>
        </AuthItem>

        <AuthItem index={4} start={0.18}>
          <motion.div animate={shake} className='mb-[18px] flex justify-center gap-[clamp(6px,1.6vw,10px)] [perspective:600px]'>
            {chars.map((char, index) => (
              <motion.input
                key={index}
                ref={(el) => {
                  boxes.current[index] = el;
                }}
                value={char}
                onChange={(event) => onChange(index, event)}
                onKeyDown={(event) => onKeyDown(index, event)}
                onPaste={onPaste}
                maxLength={2}
                autoCapitalize='characters'
                autoComplete='off'
                spellCheck={false}
                aria-label={`Code character ${index + 1}`}
                initial={{ opacity: 0, rotateX: -70 }}
                animate={{ opacity: 1, rotateX: 0 }}
                transition={{ duration: 0.5, delay: 0.35 + index * 0.06, ease: EASE }}
                className='box-content h-[clamp(50px,9vw,68px)] w-[clamp(40px,8vw,58px)] rounded-[13px] px-[2px] py-[1px] border border-white/[.12] bg-[rgba(2,6,23,.8)] text-center font-mono text-[clamp(20px,3.4vw,26px)] font-semibold uppercase text-[#fbbf24] transition-[border-color,box-shadow] duration-[180ms] focus:border-[rgba(251,191,36,.7)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(251,191,36,.14)]'
              />
            ))}
          </motion.div>
        </AuthItem>

        {error ? (
          <div className='mb-4'>
            <FormError>{error}</FormError>
          </div>
        ) : null}

        {found ? (
          <motion.form
            onSubmit={join}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className='flex flex-col gap-4 text-left'
          >
            <div className='rounded-2xl border border-[rgba(52,211,153,.28)] bg-[rgba(52,211,153,.07)] p-[18px]'>
              <div className='mb-3 flex items-center gap-[10px]'>
                <Check className='size-4 text-[#34d399]' />
                <span className='text-[13px] font-semibold text-[#34d399]'>Trip found — read-only</span>
              </div>
              <p className='text-lg font-extrabold'>{found.groupName}</p>
            </div>
            <label className='flex flex-col gap-[7px]'>
              <span className={FIELD_LABEL}>What should we call you?</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                type='text'
                autoComplete='given-name'
                placeholder='Your name (e.g. John)'
                className={INPUT}
              />
            </label>
            <button type='submit' className={SUBMIT_BUTTON.replace("mt-[6px] ", "")}>
              Join as guest <ArrowRight className='size-[17px]' />
            </button>
          </motion.form>
        ) : (
          <AuthItem index={5} start={0.18}>
            <button
              type='button'
              onClick={lookUp}
              disabled={loading}
              className={SUBMIT_BUTTON.replace("mt-[6px] ", "")}
            >
              {loading ? (
                <>
                  <Loader2 className='size-[17px] animate-spin' /> Looking…
                </>
              ) : (
                <>
                  Look at the trip <ArrowRight className='size-[17px]' />
                </>
              )}
            </button>
          </AuthItem>
        )}

        <AuthItem
          index={6}
          start={0.18}
          className='mt-6 flex flex-wrap justify-between gap-[10px] border-t border-white/[.07] pt-5 text-sm text-[#94a3b8]'
        >
          <span>
            Want to edit things?{" "}
            <Link href='/register' className='font-semibold text-[#fbbf24] hover:text-[#fcd34d]'>
              Start free
            </Link>
          </span>
          <Link href='/login' className='text-[#94a3b8]'>
            Login
          </Link>
        </AuthItem>
      </motion.div>

      <AuthItem index={7} start={0.18} className='relative z-[1] mt-[26px] max-w-[420px] text-center'>
        <p className='text-xs leading-[1.6] text-[#475569]'>
          Guests can see the schedule and what&apos;s owed. Emails and payment details stay hidden.
        </p>
      </AuthItem>
    </main>
  );
};

export default GuestJoin;
