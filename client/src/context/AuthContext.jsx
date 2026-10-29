import { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient.js";

const AuthContext = createContext(null);

// Authentication Context
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      const data = await apiClient("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function loadSessionUser() { loadUser(); }, []);
  const value = { user, loading, setUser, refreshUser: loadUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
