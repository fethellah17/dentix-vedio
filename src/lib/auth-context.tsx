import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi } from "./api";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "softix-session-token";
const USER_EMAIL_KEY = "softix-user-email";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state on mount - check SessionStorage only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionToken = sessionStorage.getItem(SESSION_KEY);
      const storedEmail = sessionStorage.getItem(USER_EMAIL_KEY);
      setIsAuthenticated(sessionToken === "authenticated");
      setUserEmail(storedEmail);
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUserEmail(email);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_KEY, "authenticated");
          sessionStorage.setItem(USER_EMAIL_KEY, email);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(USER_EMAIL_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
