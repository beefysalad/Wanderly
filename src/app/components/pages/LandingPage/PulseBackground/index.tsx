import React from "react";

const PulseBackground = () => {
  return (
    <div className='fixed inset-0 overflow-hidden pointer-events-none'>
      <div className='absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse-slow'></div>
      <div
        className='absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow'
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className='absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse-slow'
        style={{ animationDelay: "2s" }}
      ></div>

      <div className='absolute top-1/4 right-1/3 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl animate-float-slow'></div>
      <div
        className='absolute bottom-1/4 left-1/3 w-72 h-72 bg-orange-400/10 rounded-full blur-2xl animate-float-slow'
        style={{ animationDelay: "1.5s" }}
      ></div>

      <div className='md:hidden absolute top-10 right-8 w-32 h-32 bg-amber-400/15 rounded-full blur-xl animate-float-slow'></div>
      <div
        className='md:hidden absolute bottom-32 left-8 w-40 h-40 bg-orange-400/15 rounded-full blur-xl animate-float-slow'
        style={{ animationDelay: "0.8s" }}
      ></div>

      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-gradient-x'></div>
    </div>
  );
};

export default PulseBackground;
