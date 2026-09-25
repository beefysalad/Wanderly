import { Calendar, ImageIcon, MoreVertical, Trash2 } from "lucide-react";

interface ITripActionsMenuProps {
  showExportMenu: boolean;
  setShowExportMenu: (value: boolean) => void;
  isExporting: boolean;
  handleExportSchedule: (format: "png" | "ics") => void;
  isTripCreator: boolean;
  setShowDeleteModal: (value: boolean) => void;
}

export const TripActionsMenu = ({
  showExportMenu,
  setShowExportMenu,
  isExporting,
  handleExportSchedule,
  isTripCreator,
  setShowDeleteModal,
}: ITripActionsMenuProps) => {
  return (
    <div className='relative'>
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        className='flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90'
      >
        <MoreVertical className='w-5 h-5' />
      </button>

      {showExportMenu && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setShowExportMenu(false)}
          />
          <div className='absolute right-0 top-full mt-3 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50'>
            <div className='px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] bg-white/5'>
              Options
            </div>
            <div className='px-4 py-2 text-[10px] text-amber-300/90 bg-amber-500/10 border-b border-white/5'>
              Export features are currently in beta.
            </div>
            <button
              onClick={() => {
                handleExportSchedule("png");
                setShowExportMenu(false);
              }}
              disabled={isExporting}
              className='w-full px-4 py-3.5 text-left hover:bg-white/5 text-slate-300 hover:text-white text-sm transition-colors flex items-center gap-3'
            >
              {isExporting ? (
                <span className='w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin' />
              ) : (
                <ImageIcon className='w-4 h-4' />
              )}
              Export Itinerary (PNG) Beta
            </button>
            <button
              onClick={() => {
                handleExportSchedule("ics");
                setShowExportMenu(false);
              }}
              disabled={isExporting}
              className='w-full px-4 py-3.5 text-left hover:bg-white/5 text-slate-300 hover:text-white text-sm transition-colors border-t border-white/5 flex items-center gap-3'
            >
              {isExporting ? (
                <span className='w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin' />
              ) : (
                <Calendar className='w-4 h-4' />
              )}
              Export Calendar (.ics) Beta
            </button>

            {isTripCreator && (
              <>
                <div className='px-4 py-2 text-[10px] font-black text-red-500/50 uppercase tracking-[0.2em] bg-red-500/5 border-t border-white/5'>
                  Danger Zone
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowExportMenu(false);
                  }}
                  className='w-full px-4 py-3.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5'
                >
                  <Trash2 className='w-4 h-4' />
                  Delete Trip
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
