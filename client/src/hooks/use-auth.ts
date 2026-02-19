import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/shared/models/auth";
import { clearAuthToken } from "@/lib/api";

const AUTH_USER_KEY = "userId";

function getStoredUser(): User | null {
  const userId = localStorage.getItem(AUTH_USER_KEY);
  if (!userId) return null;
  return {
    id: userId,
    email: null,
    firstName: null,
    lastName: null,
    profileImageUrl: null,
    createdAt: null,
    updatedAt: null,
  };
}

function logout(): void {
  localStorage.removeItem(AUTH_USER_KEY);
  clearAuthToken();
  window.location.href = "/login";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isFetching } = useQuery<User | null>({
    queryKey: ["auth"],
    queryFn: getStoredUser,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth"], null);
    },
  });

  return {
    user,
    isLoading: isLoading || (isFetching && !user),
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
