"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovaSecao() {
    const { api } = useAuth();
    const router = useRouter();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api("/api/cv", {
                method: "POST",
                body: JSON.stringify({ name, data: {} })
            });
            const data = await res.json();
            // ⭐ Redirecionar para a página de edição do CV
            router.push(`/cv/${data._id}`);
        } catch (error) {
            console.error("Erro ao criar:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header" style={{ 
                background: "#003D8F", 
                borderBottom: "1px solid #1E40AF", 
                padding: "24px 32px 16px 32px" 
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Link 
                        href="/dashboard" 
                        style={{
                            color: "#FFFFFF",
                            fontSize: "24px",
                            fontWeight: 300,
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            opacity: 0.8,
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "0.8"}
                    >
                        ‹
                    </Link>
                    <div>
                        <h1 className="page-title" style={{ 
                            fontSize: "24px", 
                            fontWeight: 600, 
                            color: "#FFFFFF", 
                            marginBottom: 4 
                        }}>Nova Secção</h1>
                        <p className="page-subtitle" style={{ 
                            fontSize: "14px", 
                            color: "rgba(255,255,255,0.8)" 
                        }}>Criar uma nova secção no seu CV</p>
                    </div>
                </div>
            </div>

            <div style={{ padding: "24px 32px", maxWidth: 600 }}>
                <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 24
                }}>
                    <p style={{ color: "#166534" }}>💡 <strong>Dica:</strong> As secções ajudam a organizar o seu CV. Pode criar secções como: Experiência, Educação, Publicações, Competências, etc.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 24, background: "#FFFFFF" }}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#1A1A1A" }}>Nome da Secção / CV</label>
                        <input
                            type="text"
                            placeholder="Ex: Currículo João Silva"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: "100%", padding: 10, border: "1px solid #D1D5DB", borderRadius: 8, background: "#FFFFFF", color: "#1A1A1A" }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "#1A1A1A" }}>Tipo de Secção</label>
                        <select style={{ width: "100%", padding: 10, border: "1px solid #D1D5DB", borderRadius: 8, background: "#FFFFFF", color: "#1A1A1A" }}>
                            <option>Informação Pessoal</option>
                            <option>Experiência Profissional</option>
                            <option>Formação Académica</option>
                            <option>Publicações</option>
                            <option>Competências</option>
                            <option>Idiomas</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "10px 20px",
                            background: "#003D8F",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            width: "100%",
                            fontWeight: 500
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#002B6B"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#003D8F"}
                    >
                        {loading ? "A criar..." : "➕ Criar Nova Secção"}
                    </button>
                </form>
            </div>
        </>
    );
}