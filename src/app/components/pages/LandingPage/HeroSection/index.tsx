import { MapPin, Users, Zap, Calendar } from "lucide-react";
import React, { Fragment } from "react";

const HeroSection = () => {
  return (
    <Fragment>
      <div className='md:hidden absolute inset-0 -z-10'>
        <div className='absolute top-8 right-0 w-24 h-24 bg-linear-to-br from-amber-500/10 to-orange-500/10 rounded-2xl rotate-12 animate-float blur-sm'></div>
        <div
          className='absolute bottom-20 left-0 w-28 h-28 bg-linear-to-br from-purple-500/10 to-violet-500/10 rounded-2xl -rotate-12 animate-float blur-sm'
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <div className='space-y-4 animate-slide-in-left'>
        <h2 className='text-6xl md:text-5xl font-bold leading-tight text-center md:text-start'>
          Plan Your Adventures{" "}
          <span className='bg-linear-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent animate-gradient-shift inline-block'>
            Together
          </span>{" "}
          <span className='inline-block animate-bounce-slow'>✈️</span>
        </h2>
        <p className='text-base md:text-lg text-slate-300 leading-relaxed animate-fade-in-up' style={{ animationDelay: "0.1s" }}>
          <span className='inline-block'>✨</span> Collaborate with friends in <strong className='text-amber-400'>real-time</strong>. Create group trips, share
          itineraries, and keep <strong className='text-orange-400'>everyone synchronized</strong>.
        </p>
      </div>

      <div
        className='space-y-3 animate-slide-in-left bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 md:bg-transparent md:border-0 md:p-0'
        style={{ animationDelay: "0.2s" }}
      >
        <div className='flex gap-3 items-start group hover:translate-x-1 transition-transform duration-300' style={{ animationDelay: "0.3s" }}>
          <div className='w-8 h-8 bg-linear-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300'>
            <MapPin className='w-4 h-4 text-amber-400 group-hover:text-amber-300' />
          </div>
          <p className='text-slate-300 text-sm group-hover:text-white transition-colors'>
            Organized calendar and schedule views
          </p>
        </div>
        <div className='flex gap-3 items-start group hover:translate-x-1 transition-transform duration-300' style={{ animationDelay: "0.4s" }}>
          <div className='w-8 h-8 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300'>
            <Users className='w-4 h-4 text-orange-400 group-hover:text-orange-300' />
          </div>
          <p className='text-slate-300 text-sm group-hover:text-white transition-colors'>
            Share group codes and invite friends <strong className='text-amber-400'>instantly</strong>
          </p>
        </div>
        <div className='flex gap-3 items-start group hover:translate-x-1 transition-transform duration-300' style={{ animationDelay: "0.5s" }}>
          <div className='w-8 h-8 bg-linear-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300'>
            <Zap className='w-4 h-4 text-amber-400 group-hover:text-amber-300 group-hover:animate-icon-bounce' />
          </div>
          <p className='text-slate-300 text-sm group-hover:text-white transition-colors'>
            <strong className='text-orange-400'>Real-time</strong> updates and activity management
          </p>
        </div>
        <div className='flex gap-3 items-start group hover:translate-x-1 transition-transform duration-300' style={{ animationDelay: "0.6s" }}>
          <div className='w-8 h-8 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300'>
            <Calendar className='w-4 h-4 text-orange-400 group-hover:text-orange-300' />
          </div>
          <p className='text-slate-300 text-sm group-hover:text-white transition-colors'>
            Export to your <strong className='text-amber-400'>phone calendar</strong> (Google, Apple, Outlook)
          </p>
        </div>
      </div>
    </Fragment>
  );
};

export default HeroSection;
