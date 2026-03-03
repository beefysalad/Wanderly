"use client";

import {
  Calendar,
  DollarSign,
  Download,
  PlayCircle,
  Plus,
  Smartphone,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../../shared/Header";
import Footer from "../../shared/Footer";
// AuthModal import removed

interface TutorialItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  videoId?: string; // Cloudinary video ID - to be added later
  instructions?: string | React.ReactNode;
}

const HowToComponent = () => {
  const router = useRouter();
  // AuthModal state removed
  const [showQuickJoinModal, setShowQuickJoinModal] = useState<boolean>(false);

  const tutorials: TutorialItem[] = [
    {
      id: "creating-group",
      title: "Creating a Group",
      description: "Learn how to create your first travel group",
      icon: <Users className='w-6 h-6 text-amber-400' />,
      videoId: "creating-group",
      instructions: (
        <>
          <ol className='list-decimal list-inside space-y-2 text-slate-300'>
            <li>Click the &quot;Create Group&quot; button on your dashboard</li>
            <li>Enter a group name and choose a color scheme</li>
            <li>Add an emoji to personalize your group (optional)</li>
            <li>Click &quot;Create Group&quot; to finish</li>
            <li>Share your group code with friends to invite them</li>
          </ol>
        </>
      ),
    },
    {
      id: "joining-group",
      title: "Joining a Group",
      description: "How to join an existing group with a code",
      icon: <UserPlus className='w-6 h-6 text-amber-400' />,
      videoId: "joining-group",
      instructions: (
        <>
          <ol className='list-decimal list-inside space-y-2 text-slate-300'>
            <li>Get the group code from the group creator</li>
            <li>Click &quot;Join Group&quot; on your dashboard</li>
            <li>Enter the group code</li>
            <li>Click &quot;Join&quot; to become a member</li>
            <li>
              Alternatively, use &quot;Quick Join as Guest&quot; for view-only
              access
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "creating-trip",
      title: "Creating a Trip",
      description: "How to create a new trip within a group",
      icon: <Plus className='w-6 h-6 text-amber-400' />,
      videoId: "creating-trip",
      instructions: (
        <>
          <ol className='list-decimal list-inside space-y-2 text-slate-300'>
            <li>Navigate to your group page</li>
            <li>Click the &quot;Create Trip&quot; button</li>
            <li>Enter trip details: name, start date, end date</li>
            <li>Add location (optional)</li>
            <li>
              Set initial status (Planning, Finalized, Ongoing, or Cancelled)
            </li>
            <li>Click &quot;Create Trip&quot; to finish</li>
          </ol>
        </>
      ),
    },
    {
      id: "adding-activities",
      title: "Adding Activities",
      description: "How to add activities to your trip schedule",
      icon: <Calendar className='w-6 h-6 text-amber-400' />,
      videoId: "adding-activity",
      instructions: (
        <>
          <ol className='list-decimal list-inside space-y-2 text-slate-300'>
            <li>Open the trip you want to add activities to</li>
            <li>Click the &quot;+ Add Activity&quot; button</li>
            <li>Fill in activity details: title, date, start time, end time</li>
            <li>Add notes or transportation details (optional)</li>
            <li>Click &quot;Create Activity&quot; to save</li>
            <li>View activities in Calendar or Schedule view</li>
          </ol>
        </>
      ),
    },
    {
      id: "managing-expenses",
      title: "Managing Expenses",
      description: "How to track and split expenses",
      icon: <DollarSign className='w-6 h-6 text-amber-400' />,
      videoId: "expenses",
      instructions: (
        <>
          <ol className='list-decimal list-inside space-y-2 text-slate-300'>
            <li>Navigate to the Expenses tab in your trip</li>
            <li>Click &quot;Add Expense&quot; to create a new expense</li>
            <li>Enter expense details: description, amount, date</li>
            <li>Select which group members to split the expense with</li>
            <li>Click &quot;Create Expense&quot; to save</li>
            <li>Mark expenses as paid when someone settles up</li>
            <li>View payment logs to track who has paid</li>
          </ol>
        </>
      ),
    },
    {
      id: "exporting-calendar",
      title: "Exporting to Calendar",
      description: "How to export your schedule to phone calendar",
      icon: <Download className='w-6 h-6 text-amber-400' />,
      videoId: "calendar",
      instructions: (
        <>
          <ol className='list-decimal list-inside space-y-2 text-slate-300'>
            <li>Open the trip you want to export</li>
            <li>Click the &quot;Export&quot; button</li>
            <li>Select &quot;Export as Calendar (.ics)&quot;</li>
            <li>Download the .ics file to your device</li>
            <li>Open the file on your phone</li>
            <li>
              Choose your calendar app (Google Calendar, Apple Calendar, etc.)
            </li>
            <li>
              All activities will be imported with dates, times, and details
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "save-to-home-screen",
      title: "Save to Home Screen",
      description:
        "How to add Wanderly to your iOS Home Screen for quick access",
      icon: <Smartphone className='w-6 h-6 text-amber-400' />,
      videoId: "how-to-pwa_d6ehwz",
      instructions: (
        <>
          <ol className='list-decimal list-inside space-y-2 text-slate-300'>
            <li>Open Safari and navigate to wanderly.app</li>
            <li>
              Tap the &quot;Share&quot; icon at the bottom of the screen (the
              square with an arrow pointing up)
            </li>
            <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
            <li>
              Edit the name if you wish, then tap &quot;Add&quot; in the top
              right corner
            </li>
            <li>
              Wanderly will now appear on your Home Screen as a standalone app!
            </li>
          </ol>
        </>
      ),
    },
  ];

  // Cloudinary video embed component
  // Replace YOUR_CLOUD_NAME with your actual Cloudinary cloud name
  // videoId should be the public_id of your video in Cloudinary
  const CloudinaryVideo = ({ videoId }: { videoId?: string }) => {
    if (!videoId) {
      return (
        <div className='w-full aspect-video bg-gradient-to-br from-purple-900/40 to-violet-900/40 border border-amber-500/30 rounded-xl flex items-center justify-center'>
          <div className='text-center space-y-3'>
            <Video className='w-16 h-16 text-amber-400 mx-auto opacity-50' />
            <p className='text-slate-400 text-sm'>Video tutorial coming soon</p>
            <p className='text-xs text-slate-500'>
              Add Cloudinary video ID to display tutorial
            </p>
          </div>
        </div>
      );
    }

    // Cloudinary video player embed
    // Format: https://res.cloudinary.com/{cloud_name}/video/upload/{public_id}
    // Replace YOUR_CLOUD_NAME with your actual Cloudinary cloud name
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== "YOUR_CLOUD_NAME"
        ? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        : "ddmrbjevx"; // Fallback to the one found in .env if not set

    return (
      <div className='w-full aspect-video rounded-xl overflow-hidden border border-amber-500/30 bg-black'>
        <iframe
          src={`https://player.cloudinary.com/embed/?public_id=${videoId}&cloud_name=${cloudName}&profile=default`}
          className='w-full h-full'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
          title='Tutorial video'
        />
      </div>
    );
  };

  return (
    <main className='min-h-screen bg-slate-950 text-white relative flex flex-col overflow-hidden'>
      {/* Background Effects matching Login/Register */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      <div className='relative z-10'>
        <Header />
        <div className='max-w-6xl mx-auto px-6 py-12 md:py-24 space-y-16'>
          {/* Header */}
          <div className='text-center space-y-6 max-w-3xl mx-auto'>
            <div className='inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl mb-4 border border-amber-500/30 shadow-2xl animate-pulse-slow'>
              <PlayCircle className='w-12 h-12 text-amber-500' />
            </div>
            <h1 className='text-4xl md:text-6xl font-black text-white leading-tight'>
              Master the{" "}
              <span className='bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
                Art of Planning.
              </span>
            </h1>
            <p className='text-xl text-slate-400 font-light'>
              A simple guide to navigating Wanderly like a pro.
            </p>
          </div>

          {/* Visual Step Cards / Timeline */}
          <div className='space-y-24 relative'>
            {/* Vertical Line Connector (Desktop) */}
            <div className='absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-slate-800 to-transparent hidden md:block -translate-x-1/2'></div>

            {tutorials.map((tutorial, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={tutorial.id}
                  className={`flex flex-col md:flex-row items-center gap-12 md:gap-24 relative ${isEven ? "" : "md:flex-row-reverse text-right"}`}
                >
                  {/* Step Number Indicator */}
                  <div className='absolute left-1/2 top-0 -translate-x-1/2 -translate-y-12 hidden md:flex w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-500 items-center justify-center font-black text-amber-400 z-20 shadow-xl shadow-amber-500/20'>
                    {index + 1}
                  </div>

                  {/* Text Content */}
                  <div className='flex-1 space-y-6 md:w-1/2'>
                    <div
                      className={`space-y-4 ${isEven ? "" : "flex flex-col items-end"}`}
                    >
                      <div className='p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit'>
                        {tutorial.icon}
                      </div>
                      <h2 className='text-3xl font-bold text-white'>
                        {tutorial.title}
                      </h2>
                      <p className='text-lg text-slate-400 font-light max-w-md'>
                        {tutorial.description}
                      </p>
                    </div>

                    <div
                      className={`bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl ${isEven ? "text-left" : "text-left"}`}
                    >
                      <h4 className='text-xs font-bold uppercase tracking-widest text-amber-500/70 mb-4'>
                        Instructions:
                      </h4>
                      <div className='text-slate-300 text-sm'>
                        {tutorial.instructions}
                      </div>
                    </div>
                  </div>

                  {/* Visual / Video Placeholder */}
                  <div className='flex-1 w-full md:w-1/2'>
                    <div className='relative group'>
                      <div className='absolute inset-0 bg-amber-500/5 blur-2xl rounded-3xl group-hover:bg-amber-500/10 transition-colors'></div>
                      <div className='relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl'>
                        <CloudinaryVideo videoId={tutorial.videoId} />
                      </div>
                      {/* Decorative Tag */}
                      <div
                        className={`absolute -bottom-4 ${isEven ? "-right-4" : "-left-4"} px-4 py-2 bg-slate-900 border border-amber-500/30 rounded-xl text-[10px] font-black uppercase tracking-tighter text-amber-400 shadow-xl`}
                      >
                        {tutorial.title}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help Section */}
          <div className='pt-12 border-t border-white/5'>
            <div className='bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-[3rem] p-12 text-center space-y-8'>
              <div className='space-y-4'>
                <h2 className='text-3xl font-bold italic'>
                  Need a bit more help?
                </h2>
                <p className='text-slate-300 max-w-xl mx-auto'>
                  If our guides didn&apos;t clear things up, our FAQ might have
                  what you&apos;re looking for. Or just start a group and see
                  where it takes you.
                </p>
              </div>
              <div className='flex flex-wrap items-center justify-center gap-6'>
                <button
                  onClick={() => router.push("/register")}
                  className='px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 transition-all font-bold shadow-xl shadow-amber-500/20'
                >
                  Start Planning Now
                </button>
                <button
                  onClick={() => router.push("/faq")}
                  className='px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium'
                >
                  Check the FAQ
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </main>
  );
};

export default HowToComponent;
