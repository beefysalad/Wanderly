import { getAppVersion } from "@/lib/helper";
import { Compass, Home, Info, HelpCircle, Sparkles } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className='relative z-10 px-4 md:px-8 py-6 md:py-12 mt-16 md:mt-24 border-t border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl'>
      <div className='max-w-7xl mx-auto'>
        {/* Mobile: Simplified Layout */}
        <div className='md:hidden space-y-6 mb-6'>
          {/* Brand */}

          {/* Quick Links - Compact Grid */}
          <nav className='grid grid-cols-2 gap-2'>
            <Link
              href='/'
              className='flex items-center justify-center gap-1.5 py-2 text-slate-300 hover:text-amber-400 transition-colors duration-300 text-xs'
            >
              <Home className='w-3.5 h-3.5' />
              <span>Home</span>
            </Link>
            <Link
              href='/about'
              className='flex items-center justify-center gap-1.5 py-2 text-slate-300 hover:text-amber-400 transition-colors duration-300 text-xs'
            >
              <Info className='w-3.5 h-3.5' />
              <span>About</span>
            </Link>
            <Link
              href='/faq'
              className='flex items-center justify-center gap-1.5 py-2 text-slate-300 hover:text-amber-400 transition-colors duration-300 text-xs'
            >
              <HelpCircle className='w-3.5 h-3.5' />
              <span>FAQ</span>
            </Link>
            <Link
              href='/reviews'
              className='flex items-center justify-center gap-1.5 py-2 text-slate-300 hover:text-amber-400 transition-colors duration-300 text-xs'
            >
              <Sparkles className='w-3.5 h-3.5' />
              <span>Reviews</span>
            </Link>
          </nav>
        </div>

        {/* Desktop: Full Layout */}
        <div className='hidden md:grid grid-cols-3 gap-12 mb-8'>
          {/* Brand Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <div className='absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-md opacity-50 animate-pulse-glow'></div>
                <div className='relative w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg'>
                  <Compass className='w-6 h-6 text-purple-950' />
                </div>
              </div>
              <div>
                <h3 className='text-xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent'>
                  Wanderly
                </h3>
                <p className='text-xs text-slate-400'>Plan your trip</p>
              </div>
            </div>
            <p className='text-sm text-slate-400 leading-relaxed'>
              The all-in-one platform for seamless group trip planning
            </p>
          </div>

          {/* Quick Links Section */}
          <div className='space-y-4'>
            <h4 className='text-base font-semibold text-white mb-4'>
              Quick Links
            </h4>
            <nav className='flex flex-col gap-3'>
              <Link
                href='/'
                className='flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors duration-300 group'
              >
                <Home className='w-4 h-4 group-hover:scale-110 transition-transform' />
                <span className='text-sm'>Home</span>
              </Link>
              <Link
                href='/about'
                className='flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors duration-300 group'
              >
                <Info className='w-4 h-4 group-hover:scale-110 transition-transform' />
                <span className='text-sm'>About</span>
              </Link>
              <Link
                href='/faq'
                className='flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors duration-300 group'
              >
                <HelpCircle className='w-4 h-4 group-hover:scale-110 transition-transform' />
                <span className='text-sm'>FAQ</span>
              </Link>
              <Link
                href='/reviews'
                className='flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors duration-300 group'
              >
                <Sparkles className='w-4 h-4 group-hover:scale-110 transition-transform' />
                <span className='text-sm'>Reviews</span>
              </Link>
            </nav>
          </div>

          {/* Contact/Info Section */}
          <div className='space-y-4'>
            <h4 className='text-base font-semibold text-white mb-4'>About</h4>
            <div className='space-y-3 text-sm text-slate-400'>
              <p className='leading-relaxed'>
                Built with precision and care for travelers who want to plan
                better trips.
              </p>
              <div className='pt-2 border-t border-white/10'>
                <p className='text-xs text-slate-500'>
                  Made by Ptrck for Ptrck
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='pt-4 md:pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs md:text-sm'>
          <p className='text-slate-400 text-center md:text-left text-xs'>
            © 2025 Wanderly. All rights reserved.
          </p>
          <div className='flex items-center gap-3 md:gap-4'>
            <span className='text-slate-400 text-xs'>{getAppVersion()}</span>
            <span className='px-2.5 md:px-3 py-0.5 md:py-1 bg-amber-500/10 text-amber-300 text-[10px] md:text-xs font-semibold rounded-full border border-amber-500/30'>
              BETA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
