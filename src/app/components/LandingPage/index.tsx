"use client";
import { LogIn, MapPin, UserPlus, Users, Zap } from "lucide-react";
import { useState } from "react";
import AuthModal from "../Modal/AuthModal";
import Footer from "../Footer";
import Header from "../Header";
import QuickJoinModal from "../Modal/QuickJoinModal";
import PulseBackground from "./PulseBackground";

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
    <main className='h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative flex flex-col'>
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
                <div className='md:hidden absolute inset-0 -z-10'>
                  <div className='absolute top-8 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl rotate-12 animate-float blur-sm'></div>
                  <div
                    className='absolute bottom-20 left-0 w-28 h-28 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl -rotate-12 animate-float blur-sm'
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </div>

                <div className='space-y-4 animate-slide-in-left'>
                  <h2 className='text-5xl md:text-4xl font-bold leading-tight'>
                    Plan Your Adventures{" "}
                    <span className='bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
                      Together
                    </span>
                  </h2>
                  <p className='text-base md:text-lg text-slate-300 leading-relaxed'>
                    Collaborate with friends in real-time. Create group trips,
                    share itineraries, and keep everyone synchronized.
                  </p>
                </div>

                <div
                  className='space-y-3 animate-slide-in-left bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 md:bg-transparent md:border-0 md:p-0'
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className='flex gap-3 items-start'>
                    <div className='w-8 h-8 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <MapPin className='w-4 h-4 text-amber-400' />
                    </div>
                    <p className='text-slate-300 text-sm'>
                      Organized calendar and schedule views
                    </p>
                  </div>
                  <div className='flex gap-3 items-start'>
                    <div className='w-8 h-8 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <Users className='w-4 h-4 text-orange-400' />
                    </div>
                    <p className='text-slate-300 text-sm'>
                      Share group codes and invite friends instantly
                    </p>
                  </div>
                  <div className='flex gap-3 items-start'>
                    <div className='w-8 h-8 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <Zap className='w-4 h-4 text-amber-400' />
                    </div>
                    <p className='text-slate-300 text-sm'>
                      Real-time updates and activity management
                    </p>
                  </div>
                </div>

                <div
                  className='hidden md:flex flex-col sm:flex-row gap-3 pt-4 animate-slide-in-left'
                  style={{ animationDelay: "0.4s" }}
                >
                  <button
                    onClick={() => {
                      setAuthDefaultTab("signup");
                      setShowAuthModal(true);
                    }}
                    className='px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/50 text-sm'
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

              <div className='hidden md:block'>
                <div className='space-y-4'>
                  <div
                    className='bg-gradient-to-br from-purple-900/40 to-violet-900/40 border border-amber-500/30 rounded-lg p-6 backdrop-blur-sm animate-float'
                    style={{ animationDelay: "0s" }}
                  >
                    <div className='flex gap-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0'>
                        <MapPin className='w-6 h-6 text-purple-950' />
                      </div>
                      <div>
                        <h3 className='font-semibold mb-1'>Smart Planning</h3>
                        <p className='text-sm text-slate-400'>
                          Drag, drop, and organize activities seamlessly
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className='bg-gradient-to-br from-violet-900/40 to-purple-900/40 border border-orange-500/30 rounded-lg p-6 backdrop-blur-sm ml-4 animate-float'
                    style={{ animationDelay: "0.5s" }}
                  >
                    <div className='flex gap-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0'>
                        <Users className='w-6 h-6 text-purple-950' />
                      </div>
                      <div>
                        <h3 className='font-semibold mb-1'>Group Sync</h3>
                        <p className='text-sm text-slate-400'>
                          See who&apos;s joining and stay in sync
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className='bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-amber-500/30 rounded-lg p-6 backdrop-blur-sm animate-float'
                    style={{ animationDelay: "1s" }}
                  >
                    <div className='flex gap-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0'>
                        <Zap className='w-6 h-6 text-purple-950' />
                      </div>
                      <div>
                        <h3 className='font-semibold mb-1'>Time Tracking</h3>
                        <p className='text-sm text-slate-400'>
                          Add time ranges to every activity
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              className='w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 text-sm border border-amber-400/50'
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
