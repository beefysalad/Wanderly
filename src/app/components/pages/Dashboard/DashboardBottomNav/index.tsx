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

  const isActive = (path: string) => pathname === path;

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
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className='relative flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out group min-w-[70px]'
                >
                  {/* Active background */}
                  {active && (
                    <div className='absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/30' />
                  )}

                  {/* Icon */}
                  <div className='relative z-10'>
                    <Icon
                      className={`w-6 h-6 transition-all duration-300 ${
                        active
                          ? "text-white scale-110"
                          : "text-slate-400 group-hover:text-slate-300 group-hover:scale-105"
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`relative z-10 text-[10px] font-semibold transition-all duration-300 ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Logout button */}
            <button
              onClick={onLogout}
              className='relative flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out group min-w-[70px]'
            >
              <div className='relative z-10'>
                <LogOut className='w-6 h-6 text-slate-400 group-hover:text-red-400 group-hover:scale-105 transition-all duration-300' />
              </div>
              <span className='relative z-10 text-[10px] font-semibold text-slate-400 group-hover:text-red-400 transition-all duration-300'>
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
