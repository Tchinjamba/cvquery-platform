"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("cvquery_token");
    const u = localStorage.getItem("cvquery_user");
    if (t) { setToken(t); setUser(JSON.parse(u || "{}")); }
    setReady(true);
  }, []);

  function login(token, user) {
    localStorage.setItem("cvquery_token", token);
    localStorage.setItem("cvquery_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
    router.push("/dashboard");
  }

  function logout() {
    localStorage.removeItem("cvquery_token");
    localStorage.removeItem("cvquery_user");
    setToken(null);
    setUser(null);
    router.push("/");
  }

  const api = (path, opts = {}) => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    return fetch(`${base}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, api, ready }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}