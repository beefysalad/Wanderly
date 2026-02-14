"use client";

import {
  Calendar,
  DollarSign,
  Download,
  PlayCircle,
  Plus,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../../shared/Header";
import Footer from "../../shared/Footer";
// AuthModal import removed
import QuickJoinModal from "../../shared/Modal/QuickJoinModal";

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
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const tutorials: TutorialItem[] = [
    {
      id: "creating-group",
      title: "Creating a Group",
      description: "Learn how to create your first travel group",
      icon: <Users className='w-6 h-6 text-amber-400' />,
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
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME";

    return (
      <div className='w-full aspect-video rounded-xl overflow-hidden border border-amber-500/30 bg-black'>
        <iframe
          src={`https://player.cloudinary.com/embed?public_id=${videoId}&cloud_name=${cloudName}`}
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
        <Header
          // AuthModal props removed
          setShowQuickJoinModal={setShowQuickJoinModal}
        />
        <div className='max-w-4xl mx-auto px-4 py-8'>
          <div className='space-y-8'>
            {/* Header */}
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-4 shadow-lg'>
                <PlayCircle className='w-10 h-10 text-white' />
              </div>
              <h1 className='text-4xl md:text-5xl font-bold text-white'>
                How To{" "}
                <span className='bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
                  Guides
                </span>
              </h1>
              <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
                Step-by-step video tutorials to help you get the most out of
                Wanderly
              </p>
            </div>

            {/* Tutorial Items */}
            <div className='bg-gradient-to-br from-purple-900/30 to-violet-900/30 border border-amber-500/20 rounded-2xl p-6 sm:p-8 md:p-10 backdrop-blur-sm shadow-2xl'>
              <div className='space-y-4'>
                {tutorials.map((tutorial) => {
                  const isOpen = openItems.has(tutorial.id);
                  return (
                    <div
                      key={tutorial.id}
                      className='bg-white/5 backdrop-blur-sm rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all overflow-hidden'
                    >
                      <button
                        onClick={() => toggleItem(tutorial.id)}
                        className='w-full p-5 text-left flex items-start gap-4 hover:bg-white/5 transition-colors'
                      >
                        <div className='p-2 bg-amber-500/20 rounded-lg shrink-0'>
                          {tutorial.icon}
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-white mb-1 pr-8'>
                            {tutorial.title}
                          </h3>
                          <p className='text-sm text-slate-400 mb-2'>
                            {tutorial.description}
                          </p>
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              isOpen
                                ? "max-h-[2000px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className='space-y-4 pt-4'>
                              {/* Video Section */}
                              <CloudinaryVideo videoId={tutorial.videoId} />

                              {/* Instructions Section */}
                              {tutorial.instructions && (
                                <div className='bg-white/5 rounded-lg p-4 border border-amber-500/10'>
                                  <h4 className='text-sm font-semibold text-amber-400 mb-3'>
                                    Step-by-Step Instructions:
                                  </h4>
                                  <div className='text-sm leading-relaxed'>
                                    {tutorial.instructions}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='shrink-0'>
                          <svg
                            className={`w-5 h-5 text-amber-400 transition-transform duration-300 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 9l-7 7-7-7'
                            />
                          </svg>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Help Section */}
            <div className='text-center space-y-4'>
              <p className='text-slate-300'>
                Need more help? Check out our FAQ or get started with Wanderly!
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <button
                  onClick={() => {
                    router.push("/register");
                  }}
                  className='px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all font-semibold shadow-lg hover:shadow-amber-500/50 active:scale-[0.98]'
                >
                  Get Started
                </button>
                <button
                  onClick={() => router.push("/faq")}
                  className='px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 transition-all font-semibold active:scale-[0.98]'
                >
                  View FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* AuthModal rendering removed */}
      {showQuickJoinModal && (
        <QuickJoinModal
          onClose={() => setShowQuickJoinModal(false)}
          onJoin={(code: string, guestName: string) => {
            console.log("Quick join:", code, guestName);
          }}
        />
      )}
    </main>
  );
};

export default HowToComponent;
