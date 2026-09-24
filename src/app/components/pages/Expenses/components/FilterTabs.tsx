import type { ExpensesView } from "../expenseStats";

interface IFilterTabsProps {
  isEmbedded: boolean;
  view: ExpensesView;
  setView: (view: ExpensesView) => void;
  counts: { all: number; unsettled: number; settled: number };
}

export const FilterTabs = ({ isEmbedded, view, setView, counts }: IFilterTabsProps) => {
  return (
    <div
      className={`flex items-center p-1.5 ${isEmbedded ? "bg-slate-800/40" : "bg-slate-950/50"} rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar`}
    >
      {[
        {
          id: "all",
          label: "All Expenses",
          icon: "📊",
          count: counts.all,
        },
        {
          id: "unsettled",
          label: "Unsettled",
          icon: "⏳",
          count: counts.unsettled,
        },
        {
          id: "settled",
          label: "Settled",
          icon: "✅",
          count: counts.settled,
        },
        {
          id: "analysis",
          label: "Analysis",
          icon: "📈",
          count: null,
        },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() =>
            setView(tab.id as ExpensesView)
          }
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            view === tab.id
              ? "bg-slate-700 text-white shadow-lg border border-white/10 scale-[1.02]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.count !== null && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                view === tab.id
                  ? "bg-slate-900 text-slate-300"
                  : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
