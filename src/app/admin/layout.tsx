"use client";

import api from "@/lib/axios";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Status = "checking" | "admin" | "forbidden" | "signed-out";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus("signed-out");
      return;
    }
    setStatus("checking");
    api
      .get("/admin/me")
      .then(() => setStatus("admin"))
      .catch(() => setStatus("forbidden"));
  }, [user, loading]);

  if (status === "checking") {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin' />
      </div>
    );
  }

  if (status === "admin") return <>{children}</>;

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
        <h1 className='text-2xl font-bold text-white text-center mb-2'>Admin Access</h1>
        {status === "forbidden" ? (
          <p className='text-slate-400 text-center'>
            {user?.email} is not authorised for the admin portal.
          </p>
        ) : (
          <>
            <p className='text-slate-400 text-center mb-8'>
              Sign in with an admin account to continue.
            </p>
            <Link
              href='/login'
              className='block w-full text-center bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95'
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
