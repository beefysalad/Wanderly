"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In this "secret" simple setup, we check against the ENV-provided password.
    // We'll perform a quick check by trying to fetch the config (which requires the password anyway).
    // But for a better UX, we'll just check it here if possible or use a dummy check
    // since the actual security is at the API level.

    // For now, let's just use the simple session storage approach after a "mock" check.
    // The user will enter the password, and we'll save it to session storage.
    // Every API call from here on will use this password from session storage.
    if (password) {
      sessionStorage.setItem("admin_password", password);
      sessionStorage.setItem("admin_authenticated", "true");
      setIsAuthenticated(true);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin' />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl'></div>
          <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl'></div>
        </div>

        <div className='w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10'>
          <div className='flex justify-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20'>
              <Lock className='w-8 h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl font-bold text-white text-center mb-2'>
            Admin Access
          </h1>
          <p className='text-slate-400 text-center mb-8'>
            Enter secret password to enter the portal
          </p>

          <form onSubmit={handleLogin} className='space-y-4'>
            <div>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Secret Password'
                className='w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all'
                autoFocus
              />
            </div>
            {error && (
              <p className='text-rose-500 text-sm text-center'>{error}</p>
            )}
            <button className='w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-2'>
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
