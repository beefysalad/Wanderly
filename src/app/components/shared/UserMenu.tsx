"use client";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const UserMenu = () => {
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) return null;

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const avatarUrl = user.photoURL;

  return (
    <div className='relative' ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative w-9 h-9 rounded-full overflow-hidden transition-all hover:ring-2 hover:ring-white/20 outline-none'
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className='object-cover'
          />
        ) : (
          <div className='w-full h-full bg-slate-800 flex items-center justify-center border border-white/10'>
            <User className='w-5 h-5 text-slate-400' />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className='absolute right-0 top-full mt-2 w-56 bg-slate-900 rounded-xl border border-white/10 shadow-xl overflow-hidden z-50 ring-1 ring-black/5'
          >
            <div className='p-2 border-b border-white/5'>
              <p className='px-3 py-1.5 text-sm font-medium text-white truncate'>
                {displayName}
              </p>
              <p className='px-3 pb-1.5 text-xs text-slate-400 truncate'>
                {user.email}
              </p>
            </div>

            <div className='p-1.5'>
              <Link
                href='/profile'
                onClick={() => setIsOpen(false)}
                className='flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors'
              >
                Profile
              </Link>
            </div>

            <div className='p-1.5 border-t border-white/5'>
              <button
                onClick={handleLogout}
                className='w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors'
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
