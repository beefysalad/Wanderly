import NotificationBell from "../../../shared/NotificationBell";

interface IDashboardHeaderProps {
  handleLogout: () => void;
  userEmail: string | undefined;
}
const DashboardHeader = ({
  handleLogout,
  userEmail,
}: IDashboardHeaderProps) => {
  return (
    <div className='flex items-center justify-between mb-6'>
      <div className='min-w-0 flex-1'>
        <h1 className='text-2xl sm:text-3xl font-bold text-white flex items-center gap-2'>
          Travel
        </h1>
        <p className='text-xs sm:text-sm text-slate-400 mt-1 truncate'>
          {userEmail}
        </p>
      </div>
      <div className='flex-shrink-0'>
        <NotificationBell />
      </div>
    </div>
  );
};

export default DashboardHeader;
