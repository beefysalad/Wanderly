"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getAppVersion } from "@/lib/helper";
import { Compass, LogIn, Menu, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

const Header = () => {
  return (
    <Fragment>
      <header className='hidden md:flex items-center px-8 py-3 bg-white/5 backdrop-blur-xl border-b border-white/10 animate-fade-in-down relative'>
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
            className='bg-slate-950 border-l border-amber-500/20 p-0 w-80 max-w-[85vw]'
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
                    href='/'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    Home
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/about'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    About
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/faq'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    FAQ
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/how-to'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    How To
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/reviews'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    Reviews
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/register'
                    className='w-full px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium flex items-center gap-2'
                  >
                    Sign Up
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/login'
                    className='w-full px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium flex items-center gap-2'
                  >
                    Login
                  </Link>
                </SheetClose>
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
            className='bg-slate-950 border-l border-amber-500/20 p-0 w-80 max-w-[85vw]'
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
                    href='/'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    Home
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/about'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    About
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/faq'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    FAQ
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/how-to'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    How To
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/reviews'
                    className='block px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium'
                  >
                    Reviews
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/register'
                    className='w-full px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium flex items-center gap-2'
                  >
                    Sign Up
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href='/login'
                    className='w-full px-4 py-3 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 text-amber-400 font-medium flex items-center gap-2'
                  >
                    Login
                  </Link>
                </SheetClose>
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
