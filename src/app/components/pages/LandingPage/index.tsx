import {
  ArrowRight,
  Calendar,
  DollarSign,
  Link2,
  Smartphone,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Footer from "../../shared/Footer";
import Header from "../../shared/Header";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export interface IUserCredentials {
  email: string;
  password: string;
}

const LandingPage = () => {
  const router = useRouter();
  const { data: userCount = 0 } = useQuery({
    queryKey: ["userCount"],
    queryFn: async () => {
      const res = await fetch("/api/stats/user-count");
      if (!res.ok) throw new Error("Failed to fetch user count");
      const data = await res.json();
      return data.count as number;
    },
    initialData: 0,
  });

  const GOAL = 1000;
  const progressPercentage = Math.min((userCount / GOAL) * 100, 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <main className='min-h-screen bg-slate-950 text-white relative flex flex-col overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      {/* Content */}
      <div className='relative z-10 flex-1 flex flex-col'>
        <div className='min-h-[100svh] flex flex-col relative'>
          <Header />

          {/* Hero Section */}
          <section className='flex-1 flex items-center justify-center px-6 py-12 md:py-20'>
            <div className='w-full max-w-7xl mx-auto'>
              <div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
                {/* Left Column - Content */}
                <motion.div
                  className='space-y-8 text-center lg:text-left'
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                >
                  {/* Headline */}
                  <motion.div variants={itemVariants} className='space-y-4'>
                    <h1 className='text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]'>
                      Group trips,
                      <br />
                      <span className='bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x'>
                        simplified.
                      </span>
                    </h1>
                    <p className='text-lg md:text-xl text-slate-400 font-light'>
                      One shared schedule. One expense tracker. Zero
                      spreadsheets.
                    </p>
                  </motion.div>

                  {/* CTA */}
                  <motion.div
                    variants={itemVariants}
                    className='flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4'
                  >
                    <button
                      onClick={() => router.push("/register")}
                      className='group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2'
                    >
                      <span>Start Free</span>
                      <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                    </button>
                    <button
                      onClick={() => router.push("/login")}
                      className='w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full font-semibold text-lg transition-all'
                    >
                      Login
                    </button>
                  </motion.div>

                  {/* Guest Link */}
                  <motion.div
                    variants={itemVariants}
                    className='flex justify-center lg:justify-start'
                  >
                    <button
                      onClick={() => router.push("/guest/join")}
                      className='group text-sm text-slate-500 hover:text-amber-400 transition-colors'
                    >
                      <span className='relative inline-block'>
                        Join as guest
                        <span className='absolute bottom-0 left-0 w-0 h-px bg-amber-400 group-hover:w-full transition-all duration-300'></span>
                      </span>
                    </button>
                  </motion.div>
                </motion.div>

                {/* Right Column - Feature Cards */}
                <motion.div
                  className='space-y-4'
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                >
                  {/* Card 1 */}
                  <motion.div
                    variants={itemVariants}
                    className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:-translate-y-1'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                        <Calendar className='w-6 h-6 text-amber-400' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-bold text-lg mb-2'>
                          Shared Calendar
                        </h3>
                        <p className='text-sm text-slate-400 leading-relaxed'>
                          Everyone sees the same schedule, always in sync.
                          Export to your phone calendar.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 2 */}
                  <motion.div
                    variants={itemVariants}
                    className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:-translate-y-1 lg:ml-8'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                        <DollarSign className='w-6 h-6 text-orange-400' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-bold text-lg mb-2'>
                          Split Expenses
                        </h3>
                        <p className='text-sm text-slate-400 leading-relaxed'>
                          Track who paid what. Settle up with one tap. No more
                          awkward money conversations.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 3 */}
                  <motion.div
                    variants={itemVariants}
                    className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:-translate-y-1'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                        <Link2 className='w-6 h-6 text-amber-400' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-bold text-lg mb-2'>Easy Sharing</h3>
                        <p className='text-sm text-slate-400 leading-relaxed'>
                          Invite anyone with a simple code. No account required
                          to view trip details.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className='absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-slate-500'
          >
            <span className='text-[10px] font-medium tracking-widest uppercase'>
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            >
              <ArrowRight className='w-4 h-4 rotate-90' />
            </motion.div>
          </motion.div>
        </div>

        <section className='py-20 px-6 relative'>
          <div className='absolute inset-0 bg-slate-900/50 backdrop-blur-sm -skew-y-3 transform origin-top-left -z-10'></div>
          <motion.div
            className='max-w-4xl mx-auto text-center space-y-8'
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className='inline-flex items-center justify-center p-4 rounded-full bg-slate-800/50 border border-slate-700 mx-auto mb-4'>
              <Smartphone className='w-8 h-8 text-blue-400' />
            </div>
            <h2 className='text-3xl md:text-5xl font-bold tracking-tight'>
              Wait... where&apos;s the{" "}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400'>
                Mobile App?
              </span>
            </h2>
            <p className='text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed'>
              I know, I know. You want an app. I&apos;m a one man team making
              the web experience perfect first.
            </p>
            <button
              onClick={() => router.push("/how-to#save-to-home-screen")}
              className='text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 mx-auto transition-colors group'
            >
              <span>Add to your home screen instead</span>
              <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
            </button>
            <div className='bg-slate-800/40 border border-white/10 rounded-2xl p-8 max-w-lg mx-auto backdrop-blur-md relative overflow-hidden group hover:border-blue-500/30 transition-colors'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2'></div>
              <h3 className='text-xl font-bold text-white mb-2'>My Promise</h3>
              <p className='text-slate-400 mb-6'>
                When I hit{" "}
                <span className='text-white font-bold'>1000 active users</span>,
                I&apos;ll drop everything and build native apps for iOS and
                Android.
              </p>
              <div className='w-full bg-slate-700/50 rounded-full h-4 overflow-hidden'>
                <div
                  className='bg-gradient-to-r from-blue-500 to-cyan-500 h-full relative transition-all duration-1000 ease-out'
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className='absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.8)]'></div>
                </div>
              </div>
              <div className='flex justify-between text-xs text-slate-500 mt-2 font-mono'>
                <span>
                  Current: {userCount} / {GOAL}
                </span>
                <span>Target: Mobile App</span>
              </div>
            </div>
          </motion.div>
        </section>

        <Footer />
      </div>
    </main>
  );
};

export default LandingPage;
