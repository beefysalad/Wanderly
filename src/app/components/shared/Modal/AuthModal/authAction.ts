import api from "@/lib/axios";

export const syncUser = async () => {
  const response = await api.post("/sync", {});
  return response.data.user;
};
