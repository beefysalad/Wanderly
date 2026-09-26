"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE, useRevealDistance } from "./motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/** Fades and slides its content in once it scrolls into view. */
export function Reveal({ children, className }: RevealProps) {
  const distance = useRevealDistance();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
