"use client";

import { useState } from "react";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserStatsCards } from "./components/UserStatsCards";
import { UsersTable } from "./components/UsersTable";
import { useAdminUsers } from "./useAdminUsers";
import { filterUsers } from "./userListHelpers";

export default function UserManagementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { users, loading, deletingId, stats, handleDeleteUser } = useAdminUsers();
  const filteredUsers = filterUsers(users, searchQuery);

  return (
    <main className='min-h-screen bg-slate-950 text-slate-200'>
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button onClick={() => router.push("/admin")} className='p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors'>
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-white tracking-tight flex items-center gap-3'>
                User Management
                <Users className='w-6 h-6 text-blue-500' />
              </h1>
              <p className='text-slate-400'>Manage registered users and view activity</p>
            </div>
          </div>

          <UserStatsCards total={stats.total} newToday={stats.newToday} />
        </div>

        <div className='mb-6 relative'>
          <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
          <input
            type='text'
            placeholder='Search users by name or email...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all'
          />
        </div>

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin' />
          </div>
        ) : (
          <UsersTable users={filteredUsers} deletingId={deletingId} onDelete={handleDeleteUser} />
        )}
      </div>
    </main>
  );
}
