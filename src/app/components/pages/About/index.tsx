"use client";

import { Calendar, Code2, DollarSign, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Footer from "../../shared/Footer";
import Header from "../../shared/Header";
// AuthModal import removed
import QuickJoinModal from "../../shared/Modal/QuickJoinModal";

const AboutComponent = () => {
  const [showQuickJoinModal, setShowQuickJoinModal] = useState<boolean>(false);

  return (
    <main className='min-h-screen bg-slate-950 text-white relative flex flex-col overflow-hidden'>
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      <div className='relative z-10'>
        <Header />
        <div className='max-w-6xl mx-auto px-6 py-12 md:py-24 space-y-24'>
          {/* Hero Section - Bold & Human */}
          <div className='relative text-center space-y-6 max-w-3xl mx-auto'>
            <div className='inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-widest uppercase mb-4 animate-fade-in'>
              My Story
            </div>
            <h1 className='text-5xl md:text-7xl font-black tracking-tight leading-tight'>
              I build tools for{" "}
              <span className='bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x'>
                Real Travelers.
              </span>
            </h1>
            <p className='text-xl md:text-2xl text-slate-400 font-light leading-relaxed'>
              No confusing spreadsheets. Just a better way to see the world with
              your favorite people.
            </p>
          </div>

          {/* Manifesto Section - Staggered & Dynamic */}
          <div className='items-center'>
            <div className='space-y-8'>
              <div className='space-y-4'>
                <h2 className='text-3xl md:text-4xl font-bold text-white text-center'>
                  The Friction <br />
                  <span className='text-slate-500'>of Group Travel.</span>
                </h2>
              </div>
              <div className='space-y-6 text-lg text-slate-300 font-light leading-relaxed'>
                <p>
                  Planning group trips shouldn&apos;t be a full-time job. Yet,
                  most of you have been there. Juggling 14 open tabs, 3
                  different messaging apps, and that one &quot;master&quot;
                  spreadsheet that no one actually updates.
                </p>

                <div className='p-6 bg-white/5 rounded-2xl border-l-4 border-amber-500/50 italic text-slate-200'>
                  &quot;Information gets lost, people miss updates, and someone
                  always ends up paying more than their fair share.&quot;
                </div>

                <p>
                  I built Wanderly to fix this. Not by adding more complexity,
                  but by stripping away the noise. One place for your schedule,
                  your shared wallet, and your group&apos;s peace of mind.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Bento Grid */}
          <div className='space-y-12'>
            <div className='text-center space-y-4'>
              <h2 className='text-3xl md:text-5xl font-bold'>
                Built for the{" "}
                <span className='font-bold text-amber-500'>Journey.</span>
              </h2>
              <p className='text-slate-400'>
                Everything you need, exactly where it belongs.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]'>
              {/* Feature 1: Large */}
              <div className='md:col-span-2 row-span-2 bg-gradient-to-br from-purple-900/20 to-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex flex-col justify-between hover:border-amber-500/30 transition-all group'>
                <div className='space-y-4'>
                  <div className='w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <Calendar className='w-7 h-7 text-amber-400' />
                  </div>
                  <h3 className='text-3xl font-bold'>Smart Scheduling</h3>
                  <p className='text-slate-400 text-lg leading-relaxed max-w-md'>
                    Visual calendar and reactive schedules that sync with
                    everyone in real-time. Export directly to your phone so
                    you&apos;re never out of the loop.
                  </p>
                </div>
                <div className='flex items-center gap-4 text-sm text-amber-400 font-medium'>
                  <span>Supports Apple, Google, & Outlook</span>
                  <div className='flex-1 h-px bg-amber-500/20'></div>
                </div>
              </div>

              {/* Feature 2: Small */}
              <div className='bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-amber-500/30 transition-all group'>
                <div className='space-y-4'>
                  <div className='w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform'>
                    <DollarSign className='w-6 h-6 text-amber-400' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold mb-2'>Fair Splits</h3>
                    <p className='text-slate-400 text-sm'>
                      No more &quot;who owes who&quot;. Track expenses and
                      settle up with one tap.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3: Small */}
              <div className='bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-amber-500/30 transition-all group'>
                <div className='space-y-4'>
                  <div className='w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:-rotate-12 transition-transform'>
                    <Users className='w-6 h-6 text-amber-400' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold mb-2'>True Collab</h3>
                    <p className='text-slate-400 text-sm'>
                      Shared groups where everyone can contribute, propose, and
                      vote.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 4: Medium/Wide */}
              <div className='md:col-span-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 hover:border-amber-500/40 transition-all'>
                <div className='flex-1 space-y-4'>
                  <h3 className='text-2xl font-bold'>Built for Travelers</h3>
                  <p className='text-slate-300'>
                    I don&apos;t do &quot;generic project management&quot;.
                    Wanderly is tailored for the chaos and joy of seeing the
                    world together.
                  </p>
                </div>

                <div className='flex-shrink-0'>
                  <div className='px-6 py-3 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-sm font-bold'>
                    Travel-Focused UX
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Persona Section - Reduced "Corporate" Feel */}
          <div className='relative'>
            <div className='absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10'></div>
            <div className='relative bg-slate-900/20 border border-white/5 rounded-[3rem] p-8 md:p-16 overflow-hidden'>
              <div className='relative z-20 flex flex-col md:flex-row gap-12 items-center'>
                <div className='relative flex-shrink-0'>
                  <div className='absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-pulse'></div>
                  <div className='relative w-48 h-48 rounded-2xl overflow-hidden rotate-3 hover:rotate-0 transition-transform duration-500 ring-4 ring-amber-500/30'>
                    <Image
                      src='/avatar.jpeg'
                      alt='Patrick'
                      fill
                      className='object-cover scale-110'
                    />
                  </div>
                </div>
                <div className='flex-1 space-y-6 text-center md:text-left'>
                  <div className='space-y-2'>
                    <h2 className='text-4xl font-black'>
                      I&apos;m <span className='text-amber-500'>Patrick.</span>
                    </h2>

                    <p className='text-slate-400 font-medium uppercase tracking-widest text-sm'>
                      Software Engineer
                    </p>
                  </div>
                  <p className='text-lg text-slate-300 font-light leading-relaxed italic'>
                    &quot;I built this because I tired of messy spreadsheets and
                    forgotten plans. Wanderly isn&apos;t just a side project;
                    it&apos;s the tool I actually use when I finally convince my
                    friends to leave the city.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className='text-center space-y-12 pb-24'>
            <div className='space-y-4'>
              <h2 className='text-4xl md:text-6xl font-bold'>
                Stop Planning. <br />{" "}
                <span className='text-slate-500 font-light italic'>
                  Start Traveling.
                </span>
              </h2>
              <p className='text-slate-400 text-lg'>
                Wanderly is free while I&apos;m in Beta. Join me on the journey.
              </p>
            </div>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-6'>
              <Link href={"/register"}>
                <button className='px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 transition-all font-bold shadow-2xl shadow-amber-500/20'>
                  Get Started for Free
                </button>
              </Link>
              <Link href={"/faq"}>
                <button className='px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium'>
                  Check the FAQ
                </button>
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* AuthModal rendering removed */}
      {showQuickJoinModal && (
        <QuickJoinModal
          onClose={() => setShowQuickJoinModal(false)}
          onJoin={(code: string, guestName: string) => {
            // Handle quick join if needed
            console.log("Quick join:", code, guestName);
          }}
        />
      )}
    </main>
  );
};

export default AboutComponent;
