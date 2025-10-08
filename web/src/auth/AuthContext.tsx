import { createContext, useContext, useEffect, useState } from "react";

type User = { name: string } | null;

type AuthContextType = {
  user: User;
  login: (name: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  // Persist simple session in localStorage for dev
  useEffect(() => {
    const raw = localStorage.getItem("demo_user");
    if (raw) setUser(JSON.parse(raw));
  }, []);
  useEffect(() => {
    if (user) localStorage.setItem("demo_user", JSON.stringify(user));
    else localStorage.removeItem("demo_user");
  }, [user]);

  const login = (name: string) => setUser({ name });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
