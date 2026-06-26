"use client";
import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/AuthContext";
import JsonEditor from "@/components/JsonEditor";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FORMATS = ["text", "html", "latex", "markdown"];

const LANGUAGES = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ro", label: "Română" },
  { code: "ja", label: "日本語" },
];

export default function CVEditor({ params }) {
  const { id } = use(params);
  const { api } = useAuth();
  const router = useRouter();
  const [cv, setCv]           = useState(null);
  const [cvData, setCvData]   = useState({});
  const [template, setTpl]    = useState("Nome: $.name\nEmail: $.contact.email");
  const [format, setFormat]   = useState("text");
  const [output, setOutput]   = useState("");
  const [tab, setTab]         = useState("json");
  const [saving, setSaving]   = useState(false);
  const [processing, setProc] = useState(false);
  const [error, setError]     = useState("");
  const [saved, setSaved]     = useState(false);
  const [name, setName]       = useState("");
  const [language, setLanguage] = useState("pt");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (id) loadCV(); }, [id]);

  async function loadCV() {
    try {
      const res  = await api(`/api/cv/${id}`);
      const data = await res.json();
      setCv(data);
      setCvData(data.data || {});
      setName(data.name || "");
      // ⭐ Se o JSON tiver um nome diferente, atualizar o input
      if (data.data?.name && data.data.name !== data.name) {
        // Se o nome do JSON for diferente, usar o do JSON
        setName(data.data.name);
      }
      if (data.data?.language) {
        setLanguage(data.data.language);
      }
    } catch (e) { console.error(e); }
  }

  // ⭐ Função para atualizar o nome (chamada quando o input do topo muda)
  function handleNameChange(newName) {
    setName(newName);
    // Atualizar também no JSON
    setCvData(prev => ({ ...prev, name: newName }));
  }

  // ⭐ Função para atualizar o JSON (chamada quando o JsonEditor muda)
  function handleJsonChange(newData) {
    setCvData(newData);
    // Se o JSON tiver um campo "name", sincronizar com o input do topo
    if (newData.name !== undefined) {
      setName(newData.name);
    }
  }

  async function handleSave() {
    setSaving(true); setSaved(false);
    try {
      // ⭐ Garantir que o nome do JSON está sincronizado
      const dataToSave = { ...cvData, name: name, language };
      const res = await api(`/api/cv/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: name, data: dataToSave }),
      });
      if (!res.ok) throw new Error("Erro ao guardar");
      setSaved(true);
      setCv(prev => ({ ...prev, name: name }));
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleProcess() {
    setError(""); setOutput(""); setProc(true);
    try {
      const res  = await api("/api/cv/process", {
        method: "POST",
        body: JSON.stringify({ cvData, template, format, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutput(data.output);
    } catch (e) { setError(e.message); }
    finally { setProc(false); }
  }

  function handleAddDefaultFields() {
    const newData = { ...cvData };
    if (!newData.name) newData.name = name || "";
    if (!newData.contact) newData.contact = { email: "", phone: "", location: "" };
    if (!newData.education) newData.education = [];
    if (!newData.experience) newData.experience = [];
    if (!newData.skills) newData.skills = [];
    if (!newData.languages) newData.languages = [];
    if (!newData.certifications) newData.certifications = [];
    setCvData(newData);
  }

  function addSection(sectionType) {
    const newData = { ...cvData };
    switch(sectionType) {
      case 'education':
        if (!newData.education) newData.education = [];
        newData.education.push({ degree: "", institution: "", period: "", description: "" });
        break;
      case 'experience':
        if (!newData.experience) newData.experience = [];
        newData.experience.push({ title: "", company: "", period: "", location: "", description: "" });
        break;
      case 'skill':
        if (!newData.skills) newData.skills = [];
        newData.skills.push("");
        break;
      case 'language':
        if (!newData.languages) newData.languages = [];
        newData.languages.push({ name: "", level: "" });
        break;
      case 'certification':
        if (!newData.certifications) newData.certifications = [];
        newData.certifications.push({ title: "", institution: "", date: "" });
        break;
      default:
        const key = prompt("Nome do novo campo:");
        if (key) newData[key] = "";
    }
    setCvData(newData);
  }

  function handleClearAll() {
    if (confirm("Tem certeza que quer apagar todos os dados do CV?")) {
      setCvData({});
    }
  }

  function openDeleteModal() { setShowDeleteModal(true); }
  function closeDeleteModal() { setShowDeleteModal(false); }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/api/cv/${id}`, { method: "DELETE" });
      router.push("/dashboard");
    } catch (error) {
      console.error("Erro ao apagar:", error);
      setError("Erro ao apagar o CV");
      closeDeleteModal();
    } finally {
      setDeleting(false);
    }
  }

  if (!cv) return <div style={{ padding:32, color:"var(--text-2)" }}>A carregar...</div>;

  return (
    <>
      <div className="page-header" style={{ 
        background: "#003D8F", 
        borderBottom: "1px solid #1E40AF", 
        padding: "24px 32px 16px 32px" 
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
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
              <input 
                type="text" 
                value={name} 
                onChange={(e) => handleNameChange(e.target.value)}
                style={{ 
                  fontSize: "24px", 
                  fontWeight: 600, 
                  color: "#FFFFFF", 
                  marginBottom: 4,
                  background: "transparent",
                  border: "none",
                  borderBottom: "2px solid rgba(255,255,255,0.3)",
                  padding: "4px 0",
                  outline: "none",
                  fontFamily: "inherit",
                  width: "100%",
                  maxWidth: "500px",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#FFFFFF"}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
                placeholder="Nome do CV"
              />
              <p className="page-subtitle" style={{ 
                fontSize: "14px", 
                color: "rgba(255,255,255,0.8)",
                marginTop: "4px"
              }}>Editor de CV</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "13px",
                outline: "none",
                minWidth: "120px"
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} style={{ color: "#1A1A1A" }}>
                  {lang.label}
                </option>
              ))}
            </select>
            
            <button 
              onClick={openDeleteModal}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "13px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220,38,38,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              Apagar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{
              background: "#FFFFFF",
              color: "#003D8F",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontWeight: 500,
              cursor: "pointer"
            }}>
              {saving ? "A guardar..." : saved ? "✓ Guardado" : "Guardar dados"}
            </button>
          </div>
        </div>

        <div className="page-tabs" style={{ marginTop: "12px" }}>
          {["json","template","preview"].map(t => (
            <button 
              key={t} 
              className={`page-tab ${tab===t?"active":""}`} 
              onClick={() => setTab(t)}
              style={{
                background: "transparent",
                border: "none",
                padding: "8px 16px",
                color: tab === t ? "#FFFFFF" : "rgba(255,255,255,0.6)",
                borderBottom: tab === t ? "2px solid #FFFFFF" : "2px solid transparent",
                cursor: "pointer",
                fontWeight: tab === t ? 600 : 400,
                fontSize: "14px",
                transition: "all 0.15s"
              }}
            >
              {t==="json" ? "Dados JSON" : t==="template" ? "Template CVQuery" : "Pré-visualizar"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"24px 32px" }}>
        {error && <div className="alert alert-error" style={{ marginBottom:16, color: "#DC2626", padding: "12px", background: "#FEE2E2", borderRadius: "8px" }}>{error}</div>}

        {tab === "json" && (
          <div>
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap",
              gap: "8px", 
              marginBottom: "12px",
              padding: "12px",
              background: "#F5F5F5",
              borderRadius: "8px",
              border: "1px solid #E0E0E0"
            }}>
              <span style={{ 
                fontSize: "12px", 
                fontWeight: 600, 
                color: "#4A4A4A",
                display: "flex",
                alignItems: "center",
                marginRight: "8px"
              }}>
                📋 Ações:
              </span>
              <button 
                onClick={handleAddDefaultFields}
                style={{
                  padding: "4px 12px",
                  background: "#003D8F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                + Campos padrão
              </button>
              <button 
                onClick={() => addSection('education')}
                style={{
                  padding: "4px 12px",
                  background: "#DBEAFE",
                  color: "#003D8F",
                  border: "1px solid #003D8F",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                + Educação
              </button>
              <button 
                onClick={() => addSection('experience')}
                style={{
                  padding: "4px 12px",
                  background: "#DBEAFE",
                  color: "#003D8F",
                  border: "1px solid #003D8F",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                + Experiência
              </button>
              <button 
                onClick={() => addSection('skill')}
                style={{
                  padding: "4px 12px",
                  background: "#DBEAFE",
                  color: "#003D8F",
                  border: "1px solid #003D8F",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                + Competência
              </button>
              <button 
                onClick={() => addSection('language')}
                style={{
                  padding: "4px 12px",
                  background: "#DBEAFE",
                  color: "#003D8F",
                  border: "1px solid #003D8F",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                + Idioma
              </button>
              <button 
                onClick={() => addSection('certification')}
                style={{
                  padding: "4px 12px",
                  background: "#DBEAFE",
                  color: "#003D8F",
                  border: "1px solid #003D8F",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                + Certificação
              </button>
              <button 
                onClick={handleClearAll}
                style={{
                  padding: "4px 12px",
                  background: "#FEE2E2",
                  color: "#DC2626",
                  border: "1px solid #DC2626",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                Apagar todos
              </button>
            </div>
            
            <div className="card" style={{ overflow:"hidden", border: "1px solid #E0E0E0", borderRadius: "12px" }}>
              <JsonEditor 
                value={cvData} 
                onChange={handleJsonChange}
              />
            </div>
          </div>
        )}

        {tab === "template" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, height:"calc(100vh - 240px)" }}>
            <div className="card" style={{ display:"flex", flexDirection:"column", overflow:"hidden", border: "1px solid #E0E0E0", borderRadius: "12px" }}>
              <div style={{ padding:"10px 14px", borderBottom:"1px solid #E0E0E0", fontSize:11, color:"#4A4A4A", textTransform:"uppercase", letterSpacing:"0.08em", background:"#F5F5F5" }}>Template CVQuery</div>
              <textarea className="mono-editor" value={template} onChange={e => setTpl(e.target.value)}
                style={{ flex:1, border:"none", borderRadius:0, resize:"none", padding: "16px", fontFamily: "monospace", fontSize: "13px", outline: "none" }} placeholder="Escreve o template..." />
              <div style={{ padding:"10px 14px", borderTop:"1px solid #E0E0E0", display:"flex", alignItems:"center", gap:8, background:"#F5F5F5", flexWrap:"wrap" }}>
                {FORMATS.map(f => (
                  <button key={f} onClick={() => setFormat(f)} className="btn btn-sm"
                    style={{ 
                      border: `1px solid ${format === f ? "#003D8F" : "#E0E0E0"}`,
                      color: format === f ? "#003D8F" : "#4A4A4A",
                      background: format === f ? "#DBEAFE" : "transparent",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}>
                    {f}
                  </button>
                ))}
                <button className="btn btn-primary btn-sm" style={{ marginLeft:"auto", background:"#003D8F", color:"#FFFFFF", border:"none", borderRadius:"6px", padding:"6px 16px", cursor:"pointer", fontSize:"12px" }} onClick={handleProcess} disabled={processing}>
                  {processing ? "A processar..." : "▶ Processar"}
                </button>
              </div>
            </div>
            <div className="card" style={{ display:"flex", flexDirection:"column", overflow:"hidden", border: "1px solid #E0E0E0", borderRadius: "12px" }}>
              <div style={{ padding:"10px 14px", borderBottom:"1px solid #E0E0E0", fontSize:11, color:"#4A4A4A", textTransform:"uppercase", letterSpacing:"0.08em", background:"#F5F5F5" }}>Output — {format}</div>
              {format==="html" && output
                ? <div style={{ flex:1, padding:16, overflow:"auto" }} dangerouslySetInnerHTML={{ __html: output }} />
                : <pre style={{ flex:1, padding:16, fontFamily:"monospace", fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap", overflow:"auto", color:output?"#1A1A1A":"#9CA3AF" }}>
                    {output || "O resultado aparece aqui..."}
                  </pre>
              }
            </div>
          </div>
        )}

        {tab === "preview" && (
          <div className="card" style={{ padding:32, maxWidth:700, border: "1px solid #E0E0E0", borderRadius: "12px", background: "#FFFFFF" }}>
            <h2 style={{ fontFamily:"'Times New Roman', Times, serif", fontSize:20, fontWeight:600, marginBottom:8, color: "#1A1A1A" }}>{cvData.name || name || "—"}</h2>
            {cvData.contact?.email && <p style={{ color:"#4A4A4A", marginBottom:16 }}>{cvData.contact.email}</p>}
            <hr className="divider" style={{ border: "none", borderTop: "1px solid #E0E0E0", margin: "16px 0" }} />
            <pre style={{ fontFamily:"'Times New Roman', Times, serif", fontSize:13, color:"#4A4A4A", whiteSpace:"pre-wrap" }}>
              {JSON.stringify(cvData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}
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
                <strong>“{cv?.name}”</strong>
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