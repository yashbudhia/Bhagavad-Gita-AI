import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useCookies } from "react-cookie";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cookies, setCookie, removeCookie] = useCookies(["Token"]);

  useEffect(() => {
    // Check if user is logged in on mount
    if (cookies.Token) {
      // Decode token to get user info (basic check)
      try {
        const payload = JSON.parse(atob(cookies.Token.split(".")[1]));
        setUser({ email: payload.email });
      } catch {
        removeCookie("Token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Login failed");
    }

    const { user, token } = await res.json();
    setCookie("Token", token, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    setUser(user);
  };

  const register = async (email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Registration failed");
    }

    const { user, token } = await res.json();
    setCookie("Token", token, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    setUser(user);
  };

  const logout = () => {
    removeCookie("Token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token: cookies.Token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
