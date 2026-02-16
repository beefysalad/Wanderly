"use client";

import {
  Calendar,
  DollarSign,
  Download,
  Eye,
  HelpCircle,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../../shared/Header";
import Footer from "../../shared/Footer";
// AuthModal import removed
import QuickJoinModal from "../../shared/Modal/QuickJoinModal";

interface FAQItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
  icon: React.ReactNode;
}

const FAQComponent = () => {
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

  const faqs: FAQItem[] = [
    {
      id: "what-is-wanderly",
      question: "What is Wanderly?",
      answer:
        "Wanderly is an all-in-one platform designed to make group trip planning seamless and stress-free. Instead of juggling multiple apps, confusing spreadsheets, and endless group chats, Wanderly brings everything together in one beautiful, intuitive platform. You can create groups, plan trips with friends, manage schedules with visual calendar and list views, track and split expenses fairly, and export your schedule to your phone's calendar. Wanderly was built specifically for group travel by me who wanted to solve the common frustrations of trip planning. It's currently in beta and completely free to use.",
      icon: <Sparkles className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "ics-file",
      question: "What is an .ics file?",
      answer: (
        <>
          An .ics file is a standard calendar file format (iCalendar)
          that&apos;s completely safe to download and use. It&apos;s the same
          format used by Google Calendar, Apple Calendar, Microsoft Outlook, and
          most other calendar applications. When you export your trip schedule
          as an .ics file from Wanderly, you can import it directly into your
          phone&apos;s calendar app. The file contains only your trip activities
          (dates, times, titles, and notes) - no personal information or
          sensitive data. It&apos;s a text-based format that&apos;s been used
          for decades and is trusted by millions of users worldwide.
          <br />
          <br />
          <span className='text-amber-300'>Learn more: </span>
          <a
            href='https://en.wikipedia.org/wiki/ICalendar'
            target='_blank'
            rel='noopener noreferrer'
            className='text-amber-400 hover:text-amber-300 underline'
          >
            Wikipedia - iCalendar
          </a>
          {" • "}
          <a
            href='https://datatracker.ietf.org/doc/html/rfc5545'
            target='_blank'
            rel='noopener noreferrer'
            className='text-amber-400 hover:text-amber-300 underline'
          >
            RFC 5545 (Official Standard)
          </a>
        </>
      ),
      icon: <Calendar className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "join-group",
      question: "How do I join a group?",
      answer:
        "You can join a group in two ways: 1) If you have an account, ask the group creator for the group code and enter it when prompted. 2) If you don't have an account, use the 'Quick Join as Guest' option from the landing page. Enter the group code and your name to view the group (view-only access). To get full access to create trips and manage activities, you'll need to create a free account.",
      icon: <Users className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "create-trip",
      question: "How do I create a trip?",
      answer:
        "To create a trip, first join or create a group. Then, click the 'Create Trip' button in your group. You'll need to provide: the trip name, start and end dates, location (optional), and initial status (Planning, Confirmed, or Completed). Once created, you can add activities, track expenses, and manage the trip schedule.",
      icon: <Plus className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "expense-splitting",
      question: "How does expense splitting work?",
      answer:
        "When you create an expense, you can choose which group members to split it with. Select the members from the checkbox list, or use 'Select All' to include everyone. The expense amount is automatically divided equally among selected members. When someone marks the expense as paid, it's recorded in the payment log. You can view all expenses, see who's paid, and track the payment history in the Expenses tab of any trip.",
      icon: <DollarSign className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "no-account",
      question: "Can I use Wanderly without an account?",
      answer:
        "Yes! You can use 'Quick Join as Guest' to view groups and trips without creating an account. However, guest access is view-only - you can't create trips, add activities, or manage expenses. To get full access to all features, create a free account by clicking 'Sign Up' on the landing page. It only takes a minute and requires just your email and a password.",
      icon: <UserPlus className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "export-schedule",
      question: "How do I export my schedule?",
      answer:
        "On any trip's schedule page, click the 'Export' button. You'll see two options: 1) Export as PNG - creates an image file perfect for sharing or saving as a screenshot. 2) Export as Calendar (.ics) - creates a calendar file you can import into Google Calendar, Apple Calendar, or Outlook. The .ics file includes all your activities with dates, times, titles, and notes, so they'll appear in your phone's calendar app.",
      icon: <Download className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "calendar-vs-schedule",
      question: "What's the difference between Calendar and Schedule views?",
      answer:
        "The Calendar view shows your activities organized by day in a visual calendar format - perfect for seeing your trip at a glance. The Schedule view displays activities in a detailed list format, making it easier to see all the information about each activity. Both views show the same activities, just organized differently. You can switch between them using the tabs at the top of the trip page.",
      icon: <Eye className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "invite-friends",
      question: "How do I invite friends to my group?",
      answer:
        "Share your group code with friends! You can find the group code on the group page. Friends can either: 1) Create an account and join using the code, or 2) Use Quick Join as Guest if they just want to view. Only the group creator can delete the group, but all members can create trips and manage activities within the group.",
      icon: <Users className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "delete-trip-group",
      question: "Can I delete a trip or group?",
      answer:
        "Yes, but with restrictions: Only the creator of a group can delete it. When you delete a group, all trips and activities within it are also deleted. For trips, only the trip creator can delete their own trips. If you're a member (not the creator) and want to leave, use the 'Leave' button on the group page. This removes you from the group but doesn't delete it for others.",
      icon: <Trash2 className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "data-security",
      question: "Is my data secure?",
      answer: (
        <>
          Yes! Wanderly uses Firebase Authentication for secure login, which is
          trusted by millions of apps worldwide. Your password is encrypted and
          never stored in plain text. Group codes are unique and randomly
          generated, making them hard to guess. Only members of your groups can
          see your trips and activities. We don&apos;t share your data with
          third parties. Your information is private to you and your group
          members.
          <br />
          <br />
          <span className='text-amber-300'>Learn more: </span>
          <a
            href='https://firebase.google.com/docs/auth'
            target='_blank'
            rel='noopener noreferrer'
            className='text-amber-400 hover:text-amber-300 underline'
          >
            Firebase Authentication Documentation
          </a>
          {" • "}
          <a
            href='https://firebase.google.com/support/privacy'
            target='_blank'
            rel='noopener noreferrer'
            className='text-amber-400 hover:text-amber-300 underline'
          >
            Firebase Privacy & Security
          </a>
        </>
      ),
      icon: <Shield className='w-6 h-6 text-amber-400' />,
    },
  ];

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
              <HelpCircle className='w-12 h-12 text-amber-500' />
            </div>
            <h1 className='text-4xl md:text-6xl font-black text-white leading-tight'>
              Got{" "}
              <span className='bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
                Questions?
              </span>
              <br />
              I&apos;ve got answers.
            </h1>
            <p className='text-xl text-slate-400 font-light'>
              Everything you need to know about planning your next group
              adventure with Wanderly.
            </p>
          </div>

          {/* Categorized FAQ Sections */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Category: The Basics */}
            <div className='space-y-6'>
              <div className='flex items-center gap-3 px-2'>
                <h2 className='text-xl font-bold uppercase tracking-widest text-slate-500'>
                  The Basics
                </h2>
              </div>
              <div className='space-y-4'>
                {faqs
                  .filter((f) =>
                    ["what-is-wanderly", "no-account"].includes(f.id),
                  )
                  .map((faq) => {
                    const isOpen = openItems.has(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all duration-300'
                      >
                        <button
                          onClick={() => toggleItem(faq.id)}
                          className='w-full p-6 text-left flex flex-col gap-2'
                        >
                          <div className='flex items-center justify-between w-full'>
                            <h3 className='font-bold text-lg text-white group-hover:text-amber-400 transition-colors'>
                              {faq.question}
                            </h3>
                            <Plus
                              className={`w-5 h-5 text-amber-500 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                            />
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 opacity-0"}`}
                          >
                            <div className='text-slate-400 leading-relaxed font-light border-t border-white/5 pt-4'>
                              {faq.answer}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Category: Group Coordination */}
            <div className='space-y-6'>
              <div className='flex items-center gap-3 px-2'>
                <h2 className='text-xl font-bold uppercase tracking-widest text-slate-500'>
                  Coordination
                </h2>
              </div>
              <div className='space-y-4'>
                {faqs
                  .filter((f) =>
                    [
                      "join-group",
                      "invite-friends",
                      "delete-trip-group",
                    ].includes(f.id),
                  )
                  .map((faq) => {
                    const isOpen = openItems.has(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all duration-300'
                      >
                        <button
                          onClick={() => toggleItem(faq.id)}
                          className='w-full p-6 text-left flex flex-col gap-2'
                        >
                          <div className='flex items-center justify-between w-full'>
                            <h3 className='font-bold text-lg text-white group-hover:text-amber-400 transition-colors'>
                              {faq.question}
                            </h3>
                            <Plus
                              className={`w-5 h-5 text-amber-500 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                            />
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 opacity-0"}`}
                          >
                            <div className='text-slate-400 leading-relaxed font-light border-t border-white/5 pt-4'>
                              {faq.answer}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Category: Planning & Tech */}
            <div className='space-y-6'>
              <div className='flex items-center gap-3 px-2'>
                <Calendar className='w-5 h-5 text-amber-500' />
                <h2 className='text-xl font-bold uppercase tracking-widest text-slate-500'>
                  Planning & Sync
                </h2>
              </div>
              <div className='space-y-4'>
                {faqs
                  .filter((f) =>
                    [
                      "create-trip",
                      "export-schedule",
                      "calendar-vs-schedule",
                      "ics-file",
                    ].includes(f.id),
                  )
                  .map((faq) => {
                    const isOpen = openItems.has(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all duration-300'
                      >
                        <button
                          onClick={() => toggleItem(faq.id)}
                          className='w-full p-6 text-left flex flex-col gap-2'
                        >
                          <div className='flex items-center justify-between w-full'>
                            <h3 className='font-bold text-lg text-white group-hover:text-amber-400 transition-colors'>
                              {faq.question}
                            </h3>
                            <Plus
                              className={`w-5 h-5 text-amber-500 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                            />
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 opacity-0"}`}
                          >
                            <div className='text-slate-400 leading-relaxed font-light border-t border-white/5 pt-4'>
                              {faq.answer}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Category: Money & Security */}
            <div className='space-y-6'>
              <div className='flex items-center gap-3 px-2'>
                <Shield className='w-5 h-5 text-amber-500' />
                <h2 className='text-xl font-bold uppercase tracking-widest text-slate-500'>
                  Money & Safety
                </h2>
              </div>
              <div className='space-y-4'>
                {faqs
                  .filter((f) =>
                    ["expense-splitting", "data-security"].includes(f.id),
                  )
                  .map((faq) => {
                    const isOpen = openItems.has(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className='group bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all duration-300'
                      >
                        <button
                          onClick={() => toggleItem(faq.id)}
                          className='w-full p-6 text-left flex flex-col gap-2'
                        >
                          <div className='flex items-center justify-between w-full'>
                            <h3 className='font-bold text-lg text-white group-hover:text-amber-400 transition-colors'>
                              {faq.question}
                            </h3>
                            <Plus
                              className={`w-5 h-5 text-amber-500 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                            />
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 opacity-0"}`}
                          >
                            <div className='text-slate-400 leading-relaxed font-light border-t border-white/5 pt-4'>
                              {faq.answer}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className='pt-12 border-t border-white/5'>
            <div className='bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-[3rem] p-12 text-center space-y-8'>
              <div className='space-y-4'>
                <h2 className='text-3xl font-bold italic'>Still confused?</h2>
                <p className='text-slate-300 max-w-xl mx-auto'>
                  Don&apos;t worry, even we get confused sometimes. If your
                  question is really specific, feel free to reach out or just
                  jump in and try it out.
                </p>
              </div>
              <div className='flex flex-wrap items-center justify-center gap-6'>
                <button
                  onClick={() => router.push("/register")}
                  className='px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 transition-all font-bold shadow-xl shadow-amber-500/20'
                >
                  Start Your First Trip
                </button>
                <button
                  onClick={() => router.push("/about")}
                  className='px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium'
                >
                  The Story Behind Wanderly
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

export default FAQComponent;
