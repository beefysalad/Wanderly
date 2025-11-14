import { MapPin, Users, Zap } from "lucide-react";
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
        <h2 className='text-5xl md:text-4xl font-bold leading-tight'>
          Plan Your Adventures{" "}
          <span className='bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
            Together
          </span>
        </h2>
        <p className='text-base md:text-lg text-slate-300 leading-relaxed'>
          Collaborate with friends in real-time. Create group trips, share
          itineraries, and keep everyone synchronized.
        </p>
      </div>

      <div
        className='space-y-3 animate-slide-in-left bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 md:bg-transparent md:border-0 md:p-0'
        style={{ animationDelay: "0.2s" }}
      >
        <div className='flex gap-3 items-start'>
          <div className='w-8 h-8 bg-linear-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center shrink-0'>
            <MapPin className='w-4 h-4 text-amber-400' />
          </div>
          <p className='text-slate-300 text-sm'>
            Organized calendar and schedule views
          </p>
        </div>
        <div className='flex gap-3 items-start'>
          <div className='w-8 h-8 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-lg flex items-center justify-center shrink-0'>
            <Users className='w-4 h-4 text-orange-400' />
          </div>
          <p className='text-slate-300 text-sm'>
            Share group codes and invite friends instantly
          </p>
        </div>
        <div className='flex gap-3 items-start'>
          <div className='w-8 h-8 bg-linear-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center shrink-0'>
            <Zap className='w-4 h-4 text-amber-400' />
          </div>
          <p className='text-slate-300 text-sm'>
            Real-time updates and activity management
          </p>
        </div>
      </div>
    </Fragment>
  );
};

export default HeroSection;
