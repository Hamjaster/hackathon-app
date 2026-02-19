import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { apiUrl, getAuthToken, getAuthHeaders } from "@/lib/api";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import FeedPage from "@/pages/FeedPage";
import RumorDetailPage from "@/pages/RumorDetailPage";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";

const USER_ID_KEY = "userId";

/** Verifies auth token on load and logs out if token is missing or invalid. */
function AuthTokenChecker({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      if (localStorage.getItem(USER_ID_KEY)) {
        logout();
      }
      return;
    }

    fetch(apiUrl("/api/auth/status"), { headers: getAuthHeaders() })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.authenticated !== true) {
          logout();
        }
      })
      .catch(() => {
        // Network error: don't logout so user stays logged in when offline
      });
  }, [logout]);

  return <>{children}</>;
}

function AuthGuard() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthTokenChecker>
            <Routes>
              {/* Public routes */}
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route element={<AuthGuard />}>
                <Route path="/" element={<FeedPage />} />
                <Route path="/rumor/:id" element={<RumorDetailPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthTokenChecker>
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
