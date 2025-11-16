import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Group } from "@/src/shared/types";
import { getGuestSession } from "@/lib/guest-session";

interface GroupsResponse {
  groups: Group[];
}

interface GroupResponse {
  group: Group;
}

interface CreateGroupRequest {
  name: string;
  colorScheme?: string;
  emoji?: string | null;
}

interface UpdateGroupRequest {
  groupId: string;
  name?: string;
  colorScheme?: string;
  emoji?: string | null;
}

interface JoinGroupRequest {
  groupCode: string;
}

/**
 * Query hook to fetch all groups the user is a member of
 */
export function useGroups() {
  return useQuery<GroupsResponse>({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await api.get<GroupsResponse>("/groups");
      return response.data;
    },
  });
}

/**
 * Query hook to fetch a single group by ID
 */
export function useGroup(groupId: string | null) {
  return useQuery<GroupResponse>({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const response = await api.get<GroupResponse>(`/groups/${groupId}`);
      return response.data;
    },
    enabled: !!groupId,
  });
}

/**
 * Query hook to fetch a group as a guest (with polling for real-time updates)
 */
export function useGroupAsGuest(groupId: string | null) {
  const guestSession = getGuestSession();

  return useQuery<Group>({
    queryKey: ["groups", groupId, "guest"],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const response = await api.get<Group>(`/groups/${groupId}/guest`);
      return response.data;
    },
    enabled: !!groupId && !!guestSession,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}

/**
 * Mutation hook to create a new group
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation<GroupResponse, Error, CreateGroupRequest>({
    mutationFn: async (data) => {
      const response = await api.post<GroupResponse>("/groups", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/**
 * Mutation hook to join a group by code
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation<GroupResponse, Error, JoinGroupRequest>({
    mutationFn: async (data) => {
      const response = await api.post<GroupResponse>("/groups/join", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/**
 * Mutation hook to leave a group
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (groupId) => {
      await api.post(`/groups/${groupId}/leave`);
    },
    onSuccess: (_, groupId) => {
      // Invalidate groups list and specific group
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to delete a group (creator only)
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (groupId) => {
      await api.delete(`/groups/${groupId}`);
    },
    onSuccess: (_, groupId) => {
      // Invalidate groups list and remove specific group from cache
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.removeQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to update a group (creator/admin only)
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation<GroupResponse, Error, UpdateGroupRequest>({
    mutationFn: async (data) => {
      const { groupId, ...updates } = data;
      const response = await api.patch<GroupResponse>(`/groups/${groupId}`, updates);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate groups list and specific group
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", variables.groupId] });
    },
  });
}
