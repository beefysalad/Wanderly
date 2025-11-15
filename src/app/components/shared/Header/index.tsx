"use client";

import { Compass, LogIn, Menu, UserPlus, X } from "lucide-react";
import Link from "next/link";
import React, { Fragment } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getAppVersion } from "@/lib/helper";

interface IHeaderProps {
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAuthDefaultTab: React.Dispatch<React.SetStateAction<"signin" | "signup">>;
  setShowQuickJoinModal?: React.Dispatch<React.SetStateAction<boolean>>;
}
const Header = ({
  setAuthDefaultTab,
  setShowAuthModal,
  setShowQuickJoinModal,
}: IHeaderProps) => {
  return (
    <Fragment>
      <header className='hidden md:flex items-center justify-between px-8 py-3 bg-white/5 backdrop-blur-xl border-b border-white/10 animate-fade-in-down'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <div className='absolute inset-0 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl blur-md opacity-50 animate-pulse-glow'></div>
            <div className='relative w-10 h-10 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center animate-bounce-slow shadow-lg'>
              <Compass className='w-6 h-6 text-purple-950' />
            </div>
          </div>
          <div>
            <h1 className='text-2xl font-bold bg-linear-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent'>
              Wanderly
            </h1>
            <p className='text-xs text-slate-400'>Plan your trip</p>
          </div>
        </div>
        <nav className='flex gap-3 items-center'>
          <Link
            href='/about'
            className='px-5 py-2 text-amber-400 hover:text-amber-300 transition-colors font-medium text-sm'
          >
            About
          </Link>
          <button
            onClick={() => {
              setAuthDefaultTab("signin");
              setShowAuthModal(true);
            }}
            className='px-5 py-2 border-2 border-amber-500/40 rounded-xl hover:bg-amber-500/10 hover:border-amber-400/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm font-medium text-sm'
          >
            Login
          </button>
          <button
            onClick={() => {
              setAuthDefaultTab("signup");
              setShowAuthModal(true);
            }}
            className='px-5 py-2 bg-linear-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 font-medium text-sm'
          >
            Sign Up
          </button>
        </nav>
      </header>
      <header className='md:hidden flex items-center justify-center px-4 py-4 bg-white/5 backdrop-blur-xl border-b border-amber-500/20 animate-fade-in-down relative'>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <div className='absolute inset-0 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl blur-md opacity-50 animate-pulse-glow'></div>
            <div className='relative w-9 h-9 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center animate-bounce-slow shadow-lg'>
              <Compass className='w-5 h-5 text-purple-950' />
            </div>
          </div>
          <div>
            <h1 className='text-xl font-bold bg-linear-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent'>
              Wanderly
            </h1>
            <p className='text-[10px] text-slate-400'>Plan your trip</p>
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='absolute right-4 text-white hover:bg-white/10'
              aria-label='Toggle menu'
            >
              <Menu className='h-5 w-5' />
            </Button>
          </SheetTrigger>
          <SheetContent
            side='right'
            className='bg-gradient-to-br from-slate-900 via-purple-900/95 to-slate-900 border-l border-amber-500/20 p-0 w-80 max-w-[85vw]'
          >
            <div className='flex flex-col h-full'>
              {/* Header */}
              <div className='flex items-center justify-between p-6 border-b border-white/10'>
                <SheetTitle className='text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent'>
                  Menu
                </SheetTitle>
                <SheetClose asChild>
                  <button
                    className='w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-amber-500/30 hover:bg-white/10 transition-all duration-300 active:scale-95'
                    aria-label='Close menu'
                  >
                    <X className='w-5 h-5 text-amber-400' />
                  </button>
                </SheetClose>
              </div>

              {/* Navigation */}
              <nav className='flex-1 p-6 space-y-3 overflow-y-auto'>
                <SheetClose asChild>
                  <Link
                    href='/about'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    About
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <button
                    onClick={() => {
                      setAuthDefaultTab("signup");
                      setShowAuthModal(true);
                    }}
                    className='w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/50 text-white'
                  >
                    <UserPlus className='w-4 h-4' />
                    Sign Up
                  </button>
                </SheetClose>

                <SheetClose asChild>
                  <button
                    onClick={() => {
                      setAuthDefaultTab("signin");
                      setShowAuthModal(true);
                    }}
                    className='w-full px-4 py-3 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 border border-slate-600 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-white'
                  >
                    <LogIn className='w-4 h-4' />
                    Login
                  </button>
                </SheetClose>

                {setShowQuickJoinModal && (
                  <SheetClose asChild>
                    <button
                      onClick={() => {
                        setShowQuickJoinModal(true);
                      }}
                      className='w-full text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4 transition py-2'
                    >
                      Quick Join as Guest
                    </button>
                  </SheetClose>
                )}
              </nav>

              {/* Footer */}
              <div className='p-6 border-t border-white/10'>
                <p className='text-xs text-slate-400 text-center'>
                  © 2025 Wanderly
                </p>
                <p className='text-xs text-slate-500 text-center mt-1'>
                  {getAppVersion()}
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </Fragment>
  );
};

export default Header;
