"use client";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, User, Settings, ChevronDown } from "lucide-react";
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
        className='flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 transition-all group'
      >
        <div className='relative w-8 h-8 rounded-full overflow-hidden border border-slate-700 group-hover:border-slate-600'>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className='object-cover'
            />
          ) : (
            <div className='w-full h-full bg-slate-700 flex items-center justify-center'>
              <User className='w-4 h-4 text-slate-400' />
            </div>
          )}
        </div>
        <span className='text-sm font-medium text-slate-300 group-hover:text-white max-w-[100px] truncate hidden sm:block'>
          {displayName}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
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
                <User className='w-4 h-4' />
                Profile
              </Link>
            </div>

            <div className='p-1.5 border-t border-white/5'>
              <button
                onClick={handleLogout}
                className='w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors'
              >
                <LogOut className='w-4 h-4' />
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
