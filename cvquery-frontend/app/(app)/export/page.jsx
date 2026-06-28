"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const btnStyle = (color, disabled = false) => ({
  padding: "10px 14px",
  background: disabled ? "#ccc" : color,
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 13,
  fontWeight: 500,
  width: "100%",
});

export default function ExportPage() {
  const { api } = useAuth();
  const [cvs, setCvs]                   = useState([]);
  const [templates, setTemplates]       = useState([]);
  const [selectedCV, setSelectedCV]     = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [cvData, setCvData]             = useState({});
  const [jsonText, setJsonText]         = useState("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [saving, setSaving]             = useState(false);
  const [exporting, setExporting]       = useState(null);
  const [outputFormat, setOutputFormat] = useState("html");
  const [processedOutput, setProcessedOutput] = useState("");
  const [processing, setProcessing]     = useState(false);
  const [showOutput, setShowOutput]     = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [cvsRes, tplRes] = await Promise.all([
        api("/api/cv"),
        api("/api/templates"),
      ]);
      const cvsData = await cvsRes.json();
      const tplData = await tplRes.json();
      const cvList  = Array.isArray(cvsData) ? cvsData : [];
      const tplList = Array.isArray(tplData) ? tplData : [];
      setCvs(cvList);
      setTemplates(tplList);
      if (cvList.length > 0) selectCV(cvList[0]);
      if (tplList.length > 0) setSelectedTemplate(tplList[0]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  function selectCV(cv) {
    setSelectedCV(cv);
    setCvData(cv.data || {});
    setJsonText(JSON.stringify(cv.data || {}, null, 2));
    setError("");
    setProcessedOutput("");
    setShowOutput(false);
  }

  function handleJsonChange(e) {
    const text = e.target.value;
    setJsonText(text);
    try {
      setCvData(JSON.parse(text));
      setError("");
    } catch {
      setError("JSON inválido");
    }
  }

  async function handleSave() {
    if (!selectedCV) return;
    setSaving(true);
    setError("");
    try {
      const res = await api(`/api/cv/${selectedCV._id}`, {
        method: "PUT",
        body: JSON.stringify({ data: cvData }),
      });
      if (!res.ok) throw new Error("Erro ao guardar");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleProcess() {
    if (!selectedTemplate) { setError("Selecione um template"); return; }
    if (!selectedCV) { setError("Selecione um CV"); return; }
    setProcessing(true);
    setError("");
    try {
      const res = await api("/api/cv/process", {
        method: "POST",
        body: JSON.stringify({
          cvData,
          template: selectedTemplate.content,
          format: outputFormat,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProcessedOutput(data.output);
      setShowOutput(true);
    } catch (err) {
      setError("Erro ao processar: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportFormat(format) {
    if (!selectedCV) { setError("Selecione um CV"); return; }
    setExporting(format);
    setError("");
    try {
      await api(`/api/cv/${selectedCV._id}`, {
        method: "PUT",
        body: JSON.stringify({ data: cvData }),
      });
      const res = await api(`/api/export/${format}`, {
        method: "POST",
        body: JSON.stringify({ cvId: selectedCV._id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao exportar");
      }
      const blob = await res.blob();
      const ext  = { html: "html", pdf: "pdf", docx: "docx", latex: "tex" }[format] || format;
      triggerDownload(blob, `${selectedCV.name || "cv"}.${ext}`);
    } catch (err) {
      setError("Erro ao exportar: " + err.message);
    } finally {
      setExporting(null);
    }
  }

  if (loading) return <div style={{ padding: 32, textAlign: "center" }}>A carregar...</div>;

  return (
    <>
      {/* Header */}
      <div style={{ background: "#003D8F", borderBottom: "1px solid #1E40AF", padding: "24px 32px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>Exportar CV</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>Pré-visualize com um template ou exporte directamente em HTML, PDF, DOCX, LaTeX ou JSON</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !selectedCV}
            style={{ padding: "8px 20px", background: "#FFFFFF", color: "#003D8F", border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "A guardar..." : "Guardar alterações"}
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1600, margin: "0 auto" }}>
        {error && (
          <div style={{ marginBottom: 16, padding: 12, background: "#fee2e2", color: "#dc2626", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr 260px", gap: 20 }}>

          {/* CV list */}
          <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#F5F5F5", borderBottom: "1px solid #E0E0E0", fontWeight: 600, fontSize: 13, color: "#1A1A1A" }}>
              Meus CVs
            </div>
            <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
              {cvs.length === 0 && (
                <div style={{ padding: 16, color: "#999", fontSize: 13 }}>Nenhum CV encontrado</div>
              )}
              {cvs.map(cv => (
                <button key={cv._id} onClick={() => selectCV(cv)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 14px", border: "none",
                  background: selectedCV?._id === cv._id ? "#DBEAFE" : "transparent",
                  cursor: "pointer", borderBottom: "1px solid #F0F0F0",
                }}>
                  <div style={{ fontWeight: selectedCV?._id === cv._id ? 600 : 400, fontSize: 13, color: "#1A1A1A" }}>{cv.name}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{new Date(cv.updatedAt).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* JSON editor */}
          <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginBottom: 8, fontSize: 14, color: "#1A1A1A" }}>Dados do CV (JSON)</h3>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>Edite os dados antes de exportar</p>
            <textarea
              value={jsonText}
              onChange={handleJsonChange}
              rows={24}
              style={{
                width: "100%", fontFamily: "monospace", fontSize: 11,
                padding: 10, border: "1px solid #E0E0E0", borderRadius: 8, resize: "vertical",
              }}
            />
          </div>

          {/* Template preview */}
          <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginBottom: 8, fontSize: 14, color: "#1A1A1A" }}>Template CVQuery</h3>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>Pré-visualize o CV com um template personalizado</p>

            <select
              value={selectedTemplate?._id || ""}
              onChange={e => setSelectedTemplate(templates.find(t => t._id === e.target.value) || null)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #E0E0E0", borderRadius: 6, marginBottom: 10, fontSize: 13 }}
            >
              {templates.length === 0 && <option value="">Nenhum template disponível</option>}
              {templates.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <select
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value)}
                style={{ padding: "7px 10px", border: "1px solid #E0E0E0", borderRadius: 6, fontSize: 13 }}
              >
                <option value="html">HTML</option>
                <option value="text">Texto</option>
                <option value="markdown">Markdown</option>
              </select>
              <button
                onClick={handleProcess}
                disabled={processing || !selectedTemplate}
                style={{ flex: 1, padding: "7px 16px", background: "#003D8F", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, opacity: processing ? 0.7 : 1 }}
              >
                {processing ? "A processar..." : "Processar"}
              </button>
            </div>

            <div style={{
              background: "#F5F5F5", borderRadius: 6, padding: 12,
              minHeight: 200, maxHeight: "calc(100vh - 420px)", overflow: "auto",
              fontFamily: outputFormat === "html" ? "inherit" : "monospace",
              fontSize: outputFormat === "html" ? "inherit" : 11,
              whiteSpace: outputFormat === "html" ? "normal" : "pre-wrap",
              color: showOutput ? "inherit" : "#999",
            }}>
              {showOutput ? (
                outputFormat === "html"
                  ? <div dangerouslySetInnerHTML={{ __html: processedOutput }} />
                  : processedOutput
              ) : (
                "Clique em «Processar» para ver o output..."
              )}
            </div>
          </div>

          {/* Export panel + summary */}
          <div>
            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 14, fontSize: 14, color: "#1A1A1A" }}>Exportar documento</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => exportFormat("html")}  disabled={!!exporting} style={btnStyle("#003D8F", !!exporting)}>
                  {exporting === "html"  ? "A exportar..." : "HTML"}
                </button>
                <button onClick={() => exportFormat("pdf")}   disabled={!!exporting} style={btnStyle("#003D8F", !!exporting)}>
                  {exporting === "pdf"   ? "A gerar PDF..." : "PDF"}
                </button>
                <button onClick={() => exportFormat("docx")}  disabled={!!exporting} style={btnStyle("#4A4A4A", !!exporting)}>
                  {exporting === "docx"  ? "A exportar..." : "DOCX (Word)"}
                </button>
                <button onClick={() => exportFormat("latex")} disabled={!!exporting} style={btnStyle("#6B7280", !!exporting)}>
                  {exporting === "latex" ? "A exportar..." : "LaTeX (.tex)"}
                </button>
              </div>
              {!selectedCV && (
                <p style={{ marginTop: 10, fontSize: 12, color: "#999", textAlign: "center" }}>
                  Selecione um CV para exportar
                </p>
              )}
            </div>

            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 18 }}>
              <h3 style={{ marginBottom: 10, fontSize: 14, color: "#1A1A1A" }}>Resumo</h3>
              <div style={{ fontSize: 12, lineHeight: 1.9, color: "#4A4A4A" }}>
                <p><strong>Nome:</strong> {cvData?.name || "—"}</p>
                <p><strong>Email:</strong> {cvData?.contact?.email || "—"}</p>
                <p><strong>Telefone:</strong> {cvData?.contact?.phone || "—"}</p>
                <p><strong>Experiências:</strong> {cvData?.experience?.length || 0}</p>
                <p><strong>Educação:</strong> {cvData?.education?.length || 0}</p>
                <p><strong>Competências:</strong> {cvData?.skills?.length || 0}</p>
                <p><strong>Idiomas:</strong> {cvData?.languages?.length || 0}</p>
                <p><strong>Certificações:</strong> {cvData?.certifications?.length || 0}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
