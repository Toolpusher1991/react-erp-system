// ==========================================
// ENHANCED AUTH CONTEXT - JWT INTEGRATION
// ==========================================
// Verwaltet Authentication mit JWT Backend Integration

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  authService,
  type User,
  type LoginCredentials,
  type RegisterData,
  type LoginResult,
} from "../services/auth";
import type { Permissions, UserRole } from "../types";
import { getPermissionsForRole } from "../utils/permissions";

// Enhanced Interface mit JWT Backend Integration
interface AuthContextType {
  // Existing LocalStorage Auth
  currentUser: User | null;
  permissions: Permissions | null;
  login: (user: User) => void;
  logout: () => void;

  // New JWT Backend Auth
  isLoading: boolean;
  error: string | null;
  loginWithBackend: (email: string, password: string) => Promise<boolean>;
  registerWithBackend: (
    email: string,
    password: string,
    name: string
  ) => Promise<boolean>;
  clearError: () => void;
}

// Context erstellen (erstmal leer)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enhanced Provider with JWT Backend Integration
export function AuthProvider({ children }: { children: ReactNode }) {
  // Local State für JWT Integration
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map backend roles to frontend roles
  const mapBackendRole = (backendRole: string): UserRole => {
    const roleMapping: Record<string, UserRole> = {
      ADMIN: "Admin",
      E_SUPERVISOR: "E-Supervisor",
      M_SUPERVISOR: "M-Supervisor",
      MECHANIKER: "Mechaniker",
      ELEKTRIKER: "Elektriker",
      RSC: "RSC",
    };
    return roleMapping[backendRole] || "Mechaniker";
  };

  // Permissions basierend auf User-Rolle
  const permissions = currentUser
    ? getPermissionsForRole(mapBackendRole(currentUser.role))
    : null;

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = () => {
      const user = authService.getUser();
      if (user && authService.isAuthenticated()) {
        setCurrentUser(user);
      }
    };
    initAuth();
  }, []);

  // Legacy login for localStorage compatibility - cast to backend User type
  const login = (user: any) => {
    const backendUser: User = {
      ...user,
      createdAt: user.createdAt || new Date().toISOString(),
    };
    setCurrentUser(backendUser);
  };

  // JWT Backend Login
  const loginWithBackend = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    console.log("🎯 AuthContext.loginWithBackend called:", { email });
    try {
      setIsLoading(true);
      setError(null);

      console.log("🌐 Calling authService.login...");
      const result = await authService.login({ email, password });
      console.log("📡 AuthService result:", {
        success: result.success,
        error: result.error,
      });

      if (result.success && result.data) {
        console.log("✅ Login successful, setting user:", result.data.user);
        // Map JWT user to frontend user format
        const mappedUser = {
          ...result.data.user,
          assignedAssets: result.data.user.assignedAssets || [],
        };
        setCurrentUser(mappedUser);
        return true;
      } else {
        console.log("❌ Login failed:", result.error);
        setError(result.error || "Login failed");
        return false;
      }
    } catch (err) {
      console.error("🔥 Login exception:", err);
      setError(err instanceof Error ? err.message : "Login failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // JWT Backend Registration
  const registerWithBackend = async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.register({ email, password, name });

      if (result.success && result.data) {
        setCurrentUser(result.data.user);
        return true;
      } else {
        setError(result.error || "Registration failed");
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced Logout
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setError(null);
  };

  // Clear Error
  const clearError = () => {
    setError(null);
  };

  // Context Value
  const contextValue: AuthContextType = {
    currentUser,
    permissions,
    login,
    logout,
    isLoading,
    error,
    loginWithBackend,
    registerWithBackend,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom Hook: Einfacher Zugriff auf den Context
// Verwendung: const { currentUser, permissions } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext);

  // Fehlerbehandlung: Falls AuthProvider fehlt
  if (context === undefined) {
    throw new Error(
      "useAuth muss innerhalb von AuthProvider verwendet werden!"
    );
  }

  return context;
}
