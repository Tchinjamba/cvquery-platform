"use client";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [tab, setTab] = useState(tabParam === "login" ? "login" : "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (tab === "register" && !name.trim()) {
      setError("Por favor, insira o seu nome.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = tab === "login" ? "login" : "register";
      const payload = { email, password };
      if (tab === "register") payload.name = name;

      const res = await fetch(`${API}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      login(data.token, { email, name: data.user?.name || name });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo com link para a landing page */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 26,
                fontWeight: 700,
                color: "#1A1A1A",
                marginBottom: 6,
                cursor: "pointer",
              }}
            >
              CVQuery
            </div>
            <div style={{ fontSize: 13, color: "#4A4A4A" }}>
              Academic Platform
            </div>
          </Link>
        </div>

        {/* Card - com fundo #003D8F */}
        <div
          style={{
            background: "#003D8F",
            borderRadius: "16px",
            padding: 32,
            border: "1px solid #1E40AF",
          }}
        >
          {/* Tabs: Criar conta (esquerda) e Entrar (direita) */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255,255,255,0.2)",
              marginBottom: 24,
            }}
          >
            <button
              onClick={() => {
                setTab("register");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: 14,
                fontWeight: 600,
                background: "none",
                border: "none",
                borderBottom: `2px solid ${tab === "register" ? "#FFFFFF" : "transparent"
                  }`,
                color: tab === "register" ? "#FFFFFF" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Criar conta
            </button>
            <button
              onClick={() => {
                setTab("login");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: 14,
                fontWeight: 600,
                background: "none",
                border: "none",
                borderBottom: `2px solid ${tab === "login" ? "#FFFFFF" : "transparent"
                  }`,
                color: tab === "login" ? "#FFFFFF" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Entrar
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Campo NOME (aparece apenas no modo "register") */}
            {tab === "register" && (
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#FFFFFF",
                  }}
                >
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                  required={tab === "register"}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "rgba(255,255,255,0.9)",
                    color: "#1A1A1A",
                  }}
                />
              </div>
            )}

            {/* Campo EMAIL */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#FFFFFF",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "rgba(255,255,255,0.9)",
                  color: "#1A1A1A",
                }}
              />
            </div>

            {/* Campo PASSWORD */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#FFFFFF",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                placeholder="**********"
                required
                minLength={6}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "rgba(255,255,255,0.9)",
                  color: "#1A1A1A",
                }}
              />
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "10px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* Botão de submit: "Criar conta" ou "Entrar" */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#FFFFFF",
                color: "#003D8F",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#DBEAFE";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#FFFFFF";
              }}
            >
              {loading
                ? "A processar..."
                : tab === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>

          {/* ⭐ ALTERADO: "Não tens conta?" + botão "Criar conta" (apenas na aba "login") */}
          {tab === "login" && (
            <div
              style={{
                marginTop: "20px",
                textAlign: "center",
                fontSize: "14px",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Não tens conta?{" "}
              <button
                onClick={() => {
                  setTab("register");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  transition: "color 0.2s",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#DBEAFE")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              >
                Criar conta
              </button>
            </div>
          )}

          {/* ⭐ ALTERADO: "Já tens conta?" + botão "Login" (apenas na aba "register") */}
          {tab === "register" && (
            <div
              style={{
                marginTop: "20px",
                textAlign: "center",
                fontSize: "14px",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Já tens conta?{" "}
              <button
                onClick={() => {
                  setTab("login");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  transition: "color 0.2s",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#DBEAFE")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return <AuthProvider><LoginPage /></AuthProvider>;
}