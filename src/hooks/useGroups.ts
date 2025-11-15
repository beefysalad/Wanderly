import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Group } from "@/src/shared/types";

interface GroupsResponse {
  groups: Group[];
}

interface GroupResponse {
  group: Group;
}

interface CreateGroupRequest {
  name: string;
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

