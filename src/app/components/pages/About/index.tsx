"use client";

import { Calendar, DollarSign, Users } from "lucide-react";
import Link from "next/link";
import Footer from "../../shared/Footer";
import Header from "../../shared/Header";

const AboutComponent = () => {
  return (
    <main className='relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-white'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -left-20 top-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl' />
        <div className='absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl' />
        <div className='absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl' />
      </div>

      <div className='relative z-10'>
        <Header />
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-12 md:py-20'>
          <section className='grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end'>
            <div className='space-y-6'>
              <p className='inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300'>
                About Wanderly
              </p>
              <h1 className='text-4xl font-black leading-tight md:text-6xl'>
                Built to make group trips actually enjoyable.
              </h1>
              <p className='max-w-2xl text-lg leading-relaxed text-slate-300'>
                Wanderly replaces scattered chats, stale spreadsheets, and
                payment confusion with one clear place to plan, decide, and
                travel together.
              </p>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4 text-center'>
                <p className='text-2xl font-bold text-amber-300'>1</p>
                <p className='text-xs uppercase tracking-wider text-slate-400'>
                  shared plan
                </p>
              </div>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4 text-center'>
                <p className='text-2xl font-bold text-amber-300'>0</p>
                <p className='text-xs uppercase tracking-wider text-slate-400'>
                  chaos tabs
                </p>
              </div>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4 text-center'>
                <p className='text-2xl font-bold text-amber-300'>100%</p>
                <p className='text-xs uppercase tracking-wider text-slate-400'>
                  team visibility
                </p>
              </div>
            </div>
          </section>

          <section className='grid gap-4 md:grid-cols-3'>
            <div className='rounded-3xl border border-white/10 bg-slate-900/50 p-6'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                The problem
              </p>
              <p className='text-slate-200'>
                Group trip planning gets fragmented fast. Info disappears, tasks
                are duplicated, and money tracking turns into guesswork.
              </p>
            </div>
            <div className='rounded-3xl border border-white/10 bg-slate-900/50 p-6'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                The approach
              </p>
              <p className='text-slate-200'>
                Keep it simple: one itinerary, one expense ledger, and one space
                where every member can contribute without friction.
              </p>
            </div>
            <div className='rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-orange-500/10 p-6'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300'>
                The goal
              </p>
              <p className='text-amber-100'>
                Spend less time coordinating and more time traveling. That is
                the product standard behind every feature here.
              </p>
            </div>
          </section>

          <section className='space-y-8'>
            <div className='space-y-3 text-center'>
              <h2 className='text-3xl font-bold md:text-4xl'>
                What Wanderly helps you do
              </h2>
              <p className='text-slate-400'>
                Practical tools for real group travel workflows.
              </p>
            </div>
            <div className='grid gap-5 md:grid-cols-3'>
              <article className='group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-amber-500/40 hover:bg-white/[0.06]'>
                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20'>
                  <Calendar className='h-6 w-6 text-amber-300' />
                </div>
                <h3 className='mb-2 text-xl font-semibold'>Scheduling</h3>
                <p className='leading-relaxed text-slate-300'>
                  Organize plans in one timeline so everyone sees changes and
                  can stay aligned before and during the trip.
                </p>
              </article>
              <article className='group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-amber-500/40 hover:bg-white/[0.06]'>
                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20'>
                  <DollarSign className='h-6 w-6 text-amber-300' />
                </div>
                <h3 className='mb-2 text-xl font-semibold'>Expense Clarity</h3>
                <p className='leading-relaxed text-slate-300'>
                  Track who paid, who owes, and what is settled without chasing
                  screenshots or patchy notes in chat threads.
                </p>
              </article>
              <article className='group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-amber-500/40 hover:bg-white/[0.06]'>
                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20'>
                  <Users className='h-6 w-6 text-amber-300' />
                </div>
                <h3 className='mb-2 text-xl font-semibold'>Group Ownership</h3>
                <p className='leading-relaxed text-slate-300'>
                  Everyone can contribute updates, keep context, and move
                  decisions forward without relying on one organizer.
                </p>
              </article>
            </div>
          </section>

          <section className='rounded-[2rem] border border-white/10 bg-slate-900/40 p-8 md:p-12'>
            <div className='mx-auto max-w-3xl space-y-5 text-center'>
              <p className='text-xs font-semibold uppercase tracking-[0.2em] text-amber-300'>
                Builder note
              </p>
              <h2 className='text-3xl font-bold md:text-4xl'>
                Built with a strict no-bloat rule.
              </h2>
              <p className='text-lg leading-relaxed text-slate-300'>
                Wanderly exists because trip planning tools usually feel
                overloaded or generic. The product direction is simple: solve
                planning and money coordination cleanly, then get out of your
                way.
              </p>
            </div>
          </section>

          <section className='pb-12 text-center md:pb-20'>
            <h2 className='text-4xl font-black md:text-5xl'>
              Plan less. Travel more.
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-slate-400'>
              Wanderly is in beta and free to use while features are being
              shaped with early users.
            </p>
            <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Link href={"/register"}>
                <button className='rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 font-semibold text-slate-950 transition hover:scale-[1.02]'>
                  Get Started Free
                </button>
              </Link>
              <Link href={"/faq"}>
                <button className='rounded-2xl border border-white/15 bg-white/5 px-8 py-4 font-medium transition hover:bg-white/10'>
                  Read FAQ
                </button>
              </Link>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </main>
  );
};

export default AboutComponent;
