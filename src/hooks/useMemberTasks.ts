import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { MemberTask } from "@/src/shared/types";

interface MemberTasksResponse {
  tasks: MemberTask[];
}

interface MemberTaskResponse {
  task: MemberTask;
}

interface CreateMemberTaskRequest {
  assignedToId: string;
  title: string;
  notes?: string;
  dueDate?: string;
  status?: "not_started" | "in_progress" | "done";
}

interface UpdateMemberTaskRequest {
  taskId: string;
  assignedToId?: string;
  title?: string;
  notes?: string;
  dueDate?: string | null;
  status?: "not_started" | "in_progress" | "done";
}

export function useMemberTasks(groupId: string | null) {
  return useQuery<MemberTasksResponse>({
    queryKey: ["member-tasks", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const response = await api.get<MemberTasksResponse>(
        `/groups/${groupId}/member-tasks`,
      );
      return response.data;
    },
    enabled: !!groupId,
  });
}

export function useCreateMemberTask(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<MemberTaskResponse, Error, CreateMemberTaskRequest>({
    mutationFn: async (data) => {
      const response = await api.post<MemberTaskResponse>(
        `/groups/${groupId}/member-tasks`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-tasks", groupId] });
    },
  });
}

export function useUpdateMemberTask(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<MemberTaskResponse, Error, UpdateMemberTaskRequest>({
    mutationFn: async ({ taskId, ...updates }) => {
      const response = await api.patch<MemberTaskResponse>(
        `/groups/${groupId}/member-tasks/${taskId}`,
        updates,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-tasks", groupId] });
    },
  });
}

export function useDeleteMemberTask(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (taskId) => {
      await api.delete(`/groups/${groupId}/member-tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-tasks", groupId] });
    },
  });
}
