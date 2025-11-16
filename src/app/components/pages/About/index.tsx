"use client";

import { Calendar, DollarSign, Sparkles, Users, Code2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../../shared/Header";
import Footer from "../../shared/Footer";
import AuthModal from "../../shared/Modal/AuthModal";
import QuickJoinModal from "../../shared/Modal/QuickJoinModal";
import Image from "next/image";

const AboutComponent = () => {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "signup">(
    "signin"
  );
  const [showQuickJoinModal, setShowQuickJoinModal] = useState<boolean>(false);

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl'></div>
        <div
          className='absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl'
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className='relative z-10'>
        <Header
          setAuthDefaultTab={setAuthDefaultTab}
          setShowAuthModal={setShowAuthModal}
          setShowQuickJoinModal={setShowQuickJoinModal}
        />
        <div className='max-w-4xl mx-auto px-4 py-8'>
          <div className='space-y-8'>
            {/* Header */}
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-4 shadow-lg'>
                <Sparkles className='w-10 h-10 text-white' />
              </div>
              <h1 className='text-4xl md:text-5xl font-bold text-white'>
                About{" "}
                <span className='bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
                  Wanderly
                </span>
              </h1>
              <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
                The all-in-one platform for seamless group trip planning
              </p>
            </div>

            {/* Main Content Card */}
            <div className='bg-gradient-to-br from-purple-900/30 to-violet-900/30 border border-amber-500/20 rounded-2xl p-6 sm:p-8 md:p-10 backdrop-blur-sm shadow-2xl'>
              <div className='space-y-8'>
                {/* Story Section */}
                <div className='space-y-6'>
                  <h2 className='text-2xl md:text-3xl font-bold text-white'>
                    Why Wanderly Exists
                  </h2>
                  <div className='space-y-4 text-slate-200 leading-relaxed'>
                    <p className='text-base md:text-lg'>
                      Planning group trips shouldn&apos;t be complicated. Yet
                      we&apos;ve all been there&mdash;scattered messages across
                      multiple apps, confusing spreadsheets, and the constant
                      back-and-forth of &quot;Who&apos;s paying for what?&quot;
                      and &quot;What time is that activity again?&quot;
                    </p>
                    <p className='text-base md:text-lg'>
                      Wanderly was built to solve these problems in one
                      beautiful, intuitive platform. No more juggling between
                      different tools or losing track of important details.
                      Everything your group needs is right here, organized and
                      accessible to everyone.
                    </p>
                  </div>
                </div>

                {/* Features Grid */}
                <div className='pt-8 border-t border-amber-500/20'>
                  <h3 className='text-xl md:text-2xl font-bold text-white mb-6'>
                    What Makes Wanderly Special
                  </h3>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div className='p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all'>
                      <div className='flex items-start gap-4'>
                        <div className='p-2 bg-amber-500/20 rounded-lg'>
                          <Users className='w-6 h-6 text-amber-400' />
                        </div>
                        <div>
                          <h4 className='font-semibold text-white mb-1'>
                            Group Collaboration
                          </h4>
                          <p className='text-sm text-slate-300'>
                            Create groups, invite friends, and plan together in
                            real-time. Everyone stays on the same page.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all'>
                      <div className='flex items-start gap-4'>
                        <div className='p-2 bg-amber-500/20 rounded-lg'>
                          <Calendar className='w-6 h-6 text-amber-400' />
                        </div>
                        <div>
                          <h4 className='font-semibold text-white mb-1'>
                            Smart Scheduling & Calendar Integration
                          </h4>
                          <p className='text-sm text-slate-300'>
                            Visual calendar and schedule views make it easy to
                            see your entire trip at a glance. Export your
                            schedule to Google Calendar, Apple Calendar, or
                            Outlook with one click.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all'>
                      <div className='flex items-start gap-4'>
                        <div className='p-2 bg-amber-500/20 rounded-lg'>
                          <DollarSign className='w-6 h-6 text-amber-400' />
                        </div>
                        <div>
                          <h4 className='font-semibold text-white mb-1'>
                            Expense Tracking
                          </h4>
                          <p className='text-sm text-slate-300'>
                            Track who paid for what, split expenses fairly, and
                            keep a complete payment history. No more confusion.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all'>
                      <div className='flex items-start gap-4'>
                        <div className='p-2 bg-amber-500/20 rounded-lg'>
                          <Sparkles className='w-6 h-6 text-amber-400' />
                        </div>
                        <div>
                          <h4 className='font-semibold text-white mb-1'>
                            Made for Travel
                          </h4>
                          <p className='text-sm text-slate-300'>
                            Built specifically for group travel, not adapted
                            from generic project management tools. Every feature
                            is travel-focused.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Creator & Status Section */}
                <div className='pt-8 border-t border-amber-500/20 space-y-6'>
                  {/* Creator Card */}
                  <div className='bg-gradient-to-br from-purple-900/20 to-violet-900/20 border border-amber-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 shadow-lg'>
                    <div className='flex flex-col sm:flex-row items-start gap-6 mb-6'>
                      <div className='relative flex-shrink-0'>
                        <div className='absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-xl opacity-40 animate-pulse-slow'></div>
                        <div className='relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-1 shadow-xl'>
                          <div className='relative w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden ring-2 ring-amber-500/30'>
                            <Image
                              src='/avatar.jpeg'
                              alt='Patrick - Creator of Wanderly'
                              fill
                              className='object-cover rounded-full'
                              sizes='(max-width: 768px) 96px, 112px'
                              priority
                            />
                          </div>
                        </div>
                        <div className='absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900'>
                          <Code2 className='w-4 h-4 text-purple-950' />
                        </div>
                      </div>
                      <div className='flex-1 space-y-2'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <h3 className='text-2xl md:text-3xl font-bold text-white'>
                            About the Creator
                          </h3>
                        </div>
                        <div className='flex items-center gap-3'>
                          <p className='text-base text-slate-300 font-medium'>
                            Patrick
                          </p>
                          <span className='w-1 h-1 bg-amber-400 rounded-full'></span>
                          <div className='flex items-center gap-1.5 text-xs text-slate-400'>
                            <Code2 className='w-3.5 h-3.5 text-amber-400' />
                            <span>
                              Software Engineer / Full Stack Developer
                            </span>
                          </div>
                        </div>
                        <p className='text-sm text-slate-400 italic'>
                          coffee makes the world go round ☕
                        </p>
                      </div>
                    </div>
                    <div className='space-y-4'>
                      <p className='text-base md:text-lg text-slate-200 leading-relaxed'>
                        I&apos;m a seasoned software engineer who, honestly,
                        hasn&apos;t been much of a traveler yet. But lately,
                        I&apos;ve been planning to change that and start
                        exploring the world. As I researched and prepared for my
                        future trips, I quickly realized how messy trip planning
                        can be sometimes&mdash;and it gave me the idea that
                        group trip planning must be even messier. I knew I could
                        build something better.
                      </p>
                      <div className='relative pl-6 border-l-2 border-amber-500/30'>
                        <div className='absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-amber-400/50 to-transparent'></div>
                        <p className='text-base md:text-lg text-slate-200 leading-relaxed'>
                          That&apos;s how Wanderly was born. It&apos;s the tool
                          I wish existed for planning my future adventures,
                          built with the precision and care that comes from
                          years of engineering experience, combined with the
                          fresh perspective of someone new to the travel
                          planning world.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='p-5 bg-amber-500/10 backdrop-blur-sm rounded-xl border border-amber-500/30 space-y-3'>
                    <div className='flex items-center gap-2'>
                      <span className='px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30'>
                        BETA
                      </span>
                      <h4 className='font-semibold text-white'>
                        Currently in Beta
                      </h4>
                    </div>
                    <p className='text-sm text-slate-300 leading-relaxed'>
                      Wanderly is currently in beta. I&apos;m actively improving
                      it based on user feedback and fixing bugs as they come up.
                      Your experience matters, and I&apos;m committed to making
                      this the best group trip planning tool out there.
                    </p>
                    <p className='text-sm text-slate-300 leading-relaxed'>
                      <span className='font-medium text-amber-300'>
                        Mobile app coming soon!
                      </span>{" "}
                      Once Wanderly has enough users, I&apos;ll be developing
                      native mobile apps for iOS and Android to make trip
                      planning even more convenient on the go.
                    </p>
                  </div>
                </div>

                {/* CTA Section */}
                <div className='pt-8 border-t border-amber-500/20'>
                  <div className='text-center space-y-6'>
                    <p className='text-lg text-slate-300 font-medium'>
                      Ready to plan your next adventure?
                    </p>
                    <Link href={"/"}>
                      <button className='px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all font-semibold shadow-lg hover:shadow-amber-500/50 flex items-center justify-center gap-2 active:scale-[0.98] transform mx-auto'>
                        <Sparkles className='w-5 h-5' />
                        <span>Get Started with Wanderly</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
