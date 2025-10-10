// ==========================================
// AUTH CONTEXT
// ==========================================
// Verwaltet den eingeloggten User und seine Rechte global

import { createContext, useContext, useState, type ReactNode } from "react";
import type { User, Permissions } from "../types";
import { getPermissionsForRole } from "../utils/permissions";

// Interface: Was der AuthContext bereitstellt
interface AuthContextType {
  currentUser: User | null; // Der eingeloggte User (null = nicht eingeloggt)
  permissions: Permissions | null; // Die Rechte des Users
  login: (user: User) => void; // Funktion zum Einloggen
  logout: () => void; // Funktion zum Ausloggen
}

// Context erstellen (erstmal leer)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component: Umhüllt die ganze App
export function AuthProvider({ children }: { children: ReactNode }) {
  // State: Speichert den aktuellen User
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Berechne Permissions basierend auf der User-Rolle
  // Wenn kein User eingeloggt → permissions = null
  const permissions = currentUser
    ? getPermissionsForRole(currentUser.role)
    : null;

  // Login-Funktion: Setzt den User
  const login = (user: User) => {
    setCurrentUser(user);
  };

  // Logout-Funktion: Entfernt den User
  const logout = () => {
    setCurrentUser(null);
  };

  // Stelle alles zur Verfügung für alle Child-Components
  return (
    <AuthContext.Provider value={{ currentUser, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
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
