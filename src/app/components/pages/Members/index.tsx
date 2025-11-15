"use client";
import { ArrowLeft, Crown, Mail, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { useGroup } from "@/src/hooks/useGroups";

interface IMembersComponent {
  groupId: string;
}
const MembersComponent = ({ groupId }: IMembersComponent) => {
  const router = useRouter();
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const group = groupData?.group || null;

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };
  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-amber-500",
      "bg-orange-500",
      "bg-rose-500",
      "bg-pink-500",
      "bg-purple-500",
      "bg-blue-500",
      "bg-cyan-500",
      "bg-teal-500",
      "bg-emerald-500",
      "bg-lime-500",
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-gray-600'>Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-gray-600'>Group not found</div>
      </div>
    );
  }
  return (
    <div className='min-h-screen bg-white p-4 md:p-8'>
      <div className='max-w-4xl mx-auto'>
        <button
          onClick={() => router.back()}
          className='mb-6 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-medium'
        >
          <ArrowLeft className='w-5 h-5' />
          Back
        </button>

        <div className='bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 mb-8 shadow-2xl'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'>
              <Users className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-white'>Group Members</h1>
              <p className='text-white/80'>{group.name}</p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {group.memberEmails && group.memberEmails.length > 0 ? (
            group.memberEmails.map((email, index) => {
              const isCreator = email === group.createdBy;

              return (
                <div
                  key={email}
                  className='bg-gray-50 border border-gray-200 rounded-xl p-6 hover:bg-gray-100 hover:border-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10'
                >
                  <div className='flex items-center gap-4'>
                      <div
                        className={`w-16 h-16 ${getAvatarColor(
                          index
                        )} rounded-full flex items-center justify-center text-white text-xl font-bold`}
                      >
                        {getInitials(email)}
                      </div>

                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          {email.split("@")[0]}
                        </h3>
                        {isCreator && (
                          <div className='flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full border border-amber-500/50'>
                            <Crown className='w-3 h-3 text-amber-400' />
                            <span className='text-xs text-amber-400 font-medium'>
                              Creator
                            </span>
                          </div>
                        )}
                      </div>
                      <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <Mail className='w-4 h-4' />
                        <span className='truncate'>{email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='col-span-full text-center py-12'>
              <Users className='w-12 h-12 text-gray-300 mx-auto mb-3' />
              <p className='text-gray-500'>No members in this group yet</p>
            </div>
          )}
        </div>

        <div className='mt-6 text-center text-gray-400 text-sm'>
          Total Members: {group.memberEmails?.length || 0}
        </div>
      </div>
    </div>
  );
};

export default MembersComponent;
