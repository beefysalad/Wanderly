"use client";
import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import Footer from "../../shared/Footer";
import Header from "../../shared/Header";
import QuickJoinModal from "../../shared/Modal/QuickJoinModal";
import FloatingPanels from "./FloatingPanels";
import HeroSection from "./HeroSection";
import { useRouter } from "next/navigation";

export interface IUserCredentials {
  email: string;
  password: string;
}
interface ILandingPropsPage {
  onQuickJoin: (code: string, guestName: string) => void;
}
const LandingPage = ({ onQuickJoin }: ILandingPropsPage) => {
  const router = useRouter();
  const [showQuickJoinModal, setShowQuickJoinModal] = useState<boolean>(false);

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <main className='min-h-screen bg-slate-950 text-white relative flex flex-col overflow-hidden'>
      {/* Background Effects matching Login/Register */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      {/* Content */}
      <div className='relative z-10 flex-1 flex flex-col overflow-y-auto'>
        <Header setShowQuickJoinModal={setShowQuickJoinModal} />
        <section className='px-4 md:px-8 flex-1 flex items-center md:items-start justify-center sm:mt-24 mt-14 min-h-[calc(100vh-200px)] pb-16 md:pb-24'>
          <div className='w-full max-w-7xl'>
            <div className='grid md:grid-cols-2 gap-12 items-center'>
              <div className='space-y-6 relative'>
                <HeroSection />
                <div
                  className='hidden md:flex flex-col sm:flex-row gap-3 pt-4 animate-slide-in-left'
                  style={{ animationDelay: "0.4s" }}
                >
                  <button
                    onClick={(e) => {
                      createRipple(e);
                      router.push("/register");
                    }}
                    className='relative px-8 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] hover:bg-[length:100%_100%] rounded-lg font-semibold transition-all duration-500 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/60 text-sm overflow-hidden group animate-gradient-shift'
                  >
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700'></div>
                    <UserPlus className='w-4 h-4 relative z-10' />
                    <span className='relative z-10'>Start Planning Free</span>
                  </button>
                  <button
                    onClick={(e) => {
                      createRipple(e);
                      router.push("/login");
                    }}
                    className='relative px-8 py-3 bg-transparent hover:bg-orange-600/10 border-2 border-orange-500 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 text-sm shadow-lg hover:shadow-orange-500/50 group overflow-hidden'
                  >
                    <div className='absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                    <LogIn className='w-4 h-4 relative z-10' />
                    <span className='relative z-10'>Login</span>
                  </button>
                </div>

                <div
                  className='hidden md:block pt-2 animate-slide-in-left'
                  style={{ animationDelay: "0.6s" }}
                >
                  <button
                    onClick={() => setShowQuickJoinModal(true)}
                    className='group relative text-sm text-amber-400 hover:text-amber-300 cursor-pointer transition-all duration-300'
                  >
                    <span className='relative inline-block'>
                      Quick Join as Guest (View Only)
                      <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300'></span>
                    </span>
                  </button>
                </div>
              </div>

              <FloatingPanels />
            </div>
          </div>
        </section>

        <div className='md:hidden px-4 pb-8 space-y-3 animate-slide-up'>
          <div className='flex flex-col gap-3'>
            <button
              onClick={(e) => {
                createRipple(e);
                router.push("/register");
              }}
              className='relative w-full px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] hover:bg-[length:100%_100%] rounded-xl font-semibold transition-all duration-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 text-sm border border-amber-400/50 overflow-hidden group'
            >
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-500'></div>
              <UserPlus className='w-4 h-4 relative z-10' />
              <span className='relative z-10'>Start Planning Free</span>
            </button>
            <button
              onClick={(e) => {
                createRipple(e);
                router.push("/login");
              }}
              className='relative w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 border border-orange-500 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm shadow-lg shadow-orange-500/30 group overflow-hidden'
            >
              <LogIn className='w-4 h-4' />
              <span>Login</span>
            </button>
          </div>
          <button
            onClick={() => setShowQuickJoinModal(true)}
            className='group w-full text-sm text-amber-400 hover:text-amber-300 transition-all duration-300 text-center py-1 relative'
          >
            <span className='relative inline-block'>
              Quick Join as Guest (View Only)
              <span className='absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300'></span>
            </span>
          </button>
        </div>
        <Footer />
      </div>

      {showQuickJoinModal && (
        <QuickJoinModal
          onClose={() => setShowQuickJoinModal(false)}
          onJoin={onQuickJoin}
        />
      )}
    </main>
  );
};

export default LandingPage;
