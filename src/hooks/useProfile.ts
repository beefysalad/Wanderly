import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

interface UpdateProfileRequest {
  name?: string;
  photoURL?: string;
  bio?: string;
  travelStyle?: string;
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
    bio?: string;
    travelStyle?: string;
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
      queryClient.invalidateQueries({ queryKey: ["current-user-db"] });
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

/**
 * Query hook to fetch the current user's database record
 */
export function useCurrentUserDB() {
  return useQuery({
    queryKey: ["current-user-db"],
    queryFn: async () => {
      const response = await api.get("/profile");
      return response.data.user;
    },
  });
}
