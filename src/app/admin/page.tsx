"use client";

import {
  Sparkles,
  Settings,
  Users,
  Database,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const AdminDashboard = () => {
  const router = useRouter();

  const adminTools = [
    {
      title: "What's New",
      description:
        "Manage app announcements, versioning and feature highlights.",
      icon: Sparkles,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      href: "/admin/whats-new",
    },
    {
      title: "User Management",
      description: "View and manage registered users and their activities.",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/admin/users",
      disabled: false,
    },
    {
      title: "System Config",
      description: "Global application settings and environment variables.",
      icon: Settings,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      href: "/admin/config",
      disabled: false,
    },
    {
      title: "Database Hub",
      description: "Execute maintenance tasks and view database health.",
      icon: Database,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/database",
      disabled: false,
    },
  ];

  return (
    <main className='min-h-screen bg-slate-950 text-slate-200'>
      <div className='max-w-5xl mx-auto px-6 py-12'>
        <div className='flex items-center justify-between mb-12'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.push("/dashboard")}
              className='p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-white tracking-tight flex items-center gap-3'>
                Admin Portal
                <ShieldCheck className='w-6 h-6 text-purple-500' />
              </h1>
              <p className='text-slate-400'>
                Central command center for Wanderly
              </p>
            </div>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-6'>
          {adminTools.map((tool, index) => (
            <Link
              key={index}
              href={tool.disabled ? "#" : tool.href}
              className={`group p-8 bg-slate-900/50 border border-white/10 rounded-[2rem] transition-all hover:bg-slate-900 hover:border-white/20 relative overflow-hidden ${
                tool.disabled
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <div className='absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/[0.05] transition-colors'></div>

              <div className='flex items-start justify-between relative z-10'>
                <div
                  className={`w-14 h-14 rounded-2xl ${tool.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <tool.icon className={`w-7 h-7 ${tool.color}`} />
                </div>
                {!tool.disabled && (
                  <ChevronRight className='w-6 h-6 text-slate-600 group-hover:text-white transition-colors' />
                )}
              </div>

              <div className='relative z-10'>
                <h2 className='text-xl font-bold text-white mb-2'>
                  {tool.title}
                </h2>
                <p className='text-slate-400 leading-relaxed font-medium'>
                  {tool.description}
                </p>
              </div>

              {tool.disabled && (
                <div className='mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-white/5 inline-block px-2 py-1 rounded-md'>
                  Coming Soon
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
