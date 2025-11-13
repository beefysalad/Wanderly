"use client";
import React, { useState } from "react";
import { Compass, LogIn, UserPlus, Zap, MapPin, Users } from "lucide-react";
import LoginForm from "../LoginForm";
import RegistrationForm from "../RegistrationForm";
import QuickJoinModal from "../Modal/QuickJoinModal";

export interface IUserCredentials {
  email: string;
  password: string;
}
interface ILandingPropsPage {
  onLogin: (userCredentials: IUserCredentials) => void;
  onRegister: (userCredentials: IUserCredentials) => void;
  onQuickJoin: (code: string, guestName: string) => void;
}
const LandingPage = ({
  onLogin,
  onQuickJoin,
  onRegister,
}: ILandingPropsPage) => {
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [showRegistrationForm, setShowRegistrationForm] =
    useState<boolean>(false);
  const [showQuickJoinModal, setShowQuickJoinModal] = useState<boolean>(false);
  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div
          className='absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse'
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className='absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse'
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content */}
      <div className='relative z-10'>
        <header className='hidden md:flex items-center justify-between px-8 py-6 border-b border-amber-500/20 animate-fade-in'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center animate-bounce-slow'>
              <Compass className='w-6 h-6 text-purple-950' />
            </div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
              Ptrckkk.dev
            </h1>
          </div>
          <nav className='flex gap-4'>
            <button
              onClick={() => setShowLoginForm(true)}
              className='px-6 py-2 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all duration-300 hover:scale-105'
            >
              Login
            </button>
            <button
              onClick={() => setShowRegistrationForm(true)}
              className='px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 hover:scale-105'
            >
              Sign Up
            </button>
          </nav>
        </header>

        <header className='md:hidden flex items-center justify-center px-4 py-6 border-b border-amber-500/20 animate-fade-in'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center animate-bounce-slow'>
              <Compass className='w-6 h-6 text-purple-950' />
            </div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
              Ptrckkk.dev
            </h1>
          </div>
        </header>

        {/* Hero Section */}
        <section className='px-4 md:px-8 py-12 md:py-24 max-w-7xl mx-auto'>
          <div className='grid md:grid-cols-2 gap-12 items-center mb-16'>
            <div className='space-y-4'>
              <div className='space-y-4 animate-slide-in-left'>
                <h2 className='text-4xl md:text-5xl font-bold leading-tight'>
                  Plan Your Adventures{" "}
                  <span className='bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
                    Together
                  </span>
                </h2>
                <p className='text-xl text-slate-300'>
                  Collaborate with friends in real-time. Create group trips,
                  share itineraries, and keep everyone synchronized.
                </p>
              </div>

              <div
                className='space-y-3 animate-slide-in-left'
                style={{ animationDelay: "0.2s" }}
              >
                <div className='flex gap-3 items-start'>
                  <MapPin className='w-5 h-5 text-amber-400 flex-shrink-0 mt-1' />
                  <p className='text-slate-300'>
                    Organized calendar and schedule views
                  </p>
                </div>
                <div className='flex gap-3 items-start'>
                  <Users className='w-5 h-5 text-orange-400 flex-shrink-0 mt-1' />
                  <p className='text-slate-300'>
                    Share group codes and invite friends instantly
                  </p>
                </div>
                <div className='flex gap-3 items-start'>
                  <Zap className='w-5 h-5 text-amber-400 flex-shrink-0 mt-1' />
                  <p className='text-slate-300'>
                    Real-time updates and activity management
                  </p>
                </div>
              </div>

              <div
                className='hidden md:flex flex-col sm:flex-row gap-4 pt-4 animate-slide-in-left'
                style={{ animationDelay: "0.4s" }}
              >
                <button
                  onClick={() => setShowRegistrationForm(true)}
                  className='px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/50'
                >
                  <UserPlus className='w-5 h-5' />
                  Sign Up
                </button>
                <button
                  onClick={() => setShowLoginForm(true)}
                  className='px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105'
                >
                  <LogIn className='w-5 h-5' />
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
                {/* Card 1 */}
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

                {/* Card 2 */}
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

                {/* Card 3 */}
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
        </section>

        {/* Mobile CTA - Sticky Bottom */}
        <div className='md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent p-4 space-y-3'>
          <button
            onClick={() => setShowRegistrationForm(true)}
            className='w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-105'
          >
            <UserPlus className='w-5 h-5' />
            Sign Up
          </button>
          <button
            onClick={() => setShowLoginForm(true)}
            className='w-full px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105'
          >
            <LogIn className='w-5 h-5' />
            Login
          </button>
          <button
            onClick={() => setShowQuickJoinModal(true)}
            className='w-full px-6 py-3 text-sm text-amber-400 hover:text-amber-300 transition'
          >
            Quick Join as Guest
          </button>
        </div>

        {/* Add padding to account for fixed buttons on mobile */}
        <div className='md:hidden h-48'></div>
      </div>

      {/* Modals */}
      {showLoginForm && (
        <LoginForm
          onClose={() => setShowLoginForm(false)}
          onLogin={onLogin}
          onSwitchToSignup={() => {
            setShowLoginForm(false);
            setShowRegistrationForm(true);
          }}
        />
      )}
      {showRegistrationForm && (
        <RegistrationForm
          onClose={() => setShowRegistrationForm(false)}
          onRegister={onRegister}
          onSwitchToLogin={() => {
            setShowRegistrationForm(false);
            setShowLoginForm(true);
          }}
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
