import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

interface UpdateProfileRequest {
  name?: string;
  photoURL?: string;
}

interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ProfileResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
  };
}

/**
 * Mutation hook to update user profile (name and photo)
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<ProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: async (data) => {
      const response = await api.patch<ProfileResponse>("/profile", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user-related queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      // Also invalidate groups since user name might be displayed there
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/**
 * Mutation hook to update user password
 */
export function useUpdatePassword() {
  return useMutation<void, Error, UpdatePasswordRequest>({
    mutationFn: async (data) => {
      await api.patch("/profile/password", data);
    },
  });
}

