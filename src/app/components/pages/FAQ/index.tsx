"use client";

import {
  Calendar,
  DollarSign,
  Download,
  Eye,
  HelpCircle,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../../shared/Header";
import AuthModal from "../../shared/Modal/AuthModal";
import QuickJoinModal from "../../shared/Modal/QuickJoinModal";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const FAQComponent = () => {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "signup">(
    "signin"
  );
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
      id: "ics-file",
      question: "What is an .ics file?",
      answer:
        "An .ics file is a standard calendar file format (iCalendar) that's completely safe to download and use. It's the same format used by Google Calendar, Apple Calendar, Microsoft Outlook, and most other calendar applications. When you export your trip schedule as an .ics file from Wanderly, you can import it directly into your phone's calendar app. The file contains only your trip activities (dates, times, titles, and notes) - no personal information or sensitive data. It's a text-based format that's been used for decades and is trusted by millions of users worldwide.",
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
        "Yes, but with restrictions: Only the creator of a group can delete it. When you delete a group, all trips and activities within it are also deleted. For trips, only the group creator can delete trips. If you're a member (not the creator) and want to leave, use the 'Leave' button on the group page. This removes you from the group but doesn't delete it for others.",
      icon: <Trash2 className='w-6 h-6 text-amber-400' />,
    },
    {
      id: "data-security",
      question: "Is my data secure?",
      answer:
        "Yes! Wanderly uses Firebase Authentication for secure login, which is trusted by millions of apps worldwide. Your password is encrypted and never stored in plain text. Group codes are unique and randomly generated, making them hard to guess. Only members of your groups can see your trips and activities. We don't share your data with third parties. Your information is private to you and your group members.",
      icon: <Shield className='w-6 h-6 text-amber-400' />,
    },
  ];

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl'></div>
        <div
          className='absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl'
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className='relative z-10'>
        <Header
          setAuthDefaultTab={setAuthDefaultTab}
          setShowAuthModal={setShowAuthModal}
          setShowQuickJoinModal={setShowQuickJoinModal}
        />
        <div className='max-w-4xl mx-auto px-4 py-8'>
          <div className='space-y-8'>
            {/* Header */}
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-4 shadow-lg'>
                <HelpCircle className='w-10 h-10 text-white' />
              </div>
              <h1 className='text-4xl md:text-5xl font-bold text-white'>
                Frequently Asked{" "}
                <span className='bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent'>
                  Questions
                </span>
              </h1>
              <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
                Everything you need to know about Wanderly
              </p>
            </div>

            {/* FAQ Items */}
            <div className='bg-gradient-to-br from-purple-900/30 to-violet-900/30 border border-amber-500/20 rounded-2xl p-6 sm:p-8 md:p-10 backdrop-blur-sm shadow-2xl'>
              <div className='space-y-4'>
                {faqs.map((faq) => {
                  const isOpen = openItems.has(faq.id);
                  return (
                    <div
                      key={faq.id}
                      className='bg-white/5 backdrop-blur-sm rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all overflow-hidden'
                    >
                      <button
                        onClick={() => toggleItem(faq.id)}
                        className='w-full p-5 text-left flex items-start gap-4 hover:bg-white/5 transition-colors'
                      >
                        <div className='p-2 bg-amber-500/20 rounded-lg shrink-0'>
                          {faq.icon}
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-white mb-2 pr-8'>
                            {faq.question}
                          </h3>
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              isOpen
                                ? "max-h-[1000px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <p className='text-sm text-slate-300 leading-relaxed pt-2'>
                              {faq.answer}
                            </p>
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
                Still have questions? We&apos;re here to help!
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <button
                  onClick={() => {
                    setAuthDefaultTab("signup");
                    setShowAuthModal(true);
                  }}
                  className='px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all font-semibold shadow-lg hover:shadow-amber-500/50 active:scale-[0.98]'
                >
                  Get Started
                </button>
                <button
                  onClick={() => router.push("/about")}
                  className='px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 transition-all font-semibold active:scale-[0.98]'
                >
                  Learn More About Wanderly
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          defaultTab={authDefaultTab}
        />
      )}
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
