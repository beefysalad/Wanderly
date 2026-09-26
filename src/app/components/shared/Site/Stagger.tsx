"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE, useRevealDistance } from "./motion";

interface StaggerGroupProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each item. */
  gap?: number;
  /** How far up the viewport the group must reach before it plays. */
  margin?: string;
}

/** Plays its <StaggerItem>s one after the other when the group scrolls into view. */
export function StaggerGroup({ children, className, gap = 0.09, margin = "0px 0px -12% 0px" }: StaggerGroupProps) {
  return (
    <motion.div
      className={className}
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, margin }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function StaggerItem({ children, className, duration = 0.7 }: StaggerItemProps) {
  const distance = useRevealDistance(24) + 8;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: distance, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
