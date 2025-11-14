"use client";
import { LogIn, MapPin, UserPlus, Users, Zap } from "lucide-react";
import { useState } from "react";
import AuthModal from "../Modal/AuthModal";
import Footer from "../Footer";
import Header from "../Header";
import QuickJoinModal from "../Modal/QuickJoinModal";
import PulseBackground from "./PulseBackground";
import FloatingPanels from "./FloatingPanels";
import HeroSection from "./HeroSection";

export interface IUserCredentials {
  email: string;
  password: string;
}
interface ILandingPropsPage {
  onQuickJoin: (code: string, guestName: string) => void;
}
const LandingPage = ({ onQuickJoin }: ILandingPropsPage) => {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "signup">(
    "signin"
  );

  const [showQuickJoinModal, setShowQuickJoinModal] = useState<boolean>(false);

  return (
    <main className='min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative flex flex-col'>
      <PulseBackground />
      {/* Content */}
      <div className='relative z-10 flex-1 flex flex-col overflow-y-auto'>
        <Header
          setAuthDefaultTab={setAuthDefaultTab}
          setShowAuthModal={setShowAuthModal}
        />
        <section className='px-4 md:px-8 flex-1 flex md:items-center justify-center mt-16'>
          <div className='w-full max-w-7xl'>
            <div className='grid md:grid-cols-2 gap-12 items-center'>
              <div className='space-y-6 relative'>
                <HeroSection />
                <div
                  className='hidden md:flex flex-col sm:flex-row gap-3 pt-4 animate-slide-in-left'
                  style={{ animationDelay: "0.4s" }}
                >
                  <button
                    onClick={() => {
                      setAuthDefaultTab("signup");
                      setShowAuthModal(true);
                    }}
                    className='px-6 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/50 text-sm'
                  >
                    <UserPlus className='w-4 h-4' />
                    Sign Up
                  </button>
                  <button
                    onClick={() => {
                      setAuthDefaultTab("signin");
                      setShowAuthModal(true);
                    }}
                    className='px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 text-sm'
                  >
                    <LogIn className='w-4 h-4' />
                    Login
                  </button>
                </div>

                <div
                  className='hidden md:block pt-2 animate-slide-in-left'
                  style={{ animationDelay: "0.6s" }}
                >
                  <button
                    onClick={() => setShowQuickJoinModal(true)}
                    className='text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4 transition'
                  >
                    Quick Join as Guest (View Only)
                  </button>
                </div>
              </div>

              <FloatingPanels />
            </div>
          </div>
        </section>

        <div className='md:hidden px-4 pb-6 space-y-3 animate-slide-up'>
          <div className='flex flex-col gap-3'>
            <button
              onClick={() => {
                setAuthDefaultTab("signup");
                setShowAuthModal(true);
              }}
              className='w-full px-6 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 text-sm border border-amber-400/50'
            >
              <UserPlus className='w-4 h-4' />
              Sign Up
            </button>
            <button
              onClick={() => {
                setAuthDefaultTab("signin");
                setShowAuthModal(true);
              }}
              className='w-full px-6 py-3 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 border border-slate-600 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm'
            >
              <LogIn className='w-4 h-4' />
              Login
            </button>
          </div>
          <button
            onClick={() => setShowQuickJoinModal(true)}
            className='w-full text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4 transition text-center py-1'
          >
            Quick Join as Guest (View Only)
          </button>
        </div>
        <Footer />
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          defaultTab={authDefaultTab}
        />
      )}
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
