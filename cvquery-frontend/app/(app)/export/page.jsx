"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ExportPage() {
  const { api } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [cvData, setCvData] = useState({});
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null); // current export format
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [processedOutput, setProcessedOutput] = useState("");
  const [outputFormat, setOutputFormat] = useState("text");
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [cvsRes, templatesRes] = await Promise.all([
        api("/api/cv"),
        api("/api/templates"),
      ]);
      const cvsData      = await cvsRes.json();
      const templatesData = await templatesRes.json();
      setCvs(Array.isArray(cvsData) ? cvsData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      if (cvsData.length > 0) {
        setSelectedCV(cvsData[0]);
        setCvData(cvsData[0].data || {});
        setJsonText(JSON.stringify(cvsData[0].data || {}, null, 2));
      }
      if (templatesData.length > 0) setSelectedTemplate(templatesData[0]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectCV = (cv) => {
    setSelectedCV(cv);
    setCvData(cv.data || {});
    setJsonText(JSON.stringify(cv.data || {}, null, 2));
    setError("");
    setProcessedOutput("");
    setShowOutput(false);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setProcessedOutput("");
    setShowOutput(false);
  };

  const handleJsonChange = (e) => {
    const text = e.target.value;
    setJsonText(text);
    try {
      setCvData(JSON.parse(text));
      setError("");
      setProcessedOutput("");
      setShowOutput(false);
    } catch (err) {
      setError("JSON inválido: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!selectedCV) return;
    setSaving(true);
    setError("");
    try {
      const res = await api(`/api/cv/${selectedCV._id}`, {
        method: "PUT",
        body: JSON.stringify({ data: cvData }),
      });
      if (!res.ok) throw new Error("Erro ao guardar");
      alert("CV guardado com sucesso!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedTemplate) { setError("Selecione um template"); return; }
    if (!selectedCV)       { setError("Selecione um CV"); return; }
    try {
      const res = await api("/api/cv/process", {
        method: "POST",
        body: JSON.stringify({
          templateId: selectedTemplate._id,
          cvId:       selectedCV._id,
          format:     outputFormat,
        }),
      });
      if (!res.ok) throw new Error("Erro ao processar template");
      const json = await res.json();
      setProcessedOutput(json.output);
      setShowOutput(true);
      setError("");
    } catch (err) {
      setError("Erro ao processar template: " + err.message);
    }
  };

  // Download a blob response from the backend
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download a text string
  const downloadText = (content, filename, mime) => {
    downloadBlob(new Blob([content], { type: mime }), filename);
  };

  // All format exports (html, pdf, docx, latex) go through the backend export API.
  // The backend processes the template, builds styled HTML, then converts as needed.
  const exportFormat = async (format) => {
    if (!selectedTemplate) { setError("Selecione um template"); return; }
    if (!selectedCV)       { setError("Selecione um CV"); return; }

    setExporting(format);
    setError("");
    try {
      const res = await api(`/api/export/${format}`, {
        method: "POST",
        body: JSON.stringify({ cvId: selectedCV._id, templateId: selectedTemplate._id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Erro ao exportar ${format.toUpperCase()}`);
      }
      const blob = await res.blob();
      const ext  = format === "latex" ? "tex" : format;
      downloadBlob(blob, `${selectedCV.name || "cv"}.${ext}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(null);
    }
  };

  const exportJSON = () => {
    downloadText(
      JSON.stringify(cvData, null, 2),
      `${selectedCV?.name || "cv"}.json`,
      "application/json"
    );
  };

  if (loading) return <div style={{ padding: 32, textAlign: "center" }}>A carregar...</div>;

  return (
    <>
      <div style={{
        background: "#003D8F",
        borderBottom: "1px solid #1E40AF",
        padding: "24px 32px 16px 32px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>Exportar CV</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>CVQuery Pipeline — HTML → PDF / DOCX / LaTeX</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={btnStyle("#FFFFFF", "#003D8F")}>
            {saving ? "A guardar..." : "💾 Guardar alterações"}
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {error && (
          <div style={{ marginBottom: 16, padding: 12, background: "#fee2e2", color: "#dc2626", borderRadius: 8 }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 1fr", gap: 24 }}>

          {/* ── CV list ── */}
          <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#F5F5F5", borderBottom: "1px solid #E0E0E0", fontWeight: 600 }}>
              Meus CVs
            </div>
            <div style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
              {cvs.map(cv => (
                <button
                  key={cv._id}
                  onClick={() => handleSelectCV(cv)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "12px 16px", border: "none",
                    background: selectedCV?._id === cv._id ? "#DBEAFE" : "transparent",
                    cursor: "pointer", borderBottom: "1px solid #F0F0F0",
                  }}
                >
                  <div style={{ fontWeight: selectedCV?._id === cv._id ? 600 : 400 }}>{cv.name}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{new Date(cv.updatedAt).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── JSON editor + template selector ── */}
          <div>
            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 8, color: "#1A1A1A" }}>📝 Dados do CV (JSON)</h3>
              <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Dados injectados no template</p>
              <textarea
                value={jsonText}
                onChange={handleJsonChange}
                rows={10}
                style={{ width: "100%", fontFamily: "monospace", fontSize: 12, padding: 12, border: "1px solid #E0E0E0", borderRadius: 8 }}
              />
            </div>

            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ marginBottom: 12, color: "#1A1A1A" }}>📋 Template CVQuery</h3>
              <select
                value={selectedTemplate?._id || ""}
                onChange={(e) => handleSelectTemplate(templates.find(t => t._id === e.target.value))}
                style={{ width: "100%", padding: 10, border: "1px solid #E0E0E0", borderRadius: 6, marginBottom: 12 }}
              >
                {templates.length === 0 && <option value="">Nenhum template disponível</option>}
                {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>

              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid #E0E0E0", borderRadius: 6 }}
                >
                  <option value="text">📝 Texto</option>
                  <option value="html">🌐 HTML</option>
                  <option value="markdown">📊 Markdown</option>
                </select>
                <button
                  onClick={handleProcess}
                  style={{ padding: "8px 20px", background: "#003D8F", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
                >
                  ⚡ Processar
                </button>
              </div>

              {selectedTemplate && (
                <div style={{ padding: 10, background: "#F5F5F5", borderRadius: 6, fontSize: 12, marginTop: 12 }}>
                  <strong>Template:</strong> {selectedTemplate.name}
                </div>
              )}

              {showOutput && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>📄 Output processado:</div>
                  <div style={{
                    background: "#F5F5F5", borderRadius: 6, padding: 12,
                    maxHeight: 300, overflow: "auto",
                    fontFamily: outputFormat === "html" ? "inherit" : "monospace",
                    fontSize: outputFormat === "html" ? "inherit" : 11,
                    whiteSpace: outputFormat === "html" ? "normal" : "pre-wrap",
                  }}>
                    {outputFormat === "html"
                      ? <div dangerouslySetInnerHTML={{ __html: processedOutput }} />
                      : processedOutput || "Clique em 'Processar' para ver o resultado..."}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Export buttons + CV summary ── */}
          <div>
            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, color: "#1A1A1A" }}>📤 Exportar</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <ExportBtn label="🌐 HTML"   format="html"  exporting={exporting} onClick={() => exportFormat("html")} />
                <ExportBtn label="📑 PDF"    format="pdf"   exporting={exporting} onClick={() => exportFormat("pdf")} />
                <ExportBtn label="📄 DOCX"   format="docx"  exporting={exporting} onClick={() => exportFormat("docx")} />
                <ExportBtn label="🔬 LaTeX"  format="latex" exporting={exporting} onClick={() => exportFormat("latex")} />
                <button
                  onClick={exportJSON}
                  style={{ ...exportBtnStyle("#4A4A4A"), gridColumn: "span 2" }}
                >
                  🔧 JSON (dados brutos)
                </button>
              </div>
              {!selectedTemplate && (
                <p style={{ marginTop: 12, fontSize: 12, color: "#999", textAlign: "center" }}>
                  ⚠️ Selecione um template para exportar
                </p>
              )}
            </div>

            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ marginBottom: 12, color: "#1A1A1A" }}>👤 Resumo do CV</h3>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "#4A4A4A" }}>
                <p><strong>Nome:</strong> {cvData?.name || "—"}</p>
                <p><strong>Email:</strong> {cvData?.contact?.email || "—"}</p>
                <p><strong>Experiências:</strong> {cvData?.experience?.length || 0}</p>
                <p><strong>Educação:</strong> {cvData?.education?.length || 0}</p>
                <p><strong>Competências:</strong> {cvData?.skills?.length || 0}</p>
                {cvData?.languages?.length > 0 && (
                  <p><strong>Idiomas:</strong> {cvData.languages.length}</p>
                )}
                {cvData?.certifications?.length > 0 && (
                  <p><strong>Certificações:</strong> {cvData.certifications.length}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, padding: 16, background: "#F5F5F5", borderRadius: 8, fontSize: 13, color: "#666" }}>
          <h4 style={{ color: "#1A1A1A", marginBottom: 4 }}>⚡ CVQuery Pipeline</h4>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            O template é processado pelo backend (CVQuery processor) e o HTML resultante é usado como fonte única para PDF (Puppeteer), DOCX (html-to-docx) e LaTeX.
          </p>
        </div>
      </div>
    </>
  );
}

function ExportBtn({ label, format, exporting, onClick }) {
  const isLoading = exporting === format;
  return (
    <button
      onClick={onClick}
      disabled={!!exporting}
      style={exportBtnStyle("#003D8F", !!exporting)}
    >
      {isLoading ? "A exportar..." : label}
    </button>
  );
}

const exportBtnStyle = (bg, disabled = false) => ({
  padding: "10px 14px",
  background: disabled ? "#ccc" : bg,
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 13,
  fontWeight: 500,
  width: "100%",
  transition: "background 0.2s",
});

const btnStyle = (bg, color) => ({
  padding: "8px 20px",
  background: bg,
  color: color,
  border: "none",
  borderRadius: 8,
  fontWeight: 500,
  cursor: "pointer",
});
