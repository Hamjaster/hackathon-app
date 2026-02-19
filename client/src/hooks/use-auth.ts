import type { User } from "@/shared/models/auth";
import { clearAuthToken } from "@/lib/api";

const AUTH_USER_KEY = "userId";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
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

/** Auth from JWT (authToken) + userId in localStorage. No React Query. */
export function useAuth() {
  const user = getStoredUser();
  return {
    user,
    isAuthenticated: !!user,
    logout,
  };
}
