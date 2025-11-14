"use client";

import Link from "next/link";

const AboutComponent = () => {
  return (
    <main className='min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse-slow'></div>
        <div
          className='absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow'
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className='relative z-10'>
        <section className='px-4 md:px-8 py-12 md:py-20 max-w-4xl mx-auto'>
          <div className='space-y-12'>
            <div className='text-center space-y-4 animate-slide-in-down'>
              <h2 className='text-3xl md:text-5xl font-bold'>
                The Story Behind{" "}
                <span className='bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
                  Wanderly
                </span>
              </h2>
              <p className='text-slate-300 text-lg md:text-xl'>
                Why I built this tool for travelers like you
              </p>
            </div>

            <div className='bg-linear-to-br from-purple-900/30 to-violet-900/30 border border-amber-500/20 rounded-2xl p-8 md:p-12 backdrop-blur-sm space-y-6 animate-slide-in-up shadow-2xl'>
              <div className='space-y-4'>
                <p className='text-slate-200 leading-relaxed text-lg'>
                  I created Wanderly because I got tired of coordinating group
                  trips through scattered messages, spreadsheets, and forgotten
                  deadlines. As someone who loves traveling with friends, I
                  realized we needed a single source of truth—a place where
                  everyone stays synchronized without the chaos.
                </p>
                <p className='text-slate-200 leading-relaxed text-lg'>
                  Every trip I took, the same problems surfaced:
                  &quot;Who&apos;s paying for what?&quot; ,&quot;What time is
                  the activity again?&quot;, &quot;Did everyone see the
                  schedule?&quot; So I decided to build a solution that tackles
                  all of this in one beautiful, intuitive platform.
                </p>
              </div>

              <div className='pt-6 border-t border-amber-500/20 space-y-4'>
                <h3 className='text-xl font-semibold text-amber-400'>
                  What Makes Wanderly Different
                </h3>
                <ul className='space-y-3 text-slate-300'>
                  <li className='flex gap-3 items-start'>
                    <span className='text-orange-400 font-bold flex-shrink-0 text-xl'>
                      ✓
                    </span>
                    <span className='text-lg'>
                      Real-time collaboration with zero setup friction
                    </span>
                  </li>
                  <li className='flex gap-3 items-start'>
                    <span className='text-orange-400 font-bold flex-shrink-0 text-xl'>
                      ✓
                    </span>
                    <span className='text-lg'>
                      Expense tracking so no one forgets who paid for what
                    </span>
                  </li>
                  <li className='flex gap-3 items-start'>
                    <span className='text-orange-400 font-bold flex-shrink-0 text-xl'>
                      ✓
                    </span>
                    <span className='text-lg'>
                      Beautiful calendar and schedule views that just work
                    </span>
                  </li>
                  <li className='flex gap-3 items-start'>
                    <span className='text-orange-400 font-bold flex-shrink-0 text-xl'>
                      ✓
                    </span>
                    <span className='text-lg'>
                      Built specifically for group travel, not generic project
                      management
                    </span>
                  </li>
                </ul>
              </div>

              <div className='pt-6 border-t border-amber-500/20'>
                <p className='text-slate-400 italic text-lg leading-relaxed'>
                  Whether you&apos;re planning a weekend getaway or a month-long
                  adventure, Wanderly makes it seamless. Start your next trip
                  today and experience the difference.
                </p>
              </div>

              <div className='pt-8 text-center'>
                <Link href={"/"}>
                  <p className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/50'>
                    Get Started with Wanderly
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutComponent;
