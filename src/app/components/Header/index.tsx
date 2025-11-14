import { Compass } from "lucide-react";
import React, { Fragment } from "react";

interface IHeaderProps {
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAuthDefaultTab: React.Dispatch<React.SetStateAction<"signin" | "signup">>;
}
const Header = ({ setAuthDefaultTab, setShowAuthModal }: IHeaderProps) => {
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
            <p className='text-xs text-slate-400'>By Ptrck for Ptrck</p>
          </div>
        </div>
        <nav className='flex gap-3 items-center'>
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
      <header className='md:hidden flex items-center justify-center px-4 py-4 bg-white/5 backdrop-blur-xl border-b border-amber-500/20 animate-fade-in-down'>
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
            <p className='text-[10px] text-slate-400'>By Ptrck for Ptrck</p>
          </div>
        </div>
      </header>
    </Fragment>
  );
};

export default Header;
