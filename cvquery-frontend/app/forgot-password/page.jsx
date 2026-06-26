// app/forgot-password/page.jsx
"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Email de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Recuperar Password</h1>
        <p style={styles.subtitle}>Enviaremos um link para redefinir sua password</p>
        
        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          <button type="submit" disabled={loading} style={styles.button}>{loading ? "A enviar..." : "Enviar email"}</button>
        </form>
        
        <Link href="/login" style={styles.link}>Voltar para o login</Link>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f0e8" },
  card: { background: "white", padding: 40, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  title: { fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: "center" },
  subtitle: { color: "#666", marginBottom: 24, textAlign: "center" },
  input: { width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 16 },
  button: { width: "100%", padding: 12, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, cursor: "pointer" },
  success: { background: "#d1fae5", color: "#065f46", padding: 12, borderRadius: 8, marginBottom: 16 },
  error: { background: "#fee2e2", color: "#dc2626", padding: 12, borderRadius: 8, marginBottom: 16 },
  link: { display: "block", textAlign: "center", marginTop: 16, color: "#3b82f6", textDecoration: "none" }
};