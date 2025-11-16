import { Group } from "@/src/shared/types";
import { CalendarIcon, Code2, Compass, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { getGroupColorClasses } from "@/lib/utils/groupColors";

interface IGroupsViewProps {
  groups: Group[];
  handleNavigateToGroup: (groupId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const GroupsView = ({ groups, handleNavigateToGroup }: IGroupsViewProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(groups.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedGroups = groups.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (groups.length === 0) {
    return (
      <div className='bg-white rounded-xl border border-slate-200 p-12 text-center'>
        <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <Compass className='w-8 h-8 text-slate-400' />
        </div>
        <p className='text-slate-600 font-medium mb-2'>No groups yet</p>
        <p className='text-slate-500 text-sm'>
          Create your first group to start planning amazing trips!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-4'>
        {paginatedGroups.map((group) => {
          const colors = getGroupColorClasses(group.colorScheme);
          const hasEmoji = !!group.emoji;
          return (
            <button
              key={group.id}
              onClick={() => handleNavigateToGroup(group.id)}
              className={`w-full bg-white rounded-xl border border-slate-200 p-5 ${colors.hoverBorder} hover:shadow-lg transition-all duration-200 text-left active:scale-[0.98]`}
            >
              <div className='flex items-start justify-between gap-3 mb-4'>
                <div className={`w-12 h-12 ${hasEmoji ? 'bg-slate-100' : colors.bg} rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${hasEmoji ? '' : 'text-white'} text-2xl`}>
                  {group.emoji || <Compass className='w-6 h-6' />}
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 ${colors.bgLight} ${colors.textDark} rounded-full border ${colors.borderLight} flex-shrink-0`}>
                  <Code2 className='w-3 h-3' />
                  {group.code}
                </div>
              </div>

              <h3 className='text-lg font-semibold text-slate-900 mb-3 line-clamp-2'>
                {group.name}
              </h3>

              <div className='flex items-center gap-4 text-sm text-slate-600'>
                <div className='flex items-center gap-1.5'>
                  <CalendarIcon className={`w-4 h-4 ${colors.icon}`} />
                  <span className='font-medium'>{group.trips?.length || 0}</span>
                  <span>trips</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <Users className={`w-4 h-4 ${colors.icon}`} />
                  <span className='font-medium'>
                    {group.memberEmails?.length || 0}
                  </span>
                  <span>members</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className='mt-6 flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4'>
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentPage === 1
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ChevronLeft className='w-4 h-4' />
            Previous
          </button>

          <span className='text-sm font-medium text-slate-600'>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentPage === totalPages
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Next
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      )}
    </>
  );
};

export default GroupsView;

