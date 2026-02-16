"use client";
import React, { useMemo } from "react";
import { Expense } from "@/src/shared/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface ExpenseChartsProps {
  expenses: Expense[];
}

const COLORS = [
  "#f97316", // Orange 500
  "#3b82f6", // Blue 500
  "#10b981", // Emerald 500
  "#a855f7", // Purple 500
  "#ef4444", // Red 500
  "#eab308", // Yellow 500
  "#ec4899", // Pink 500
  "#6366f1", // Indigo 500
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl'>
        <p className='text-slate-400 text-xs mb-1'>{label}</p>
        <p className='text-white font-bold text-sm'>
          ₱
          {payload[0].value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  }
  return null;
};

const ExpenseCharts = ({
  expenses,
  currentUserEmail,
}: ExpenseChartsProps & { currentUserEmail: string }) => {
  const [viewMode, setViewMode] = React.useState<"group" | "me">("group");

  // Process data for charts
  const { dailyData, categoryData, totalSpent } = useMemo(() => {
    const dailyMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();
    let total = 0;

    expenses.forEach((expense) => {
      let amount = Number(expense.amount);

      if (viewMode === "me") {
        // Calculate my share
        const splitWith = expense.splitWith || [];
        if (splitWith.includes(currentUserEmail)) {
          amount = amount / (splitWith.length || 1);
        } else {
          amount = 0; // Not involved
        }
      }

      if (amount > 0) {
        total += amount;

        // Daily Data
        const dateKey = format(new Date(expense.date), "MMM d");
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + amount);

        // Category Data
        const category = expense.category || "Uncategorized";
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      }
    });

    // Sort daily data chronologically
    const sortedDaily = Array.from(dailyMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const sortedCategory = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      dailyData: sortedDaily,
      categoryData: sortedCategory,
      totalSpent: total,
    };
  }, [expenses, viewMode, currentUserEmail]);

  if (expenses.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500'>
        <div className='w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6'>
          <span className='text-4xl'>📊</span>
        </div>
        <h3 className='text-xl font-bold text-white mb-2'>
          No Data to Analyze
        </h3>
        <p className='text-slate-400'>
          Add some expenses to see charts and insights here.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <div className='flex items-center justify-end'>
        <div className='bg-slate-800/50 p-1 rounded-xl border border-white/5 inline-flex relative'>
          {/* Slider Background */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-700/80 rounded-lg shadow-sm transition-all duration-300 ease-in-out ${
              viewMode === "group" ? "left-1" : "left-[50%]"
            }`}
          />
          <button
            onClick={() => setViewMode("group")}
            className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors z-10 ${
              viewMode === "group"
                ? "text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Group Spending
          </button>
          <button
            onClick={() => setViewMode("me")}
            className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors z-10 ${
              viewMode === "me"
                ? "text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            My Spending
          </button>
        </div>
      </div>

      {/* Total Summary Card */}
      <div className='bg-gradient-to-br from-slate-900 to-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden'>
        <div className='absolute top-0 right-0 p-6 opacity-5'>
          <span className='text-8xl'>💰</span>
        </div>
        <p className='text-slate-400 font-medium mb-1 uppercase tracking-wider text-xs'>
          {viewMode === "group" ? "Total Group Spending" : "My Total Spending"}
        </p>
        <h2 className='text-4xl sm:text-5xl font-bold text-white tracking-tight'>
          ₱
          {totalSpent.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h2>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Daily Expenses Bar Chart */}
        <div className='bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6'>
          <h3 className='text-lg font-bold text-white mb-6 flex items-center gap-2'>
            <span className='p-1.5 rounded-lg bg-blue-500/10 text-blue-400'>
              📅
            </span>
            Daily Spending
          </h3>
          <div className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={dailyData}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#334155'
                  opacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey='name'
                  stroke='#94a3b8'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke='#94a3b8'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₱${value}`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#334155", opacity: 0.2 }}
                />
                <Bar
                  dataKey='value'
                  fill='url(#colorValue)'
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                >
                  {dailyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "#f97316" : "#fb923c"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className='bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6'>
          <h3 className='text-lg font-bold text-white mb-6 flex items-center gap-2'>
            <span className='p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400'>
              🏷️
            </span>
            Category Breakdown
          </h3>
          <div className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx='40%'
                  cy='50%'
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey='value'
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke='rgba(0,0,0,0)'
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout='vertical'
                  verticalAlign='middle'
                  align='right'
                  iconType='circle'
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value, entry: any) => (
                    <span className='text-slate-300 text-sm ml-2 font-medium'>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCharts;
