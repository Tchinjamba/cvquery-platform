"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import Link from "next/link";

export default function Dashboard() {
  const { api, user } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  // ⭐ Estados do modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cvToDelete, setCvToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadCVs(); }, []);

  async function loadCVs() {
    setLoading(true);
    try {
      const res = await api("/api/cv");
      const data = await res.json();
      setCvs(Array.isArray(data) ? data : []);
    } catch { setCvs([]); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true); setError("");
    try {
      const res = await api("/api/cv", { method: "POST", body: JSON.stringify({ name: newName, data: { name: newName, contact: {}, education: [], skills: [] } }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowNew(false); setNewName("");
      loadCVs();
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  }

  // ⭐ Função para abrir o modal
  function openDeleteModal(cv) {
    setCvToDelete(cv);
    setShowDeleteModal(true);
  }

  // ⭐ Função para fechar o modal
  function closeDeleteModal() {
    setShowDeleteModal(false);
    setCvToDelete(null);
  }

  // ⭐ Função para confirmar a eliminação
  async function confirmDelete() {
    if (!cvToDelete) return;
    setDeleting(true);
    try {
      await api(`/api/cv/${cvToDelete._id}`, { method: "DELETE" });
      loadCVs();
      closeDeleteModal();
    } catch (error) {
      console.error("Erro ao apagar:", error);
      setError("Erro ao apagar o CV");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-header" style={{
        background: "#003D8F",
        borderBottom: "1px solid #1E40AF",
        padding: "24px 32px 16px 32px"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title" style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#FFFFFF",
              marginBottom: 4
            }}>Os meus CVs</h1>
            <p className="page-subtitle" style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.8)"
            }}>Gerir e editar os teus currículos académicos</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowNew(true)}
            style={{
              background: "#FFFFFF",
              color: "#003D8F",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            + Novo CV
          </button>
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>
        {showNew && (
          <div className="card" style={{ padding: 20, marginBottom: 24, maxWidth: 440, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#1A1A1A" }}>Novo CV</div>
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: CV Académico 2024" autoFocus required style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", background: "#FFFFFF", color: "#1A1A1A" }} />
              </div>
              {error && <div className="alert alert-error" style={{ marginBottom: 12, color: "#DC2626", fontSize: "13px" }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creating} style={{ background: "#2563EB", color: "#FFFFFF", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: 500, cursor: "pointer", fontSize: "12px" }}>{creating ? "A criar..." : "Criar"}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowNew(false); setError(""); }} style={{ background: "transparent", color: "#4A4A4A", border: "1px solid #E0E0E0", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#4A4A4A", padding: "40px 0" }}>
            <span className="spinner"></span> A carregar...
          </div>
        ) : cvs.length === 0 ? (
          <div className="empty-state" style={{ textAlign: "center", padding: "64px 0" }}>
            <div className="empty-icon" style={{ fontSize: "48px", color: "#E0E0E0", marginBottom: "16px" }}>📄</div>
            <div className="empty-title" style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A", marginBottom: "8px" }}>Nenhum CV ainda</div>
            <div className="empty-text" style={{ fontSize: "14px", color: "#4A4A4A", marginBottom: "24px" }}>Cria o teu primeiro CV académico para começar.</div>
            <button className="btn btn-primary" onClick={() => setShowNew(true)} style={{ background: "#2563EB", color: "#FFFFFF", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}>+ Criar CV</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {cvs.map(cv => (
              <div key={cv._id} className="card card-hover" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, border: "1px solid #E0E0E0", borderRadius: 12, background: "#FFFFFF" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 4 }}>{cv.name}</div>
                    <div style={{ fontSize: 12, color: "#4A4A4A" }}>
                      {new Date(cv.updatedAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <span className="badge badge-blue" style={{ background: "#DBEAFE", color: "#1E40AF", padding: "4px 8px", borderRadius: "4px", fontSize: "11px" }}>CV</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <Link href={`/cv/${cv._id}`} className="btn btn-primary btn-sm" style={{ background: "#2563EB", color: "#FFFFFF", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "12px", border: "none", cursor: "pointer" }}>Editar</Link>
                  <Link href="/export" className="btn btn-secondary btn-sm" style={{ background: "transparent", color: "#2563EB", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "12px", border: "1px solid #2563EB", cursor: "pointer" }}>Exportar</Link>
                  {/* ⭐ BOTÃO × ABRE O MODAL */}
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ marginLeft: "auto", background: "#FEE2E2", color: "#DC2626", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
                    onClick={() => openDeleteModal(cv)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ⭐ MODAL DE CONFIRMAÇÃO */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
          onClick={closeDeleteModal}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "440px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              animation: "fadeIn 0.25s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto"
              }}>
                <span style={{ fontSize: "28px", color: "#DC2626" }}>⚠️</span>
              </div>
              <h2 style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#1A1A1A",
                marginBottom: "8px"
              }}>
                Tem certeza que quer apagar o CV?
              </h2>
              <p style={{
                fontSize: "14px",
                color: "#DC2626",
                lineHeight: 1.5,
                fontWeight: 500
              }}>
                Todos os dados serão perdidos.
              </p>
              <p style={{
                fontSize: "13px",
                color: "#4A4A4A",
                marginTop: "8px"
              }}>
                <strong>“{cvToDelete?.name}”</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={closeDeleteModal}
                style={{
                  padding: "10px 24px",
                  background: "transparent",
                  color: "#4A4A4A",
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  flex: 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#F5F5F5"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  padding: "10px 24px",
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  opacity: deleting ? 0.7 : 1,
                  transition: "all 0.2s",
                  flex: 1
                }}
                onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "#B91C1C" }}
                onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = "#DC2626" }}
              >
                {deleting ? "A apagar..." : "Sim, apagar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}