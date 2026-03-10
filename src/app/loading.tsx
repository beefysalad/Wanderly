import LoadingState from "./components/shared/LoadingState";

const AppLoading = () => {
  return (
    <main className='min-h-screen bg-slate-950 p-6'>
      <LoadingState fullScreen />
    </main>
  );
};

export default AppLoading;
