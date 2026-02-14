"use client";
import { ArrowRight, Calendar, DollarSign, Link2 } from "lucide-react";
import { useState } from "react";
import Footer from "../../shared/Footer";
import Header from "../../shared/Header";
import QuickJoinModal from "../../shared/Modal/QuickJoinModal";
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

  return (
    <main className='min-h-screen bg-slate-950 text-white relative flex flex-col overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      {/* Content */}
      <div className='relative z-10 flex-1 flex flex-col'>
        <Header />

        {/* Hero Section */}
        <section className='flex-1 flex items-center justify-center px-6 py-12 md:py-20'>
          <div className='w-full max-w-7xl mx-auto'>
            <div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
              {/* Left Column - Content */}
              <div className='space-y-8 text-center lg:text-left'>
                {/* Headline */}
                <div className='space-y-4'>
                  <h1 className='text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]'>
                    Group trips,
                    <br />
                    <span className='bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x'>
                      simplified.
                    </span>
                  </h1>
                  <p className='text-lg md:text-xl text-slate-400 font-light'>
                    One shared schedule. One expense tracker. Zero spreadsheets.
                  </p>
                </div>

                {/* CTA */}
                <div className='flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4'>
                  <button
                    onClick={() => router.push("/register")}
                    className='group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2'
                  >
                    <span>Start Free</span>
                    <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className='w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full font-semibold text-lg transition-all'
                  >
                    Login
                  </button>
                </div>

                {/* Guest Link */}
                <div className='flex justify-center lg:justify-start'>
                  <button
                    onClick={() => setShowQuickJoinModal(true)}
                    className='group text-sm text-slate-500 hover:text-amber-400 transition-colors'
                  >
                    <span className='relative inline-block'>
                      Join as guest
                      <span className='absolute bottom-0 left-0 w-0 h-px bg-amber-400 group-hover:w-full transition-all duration-300'></span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Column - Feature Cards */}
              <div className='space-y-4'>
                {/* Card 1 */}
                <div className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:-translate-y-1'>
                  <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                      <Calendar className='w-6 h-6 text-amber-400' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-bold text-lg mb-2'>
                        Shared Calendar
                      </h3>
                      <p className='text-sm text-slate-400 leading-relaxed'>
                        Everyone sees the same schedule, always in sync. Export
                        to your phone calendar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:-translate-y-1 lg:ml-8'>
                  <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                      <DollarSign className='w-6 h-6 text-orange-400' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-bold text-lg mb-2'>Split Expenses</h3>
                      <p className='text-sm text-slate-400 leading-relaxed'>
                        Track who paid what. Settle up with one tap. No more
                        awkward money conversations.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:-translate-y-1'>
                  <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                      <Link2 className='w-6 h-6 text-amber-400' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-bold text-lg mb-2'>Easy Sharing</h3>
                      <p className='text-sm text-slate-400 leading-relaxed'>
                        Invite anyone with a simple code. No account required to
                        view trip details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
