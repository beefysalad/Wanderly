"use client";
import { Home, Calendar, Building2, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface IDashboardBottomNavProps {
  onLogout: () => void;
}

const DashboardBottomNav = ({ onLogout }: IDashboardBottomNavProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/dashboard" },
    { id: "trips", label: "Trips", icon: Calendar, path: "/trips" },
    { id: "groups", label: "Groups", icon: Building2, path: "/groups" },
  ];

  return (
    <div
      className='fixed bottom-0 left-0 right-0 z-[9999]'
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Backdrop */}
      <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent backdrop-blur-xl' />

      {/* Navigation container */}
      <div className='relative px-4 pb-3 pt-2'>
        <div className='max-w-md mx-auto bg-slate-800/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 p-2'>
          <nav className='flex items-center justify-around'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname?.startsWith(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={`flex flex-col items-center justify-center py-2 px-1 gap-1 min-w-[64px] rounded-2xl transition-all duration-300 ${
                    active
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-transform duration-300 ${
                      active ? "scale-110" : "scale-100"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                      active ? "opacity-100" : "opacity-60"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            <div className='w-px h-8 bg-white/5 mx-1' />

            <button
              onClick={onLogout}
              className='flex flex-col items-center justify-center py-2 px-1 gap-1 min-w-[64px] rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300'
            >
              <LogOut className='w-6 h-6' />
              <span className='text-[10px] font-bold uppercase tracking-widest opacity-60'>
                Logout
              </span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default DashboardBottomNav;
