"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";

function AppShell({ children }) {
  const { token, user, logout, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !token) router.push("/");
  }, [ready, token]);

  if (!ready || !token) return null;

  return (
    <div className="layout">
      <Sidebar user={user} onLogout={logout} />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}