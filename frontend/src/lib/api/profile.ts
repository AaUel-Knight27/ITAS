import api from "@/lib/api";

export type UserProfile = {
  id: number | string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>("/auth/profile");
  return response.data;
}
