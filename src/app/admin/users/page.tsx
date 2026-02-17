"use client";

import axios from "axios";
import { format } from "date-fns";
import {
  Activity,
  ArrowLeft,
  Search,
  Trash2,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  authCreationTime: string | null;
  stats: {
    trips: number;
    groups: number;
  };
}

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [stats, setStats] = useState({ total: 0, newToday: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const password = sessionStorage.getItem("admin_password");
      if (!password) {
        toast.error("Unauthorized");
        router.push("/admin");
        return;
      }

      const response = await axios.get("/api/admin/users", {
        headers: {
          "x-admin-password": password,
        },
      });

      setUsers(response.data.users);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone and will delete all their data from Database and Firebase.",
      )
    ) {
      return;
    }

    setDeletingId(userId);
    try {
      const password = sessionStorage.getItem("admin_password");
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: {
          "x-admin-password": password,
        },
      });

      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatus = (lastLoginAt: string | null) => {
    if (!lastLoginAt) return "offline";
    const lastLogin = new Date(lastLoginAt);
    const now = new Date();
    const diff = now.getTime() - lastLogin.getTime();

    // Online if active in last 15 mins
    if (diff < 15 * 60 * 1000) return "online";
    // Active if active in last 24 hours
    if (diff < 24 * 60 * 60 * 1000) return "active";
    return "offline";
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className='min-h-screen bg-slate-950 text-slate-200'>
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.push("/admin")}
              className='p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-white tracking-tight flex items-center gap-3'>
                User Management
                <Users className='w-6 h-6 text-blue-500' />
              </h1>
              <p className='text-slate-400'>
                Manage registered users and view activity
              </p>
            </div>
          </div>

          <div className='flex gap-4'>
            <div className='bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4 min-w-[180px]'>
              <div className='p-3 bg-blue-500/10 rounded-xl'>
                <Users className='w-6 h-6 text-blue-400' />
              </div>
              <div>
                <div className='text-xs text-slate-400 uppercase font-bold tracking-wider'>
                  Total Users
                </div>
                <div className='text-2xl font-bold text-white'>
                  {stats.total}
                </div>
              </div>
            </div>
            <div className='bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4 min-w-[180px]'>
              <div className='p-3 bg-emerald-500/10 rounded-xl'>
                <Activity className='w-6 h-6 text-emerald-400' />
              </div>
              <div>
                <div className='text-xs text-slate-400 uppercase font-bold tracking-wider'>
                  New Today
                </div>
                <div className='text-2xl font-bold text-white'>
                  +{stats.newToday}
                </div>
              </div>
            </div>
          </div>
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
          <div className='bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-400 font-bold'>
                    <th className='px-6 py-4'>User</th>
                    <th className='px-6 py-4'>Status</th>
                    <th className='px-6 py-4'>Stats</th>
                    <th className='px-6 py-4'>Joined</th>
                    <th className='px-6 py-4'>Last Active</th>
                    <th className='px-6 py-4 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/5'>
                  {filteredUsers.map((user) => {
                    const status = getStatus(user.lastLoginAt);
                    return (
                      <tr
                        key={user.id}
                        className='hover:bg-white/[0.02] transition-colors group'
                      >
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0'>
                              {user.imageUrl ? (
                                <img
                                  src={user.imageUrl}
                                  alt={user.name}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <span className='text-xs font-bold text-slate-500'>
                                  {user.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className='font-medium text-white'>
                                {user.name}
                              </div>
                              <div className='text-sm text-slate-500'>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            {status === "online" && (
                              <div className='flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20'>
                                <div className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
                                <span className='text-xs font-bold text-emerald-500 uppercase tracking-wider'>
                                  Online
                                </span>
                              </div>
                            )}
                            {status === "active" && (
                              <div className='flex items-center gap-2 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20'>
                                <div className='w-2 h-2 rounded-full bg-amber-500' />
                                <span className='text-xs font-bold text-amber-500 uppercase tracking-wider'>
                                  Active
                                </span>
                              </div>
                            )}
                            {status === "offline" && (
                              <div className='flex items-center gap-2 px-2 py-1 rounded-full bg-slate-500/10 border border-slate-500/20'>
                                <div className='w-2 h-2 rounded-full bg-slate-500' />
                                <span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                                  Offline
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex gap-2 text-xs font-medium'>
                            <span className='px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20'>
                              {user.stats.trips} Trips
                            </span>
                            <span className='px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20'>
                              {user.stats.groups} Groups
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4 text-sm text-slate-400'>
                          <div className='flex flex-col'>
                            <span>
                              {format(new Date(user.createdAt), "MMM d, yyyy")}
                            </span>
                            <span className='text-xs text-slate-600'>
                              ID: {user.id.slice(0, 8)}...
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4 text-sm text-slate-400'>
                          {user.lastLoginAt ? (
                            <div className='flex items-center gap-2 text-slate-300'>
                              <Activity className='w-3 h-3 text-slate-600' />
                              {format(
                                new Date(user.lastLoginAt),
                                "MMM d, HH:mm",
                              )}
                            </div>
                          ) : (
                            <span className='text-slate-600'>Never</span>
                          )}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingId === user.id}
                            className='p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            title='Delete User'
                          >
                            {deletingId === user.id ? (
                              <div className='w-4 h-4 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin' />
                            ) : (
                              <Trash2 className='w-4 h-4' />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-6 py-12 text-center text-slate-500'
                      >
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
