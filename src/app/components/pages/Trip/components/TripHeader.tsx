import { Calendar } from "lucide-react";
import type { Trip } from "@/src/shared/types";

type TripStatus = "planning" | "finalized" | "ongoing" | "cancelled";

interface ITripHeaderProps {
  trip: Trip;
  statusBadge: { label: string };
  startDate: Date;
  endDate: Date;
  isEditingStatus: boolean;
  setIsEditingStatus: (value: boolean) => void;
  handleStatusChange: (status: TripStatus) => void;
}

export const TripHeader = ({
  trip,
  statusBadge,
  startDate,
  endDate,
  isEditingStatus,
  setIsEditingStatus,
  handleStatusChange,
}: ITripHeaderProps) => {
  return (
    <div className='mb-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6'>
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-4'>
        <div className='text-center md:text-left'>
          <h1 className='text-3xl md:text-4xl font-semibold text-white mb-2 leading-tight'>
            {trip.name}
          </h1>
          <div className='flex items-center gap-3 mb-2 justify-center md:justify-start'>
            {!isEditingStatus ? (
              <button
                onClick={() => setIsEditingStatus(true)}
                className='text-[11px] uppercase tracking-wide font-medium px-2.5 py-1 rounded-md bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors'
              >
                {statusBadge.label}
              </button>
            ) : (
              <select
                value={trip.status || "planning"}
                onChange={(e) =>
                  handleStatusChange(
                    e.target.value as
                      | "planning"
                      | "finalized"
                      | "ongoing"
                      | "cancelled",
                  )
                }
                onBlur={() => setIsEditingStatus(false)}
                autoFocus
                className='text-xs uppercase font-medium px-3 py-1.5 rounded-md border border-white/10 bg-slate-800 text-slate-200 focus:outline-none focus:border-slate-500 cursor-pointer'
              >
                <option
                  value='planning'
                  className='bg-slate-900 text-white'
                >
                  PLANNING
                </option>
                <option
                  value='finalized'
                  className='bg-slate-900 text-white'
                >
                  FINALIZED
                </option>
                <option value='ongoing' className='bg-slate-900 text-white'>
                  ONGOING
                </option>
                <option
                  value='cancelled'
                  className='bg-slate-900 text-white'
                >
                  CANCELLED
                </option>
              </select>
            )}
            {trip.createdBy && (
              <span className='text-xs text-slate-400'>
                by {trip.createdBy}
              </span>
            )}
          </div>

          <div className='flex items-center gap-2 text-slate-400 justify-center md:justify-start text-sm'>
            <Calendar className='w-4 h-4' />
            <span>
              {startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {" - "}
              {endDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
