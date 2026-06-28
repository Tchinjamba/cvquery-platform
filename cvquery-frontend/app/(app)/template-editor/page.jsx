"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// ⭐ Templates de exemplo com a sintaxe OFICIAL da CVQuery (conforme https://curriculox.org/tutorials)
const INITIAL_EXAMPLES = [
  { 
    name: "Cabeçalho simples", 
    body: `Nome: /** $.name **/
Email: /** $.contact.email **/
Telefone: /** $.contact.phone **/` 
  },
  { 
    name: "Profissional (oficial)", 
    body: `/** $.name **/

/** $.contact.email **/  /** $.contact.phone **/

/** $( $.experience/--!==undefined && $.experience.length > 0 --/ ){
  Experiência Profissional:
  /** ($.experience.$exp, [[startDate, DESC]]) => {
    $exp.position na $exp.company
    Período: $exp.startDate - $( $exp.endDate/--!==undefined--/ ){ $exp.endDate }{ Presente }
    $( $exp.responsibilities/--!==undefined--/ ){
      Responsabilidades:
      $exp.responsibilities.$resp{
        • $resp\\n
      }
    }
    \\n
  } **/
} **/

/** $( $.skills/--!==undefined && $.skills.length > 0 --/ ){
  Competências:
  /** ($.skills.$skill) => {
    • $skill\\n
  } **/
} **/` 
  },
  { 
    name: "Académico (oficial)", 
    body: `/** $.name **/

/** $.contact.email **/  /** $.contact.phone **/
ORCID: /** $.orcid **/

/** $( $.publications/--!==undefined && $.publications.length > 0 --/ ){
  Publicações:
  /** ($.publications.$pub, [[year, DESC]]) => {
    • "$pub.title" ($pub.year) - $pub.journal\\n
  } **/
} **/

/** $( $.education/--!==undefined && $.education.length > 0 --/ ){
  Formação Académica:
  /** ($.education.$edu, [[year, DESC]]) => {
    • $edu.degree em $edu.institution ($edu.year)\\n
  } **/
} **/` 
  },
  { 
    name: "Completo (oficial)", 
    body: `=== /** $.name **/ ===
Email: /** $.contact.email **/
Telefone: /** $.contact.phone **/

/** $( $.objective/--!==undefined --/ ){
  Objetivo:
  /** $.objective **/
} **/

/** $( $.experience/--!==undefined && $.experience.length > 0 --/ ){
  Experiência Profissional:
  /** ($.experience.$exp, [[startDate, DESC]]) => {
    $exp.position na $exp.company
    Período: $exp.startDate - $( $exp.endDate/--!==undefined--/ ){ $exp.endDate }{ Presente }
    $( $exp.responsibilities/--!==undefined--/ ){
      Responsabilidades:
      $exp.responsibilities.$resp{
        • $resp\\n
      }
    }
    \\n
  } **/
} **/

/** $( $.education/--!==undefined && $.education.length > 0 --/ ){
  Formação Académica:
  /** ($.education.$edu, [[year, DESC]]) => {
    • $edu.degree em $edu.institution ($edu.year)\\n
  } **/
} **/

/** $( $.publications/--!==undefined && $.publications.length > 0 --/ ){
  Publicações:
  /** ($.publications.$pub, [[year, DESC]]) => {
    • "$pub.title" ($pub.year) - $pub.journal\\n
  } **/
} **/

/** $( $.skills/--!==undefined && $.skills.length > 0 --/ ){
  Competências:
  /** ($.skills.$skill) => {
    • $skill\\n
  } **/
} **/

/** $( $.languages/--!==undefined && $.languages.length > 0 --/ ){
  Idiomas:
  /** ($.languages.$lang) => {
    • $lang.name - $lang.level\\n
  } **/
} **/

/** $( $.certifications/--!==undefined && $.certifications.length > 0 --/ ){
  Certificados:
  /** ($.certifications.$cert) => {
    • $cert.title - $cert.institution ($cert.date)\\n
  } **/
} **/` 
  }
];

// ⭐ Funções auxiliares para processar templates no frontend
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function processEachBlocks(template, data) {
  const eachRegex = /\{\{#each \$\.([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  
  return template.replace(eachRegex, (match, arrayPath, blockContent) => {
    const array = getNestedValue(data, arrayPath);
    
    if (!Array.isArray(array)) {
      return '';
    }

    return array.map(item => {
      let processedBlock = blockContent;
      
      if (typeof item === 'string' || typeof item === 'number') {
        processedBlock = processedBlock.replace(/\{\{\.\}\}/g, String(item));
      }
      
      if (typeof item === 'object' && item !== null) {
        processedBlock = processedBlock.replace(/\{\{(\w+)\}\}/g, (m, key) => {
          return item[key] !== undefined ? String(item[key]) : '';
        });
      }
      
      return processedBlock;
    }).join('');
  });
}

function processTemplate(template, cvData) {
  let result = template;
  
  result = processEachBlocks(result, cvData);
  
  result = result.replace(/\{\{\$\.([\w.]+)\}\}/g, (match, path) => {
    const value = getNestedValue(cvData, path);
    return value !== undefined ? String(value) : '';
  });
  
  return result;
}

function markdownToHtml(markdown) {
  // função inalterada
  let html = markdown;
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: 600; margin: 16px 0 8px 0; color: #1a1a1a;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px 0; color: #003D8F; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #003D8F;">$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  const lines = html.split('\n');
  let inList = false;
  let result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listItemMatch = line.match(/^\- (.*$)/);
    if (listItemMatch) {
      if (!inList) {
        result.push('<ul style="margin: 8px 0; padding-left: 24px;">');
        inList = true;
      }
      result.push(`<li style="margin: 4px 0;">${listItemMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }
  if (inList) {
    result.push('</ul>');
  }
  html = result.join('\n');
  html = html.replace(/\n\n/g, '</p><p style="margin: 8px 0;">');
  html = html.replace(/\n/g, '<br>');
  if (!html.startsWith('<')) {
    html = '<p style="margin: 8px 0;">' + html + '</p>';
  }
  return html;
}

export default function TemplateEditor() {
  const { api } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [exampleSaved, setExampleSaved] = useState(false);
  const [cvs, setCvs] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [previewFormat, setPreviewFormat] = useState("html");
  const [activeTab, setActiveTab] = useState("edit");
  const [examples, setExamples] = useState(INITIAL_EXAMPLES);

  useEffect(() => {
    loadTemplates();
    loadCVs();
    const savedExamples = localStorage.getItem("cvquery_examples");
    if (savedExamples) {
      try {
        const parsed = JSON.parse(savedExamples);
        setExamples([...INITIAL_EXAMPLES, ...parsed]);
      } catch (e) {
        console.error("Erro ao carregar exemplos guardados:", e);
      }
    }
  }, []);

  async function loadTemplates() {
    try {
      const res = await api("/api/templates");
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      setError("Erro ao carregar templates. Verifique se o backend está ligado.");
    }
  }

  async function loadCVs() {
    try {
      const res = await api("/api/cv");
      const data = await res.json();
      setCvs(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedCV(data[0]);
      } else {
        setSelectedCV(null);
      }
    } catch (error) {
      console.error("Erro ao carregar CVs:", error);
      setSelectedCV(null);
    }
  }

  function selectTemplate(t) {
    setSelected(t);
    setBody(t.content || "");
    setName(t.name || "");
    setError("");
    setSaved(false);
    setActiveTab("edit");
  }

  function newTemplate() {
    setSelected(null);
    setBody("");
    setName("Novo template");
    setError("");
    setSaved(false);
    setActiveTab("edit");
  }

  function selectCV(cv) {
    setSelectedCV(cv);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("O template precisa de um nome.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      let res;
      if (selected) {
        res = await api(`/api/templates/${selected._id}`, {
          method: "PUT",
          body: JSON.stringify({ name, body: body })
        });
      } else {
        res = await api("/api/templates", {
          method: "POST",
          body: JSON.stringify({ name, body: body })
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao guardar template");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadTemplates();
      if (!selected) setSelected(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleSaveAsExample() {
    if (!name.trim() || !body.trim()) {
      setError("O template precisa de nome e conteúdo para ser guardado como exemplo.");
      return;
    }
    const newExample = { name: name.trim(), body: body.trim() };
    if (examples.some(e => e.name === newExample.name)) {
      if (!confirm(`Já existe um exemplo com o nome "${newExample.name}". Deseja substituí-lo?`)) {
        return;
      }
      const filtered = examples.filter(e => e.name !== newExample.name);
      const updated = [...filtered, newExample];
      setExamples(updated);
      localStorage.setItem("cvquery_examples", JSON.stringify(updated.filter(e => 
        !INITIAL_EXAMPLES.some(init => init.name === e.name)
      )));
      setExampleSaved(true);
      setTimeout(() => setExampleSaved(false), 2000);
      return;
    }
    const updated = [...examples, newExample];
    setExamples(updated);
    const userExamples = updated.filter(e => 
      !INITIAL_EXAMPLES.some(init => init.name === e.name)
    );
    localStorage.setItem("cvquery_examples", JSON.stringify(userExamples));
    setExampleSaved(true);
    setTimeout(() => setExampleSaved(false), 2000);
  }

  function handleDeleteExample(exampleName) {
    if (!confirm(`Tem certeza que quer apagar o exemplo "${exampleName}"?`)) return;
    const updated = examples.filter(e => e.name !== exampleName);
    setExamples(updated);
    const userExamples = updated.filter(e => 
      !INITIAL_EXAMPLES.some(init => init.name === e.name)
    );
    localStorage.setItem("cvquery_examples", JSON.stringify(userExamples));
  }

  async function handleDelete() {
    if (!selected || !confirm("Tem certeza que quer apagar este template?")) return;
    try {
      await api(`/api/templates/${selected._id}`, { method: "DELETE" });
      setSelected(null);
      setBody("");
      setName("");
      loadTemplates();
    } catch (error) {
      setError("Erro ao apagar template");
    }
  }

  function loadExample(example) {
    setSelected(null);
    setName(example.name);
    setBody(example.body);
    setError("");
    setSaved(false);
    setActiveTab("edit");
  }

  const processedPreview = selectedCV && body.trim() ? processTemplate(body, selectedCV) : "";

  if (error && !templates.length && !cvs.length) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ color: "#dc2626", marginBottom: 16 }}>❌ {error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header" style={{ 
        background: "#003D8F", 
        borderBottom: "1px solid #1E40AF", 
        padding: "24px 32px 16px 32px" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "24px", fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>Template Editor</h1>
            <p className="page-subtitle" style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Crie e edite os seus templates para os CVs</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={handleSaveAsExample}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "13px"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              ⭐ Guardar como exemplo
            </button>
            <button 
              onClick={newTemplate} 
              className="btn btn-primary"
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
              + Novo template
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
          {/* Sidebar esquerda - com alturas iguais entre as três secções */}
          <div style={{ 
            border: "1px solid #E0E0E0", 
            borderRadius: 8, 
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 220px)", // ajuste para ocupar a altura disponível
            maxHeight: "700px" // opcional, para não exceder demasiado
          }}>
            {/* Meus Templates */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div style={{ padding: "12px 16px", background: "#F8F8F8", borderBottom: "1px solid #E0E0E0", fontWeight: 500 }}>
                Meus Templates
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
                {templates.length === 0 && (
                  <div style={{ padding: "12px 16px", color: "#999" }}>Nenhum template ainda.</div>
                )}
                {templates.map(t => (
                  <button
                    key={t._id}
                    onClick={() => selectTemplate(t)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 16px",
                      border: "none",
                      background: selected?._id === t._id ? "#e0e7ff" : "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: selected?._id === t._id ? 500 : 400
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Exemplos */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, borderTop: "1px solid #E0E0E0" }}>
              <div style={{ padding: "12px 16px", background: "#F8F8F8", borderBottom: "1px solid #E0E0E0", fontWeight: 500 }}>
                Exemplos {exampleSaved && <span style={{ color: "#16a34a", fontSize: 11 }}>✓ Guardado</span>}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
                {examples.map((e, i) => {
                  const isUserExample = !INITIAL_EXAMPLES.some(init => init.name === e.name);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center" }}>
                      <button
                        onClick={() => loadExample(e)}
                        style={{
                          flex: 1,
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 16px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          borderBottom: "1px solid #f0f0f0",
                          fontWeight: selected?._id === e._id ? 500 : 400
                        }}
                      >
                        {e.name}
                        {isUserExample && (
                          <span style={{ 
                            fontSize: 9, 
                            color: "#3b82f6", 
                            marginLeft: 6,
                            background: "#dbeafe",
                            padding: "1px 6px",
                            borderRadius: 4
                          }}>
                            usuário
                          </span>
                        )}
                      </button>
                      {isUserExample && (
                        <button
                          onClick={() => handleDeleteExample(e.name)}
                          style={{
                            padding: "4px 8px",
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontSize: 12
                          }}
                          title="Apagar exemplo"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Os meus CVs */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, borderTop: "1px solid #E0E0E0" }}>
              <div style={{ padding: "12px 16px", background: "#F8F8F8", borderBottom: "1px solid #E0E0E0", fontWeight: 500 }}>
                Os meus CVs
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
                {cvs.length === 0 && (
                  <div style={{ padding: "12px 16px", color: "#999" }}>Nenhum CV ainda.</div>
                )}
                {cvs.map(cv => (
                  <button
                    key={cv._id}
                    onClick={() => selectCV(cv)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 16px",
                      border: "none",
                      background: selectedCV?._id === cv._id ? "#e0e7ff" : "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCV?._id !== cv._id) {
                        e.currentTarget.style.background = "#f5f5f5";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCV?._id !== cv._id) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ fontWeight: selectedCV?._id === cv._id ? 500 : 400, fontSize: 13 }}>{cv.name}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      {new Date(cv.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Área principal com tabs (inalterada) */}
          <div style={{ border: "1px solid #E0E0E0", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #E0E0E0", background: "#F8F8F8" }}>
              <button
                onClick={() => setActiveTab("edit")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  background: activeTab === "edit" ? "#FFFFFF" : "transparent",
                  borderBottom: activeTab === "edit" ? "2px solid #3b82f6" : "2px solid transparent",
                  cursor: "pointer",
                  fontWeight: activeTab === "edit" ? 600 : 400,
                  color: activeTab === "edit" ? "#3b82f6" : "#666",
                  fontSize: 14
                }}
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  background: activeTab === "preview" ? "#FFFFFF" : "transparent",
                  borderBottom: activeTab === "preview" ? "2px solid #3b82f6" : "2px solid transparent",
                  cursor: "pointer",
                  fontWeight: activeTab === "preview" ? 600 : 400,
                  color: activeTab === "preview" ? "#3b82f6" : "#666",
                  fontSize: 14
                }}
              >
                👁️ Visualizar
              </button>
            </div>

            {activeTab === "edit" ? (
              <>
                <div style={{ padding: "12px 16px", background: "#FFFFFF", borderBottom: "1px solid #E0E0E0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nome do template"
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    {selected && (
                      <button onClick={handleDelete} style={{ padding: "6px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
                        Apagar
                      </button>
                    )}
                    <button onClick={handleSave} disabled={saving} style={{ padding: "6px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: 6, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                      {saving ? "A guardar..." : saved ? "✓ Guardado" : "Guardar"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ margin: "16px", padding: "10px", background: "#fee2e2", color: "#dc2626", borderRadius: 6 }}>
                    ❌ {error}
                  </div>
                )}

                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={20}
                  style={{
                    width: "100%",
                    flex: 1,
                    padding: 16,
                    fontFamily: "monospace",
                    fontSize: 13,
                    lineHeight: 1.6,
                    border: "none",
                    resize: "none",
                    outline: "none",
                    minHeight: "500px"
                  }}
                  placeholder={`Escreva o template aqui...

Exemplo com sintaxe oficial:
Nome: /** $.name **/
Email: /** $.contact.email **/
/** ($.experience.$exp, [[startDate, DESC]]) => {
  $exp.position na $exp.company
} **/`}
                />

                <div style={{ padding: "8px 16px", background: "#F8F8F8", borderTop: "1px solid #E0E0E0", fontSize: 11, color: "#999" }}>
                  💡 Use <code style={{ background: "#E0E0E0", padding: "2px 6px", borderRadius: 4 }}>/** ... **/</code> para expressões, <code style={{ background: "#E0E0E0", padding: "2px 6px", borderRadius: 4 }}>$.campo</code> para aceder aos dados.
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: "12px 16px", background: "#FFFFFF", borderBottom: "1px solid #E0E0E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    CV: <strong>{selectedCV?.name || "Nenhum"}</strong>
                  </div>
                  <select
                    value={previewFormat}
                    onChange={(e) => setPreviewFormat(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #E0E0E0",
                      borderRadius: 6,
                      fontSize: 12,
                      background: "#ffffff"
                    }}
                  >
                    <option value="html">HTML Formatado</option>
                    <option value="markdown">Markdown</option>
                    <option value="text">Texto</option>
                  </select>
                </div>

                <div style={{ 
                  flex: 1,
                  overflow: "auto",
                  padding: "24px",
                  background: "#FFFFFF",
                  minHeight: "500px"
                }}>
                  {!selectedCV ? (
                    <div style={{ color: "#999", textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>Selecione um CV para ver a pré-visualização</div>
                    </div>
                  ) : !body.trim() ? (
                    <div style={{ color: "#999", textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>✏️</div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>Escreva um template para ver a pré-visualização</div>
                    </div>
                  ) : (
                    <>
                      {previewFormat === "html" ? (
                        <div 
                          style={{ 
                            fontFamily: "Arial, sans-serif",
                            fontSize: 14,
                            lineHeight: 1.8,
                            color: "#333",
                            maxWidth: "800px",
                            margin: "0 auto"
                          }}
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(processedPreview) }} 
                        />
                      ) : (
                        <pre style={{ 
                          margin: 0, 
                          whiteSpace: "pre-wrap",
                          fontFamily: previewFormat === "markdown" ? "monospace" : "Arial, sans-serif",
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: "#333",
                          maxWidth: "800px",
                          margin: "0 auto"
                        }}>
                          {processedPreview}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}