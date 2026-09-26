"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE, useRevealDistance } from "./motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Travel distance in px before it settles; the pages use 24 or 26. */
  distance?: number;
  /** Seconds to wait once it is in view (used to stagger a page intro). */
  delay?: number;
  /** Play immediately on mount instead of waiting to scroll into view. */
  immediate?: boolean;
}

/** Fades and slides its content in, once it scrolls into view (or straight away for a page intro). */
export function Reveal({ children, className, distance = 26, delay = 0, immediate = false }: RevealProps) {
  const y = useRevealDistance(distance);
  const transition = { duration: immediate ? 0.75 : 0.7, delay, ease: EASE };

  if (immediate) {
    return (
      <motion.div className={className} initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={transition}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
