import { getAppVersion } from "@/lib/helper";
import { Compass } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className='relative z-10 px-6 py-12 md:py-16 mt-24 border-t border-white/5'>
      <div className='max-w-6xl mx-auto'>
        {/* Main Content */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-12 mb-12 text-center md:text-left'>
          {/* Brand Section */}
          <div className='md:col-span-5 space-y-6 flex flex-col items-center md:items-start'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <div className='absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-40'></div>
                <div className='relative w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center'>
                  <Compass className='w-7 h-7 text-purple-950' />
                </div>
              </div>
              <div>
                <h3 className='text-2xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent'>
                  Wanderly
                </h3>
                <p className='text-xs text-slate-500 font-medium'>
                  Plan trips, not chaos
                </p>
              </div>
            </div>
            <p className='text-slate-400 leading-relaxed max-w-sm'>
              The all-in-one platform for seamless group trip planning. Built
              for travelers who want less friction and more adventure.
            </p>
          </div>

          {/* Navigation Links */}
          <div className='md:col-span-4 space-y-4 flex flex-col items-center md:items-start'>
            <h4 className='text-sm font-bold text-white uppercase tracking-wider'>
              Explore
            </h4>
            <nav className='flex flex-col gap-3 items-center md:items-start'>
              <Link
                href='/'
                className='text-slate-400 hover:text-amber-400 transition-colors text-sm'
              >
                Home
              </Link>
              <Link
                href='/about'
                className='text-slate-400 hover:text-amber-400 transition-colors text-sm'
              >
                About
              </Link>
              <Link
                href='/faq'
                className='text-slate-400 hover:text-amber-400 transition-colors text-sm'
              >
                FAQ
              </Link>
              <Link
                href='/how-to'
                className='text-slate-400 hover:text-amber-400 transition-colors text-sm'
              >
                How To
              </Link>
              <Link
                href='/reviews'
                className='text-slate-400 hover:text-amber-400 transition-colors text-sm'
              >
                Reviews
              </Link>
            </nav>
          </div>

          {/* Status Section */}
          <div className='md:col-span-3 space-y-4 flex flex-col items-center md:items-start'>
            <h4 className='text-sm font-bold text-white uppercase tracking-wider'>
              Status
            </h4>
            <div className='space-y-3 flex flex-col items-center md:items-start'>
              <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full'>
                <div className='w-2 h-2 bg-amber-400 rounded-full animate-pulse'></div>
                <span className='text-xs font-bold text-amber-300 uppercase tracking-wider'>
                  Beta
                </span>
              </div>
              <p className='text-xs text-slate-500'>
                Version {getAppVersion()}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left'>
          <p className='text-slate-500 text-xs'>
            © 2025 Wanderly. All rights reserved.
          </p>
          <p className='text-slate-600 text-xs'>
            Made with care by{" "}
            <span className='text-slate-400 font-medium'>Patrick</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
