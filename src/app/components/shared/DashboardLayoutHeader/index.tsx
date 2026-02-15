"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface IDashboardLayoutHeaderProps {
  /**
   * Title to display in the header.
   * If not provided, the header will only show navigation/actions.
   */
  title?: ReactNode;

  /**
   * Description/subtitle to display below the title
   */
  description?: string | ReactNode;

  /**
   * Whether to show the back button.
   * @default false
   */
  showBack?: boolean;

  /**
   * Function to call when back button is clicked.
   * If not provided and showBack is true, router.back() will be used.
   */
  onBack?: () => void;

  /**
   * Custom URL to navigate to when back button is clicked.
   * Takes precedence over router.back(), but onBack takes precedence (if you want custom logic).
   */
  backUrl?: string;

  /**
   * Content to display on the right side of the header
   */
  rightContent?: ReactNode;

  /**
   * Content to display in the center (e.g. tabs)
   */
  centerContent?: ReactNode;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Whether to apply sticky positioning
   * @default false
   */
  sticky?: boolean;
}

export default function DashboardLayoutHeader({
  title,
  description,
  showBack = false,
  onBack,
  backUrl,
  rightContent,
  centerContent,
  className = "",
  sticky = false,
}: IDashboardLayoutHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div
      className={`
        flex items-center justify-between mb-8 py-2
        ${sticky ? "sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 border-b border-white/5 pb-4 pt-4 mb-4" : ""} 
        ${className}
      `}
    >
      <div
        className={`flex items-center gap-4 ${centerContent ? "flex-1" : ""}`}
      >
        {showBack && (
          <button
            onClick={handleBack}
            className='p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors inline-flex items-center gap-2 text-slate-400 hover:text-white group'
            aria-label='Go back'
          >
            <ArrowLeft className='w-5 h-5 transition-transform group-hover:-translate-x-0.5' />
          </button>
        )}

        {title && (
          <div className={`${showBack ? "" : ""}`}>
            <h1 className='text-xl sm:text-2xl font-bold text-white flex items-center gap-2'>
              {title}
            </h1>
            {description && (
              <p className='text-xs sm:text-sm text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs'>
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {centerContent && (
        <div className='flex-1 flex justify-center'>{centerContent}</div>
      )}

      {/* Right Content / Spacer if needed to balance center content */}
      <div
        className={`flex items-center gap-2 ${centerContent ? "flex-1 justify-end" : ""}`}
      >
        {rightContent}
      </div>
    </div>
  );
}
