import { Loader2 } from "lucide-react";

const AppLoading = () => {
  return (
    <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
      <div className='text-center'>
        <Loader2 className='w-8 h-8 animate-spin text-slate-400 mx-auto mb-3' />
        <p className='text-slate-400 text-sm'>Loading...</p>
      </div>
    </main>
  );
};

export default AppLoading;
