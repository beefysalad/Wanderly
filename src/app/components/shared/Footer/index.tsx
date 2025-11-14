import { getAppVersion } from "@/lib/helper";

const Footer = () => {
  return (
    <footer className='relative z-10 px-4 md:px-8 py-4 border-t border-white/10 bg-white/5 backdrop-blur-xl'>
      <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm'>
        <p className='text-slate-400'>
          © 2025 Wanderly. Made by Ptrck for Ptrck
        </p>
        <div className='flex gap-4'>
          <a
            href='/about'
            className='text-slate-400 hover:text-amber-400 transition-colors'
          >
            About
          </a>
          <span className='text-slate-600'>|</span>
          <span className='text-slate-400'>{getAppVersion()}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
