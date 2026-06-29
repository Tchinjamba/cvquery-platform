"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ============================================================
// 🧠 MÓDULO CVQuery - (mantido igual ao seu)
// ============================================================
class CVQueryParser {
  constructor(template) {
    this.template = template;
    this.ast = [];
  }
  parse() {
    const lines = this.template.split('\n');
    this.ast = lines.map(line => this.parseLine(line));
    return this.ast;
  }
  parseLine(line) {
    let placeholderMatch = line.match(/\$\$\.(\w+(\.\w+)*)/);
    if (!placeholderMatch) placeholderMatch = line.match(/\$\.(\w+(\.\w+)*)/);
    if (placeholderMatch) {
      return { type: 'placeholder', path: placeholderMatch[1], raw: placeholderMatch[0] };
    }
    let loopMatch = line.match(/{{#each \$\$\.(\w+)}}/);
    if (!loopMatch) loopMatch = line.match(/{{#each \$\.(\w+)}}/);
    if (loopMatch) {
      return { type: 'loop_open', array: loopMatch[1] };
    }
    if (line.trim() === '{{/each}}') {
      return { type: 'loop_close' };
    }
    let ifMatch = line.match(/{{#if \$\$\.(\w+)}}/);
    if (!ifMatch) ifMatch = line.match(/{{#if \$\.(\w+)}}/);
    if (ifMatch) {
      return { type: 'if', condition: ifMatch[1] };
    }
    if (line.trim() === '{{/if}}') {
      return { type: 'if_close' };
    }
    return { type: 'text', content: line };
  }
}

class CVQueryBinder {
  constructor(ast, data) {
    this.ast = ast;
    this.data = data;
    this.output = [];
  }
  bind() {
    let i = 0;
    while (i < this.ast.length) {
      const node = this.ast[i];
      if (node.type === 'text') {
        this.output.push(node.content);
        i++;
      }
else if (node.type === 'placeholder') {
  const value = this.getValue(node.path);
  // 🔥 Se for objeto (não array) → retorna vazio para evitar [object Object]
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    this.output.push('');
  } else {
    this.output.push(value !== undefined ? String(value) : '');
  }
  i++;
}
      else if (node.type === 'loop_open') {
        const arrayData = this.getValue(node.array);
        if (Array.isArray(arrayData) && arrayData.length > 0) {
          const loopEnd = this.findLoopEnd(i);
          const loopBody = this.ast.slice(i + 1, loopEnd);
          arrayData.forEach(item => {
            const binder = new CVQueryBinder(loopBody, { ...this.data, _item: item });
            const result = binder.bind();
            this.output.push(result.join(''));
          });
          i = loopEnd + 1;
        } else {
          i = this.findLoopEnd(i) + 1;
        }
      }
      else if (node.type === 'if') {
        const conditionValue = this.getValue(node.condition);
        const ifEnd = this.findIfEnd(i);
        const ifBody = this.ast.slice(i + 1, ifEnd);
        if (conditionValue) {
          const binder = new CVQueryBinder(ifBody, this.data);
          const result = binder.bind();
          this.output.push(result.join(''));
        }
        i = ifEnd + 1;
      }
      else {
        i++;
      }
    }
    return this.output;
  }
  getValue(path) {
    const parts = path.split('.');
    let current = this.data;
    if (parts[0] === '_item') {
      parts.shift();
      current = this.data._item || {};
    }
    for (const part of parts) {
      if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }
  findLoopEnd(start) {
    let depth = 1;
    let i = start + 1;
    while (i < this.ast.length && depth > 0) {
      if (this.ast[i].type === 'loop_open') depth++;
      if (this.ast[i].type === 'loop_close') depth--;
      i++;
    }
    return i - 1;
  }
  findIfEnd(start) {
    let depth = 1;
    let i = start + 1;
    while (i < this.ast.length && depth > 0) {
      if (this.ast[i].type === 'if') depth++;
      if (this.ast[i].type === 'if_close') depth--;
      i++;
    }
    return i - 1;
  }
}

class CVQueryRenderer {
  constructor(boundContent, format = 'text') {
    this.content = boundContent;
    this.format = format;
  }
  render() {
    const text = this.content.join('\n');
    switch (this.format) {
      case 'html':
        return this.renderHTML(text);
      case 'markdown':
        return this.renderMarkdown(text);
      case 'text':
      default:
        return text;
    }
  }
  renderHTML(text) {
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        html += `<h1>${trimmed.substring(2)}</h1>\n`;
      } else if (trimmed.startsWith('## ')) {
        html += `<h2>${trimmed.substring(3)}</h2>\n`;
      } else if (trimmed.startsWith('### ')) {
        html += `<h3>${trimmed.substring(4)}</h3>\n`;
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        html += `<p><strong>${trimmed.substring(2, trimmed.length - 2)}</strong></p>\n`;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const item = trimmed.substring(2);
        if (!inList) {
          html += `<ul>\n`;
          inList = true;
        }
        html += `<li>${item}</li>\n`;
      } else if (trimmed === '') {
        if (inList) {
          html += `</ul>\n`;
          inList = false;
        }
        html += `<br/>\n`;
      } else {
        if (inList) {
          html += `</ul>\n`;
          inList = false;
        }
        html += `<p>${trimmed}</p>\n`;
      }
    }
    if (inList) {
      html += `</ul>\n`;
    }
return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Curriculum Vitae</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 210mm; margin: 10mm auto; padding: 10mm; line-height: 1.4; font-size: 11px; }
    .logo { text-align: center; font-size: 22px; font-weight: bold; color: #003D8F; letter-spacing: 4px; margin-bottom: 12px; border-bottom: 2px solid #003D8F; padding-bottom: 6px; }
    h1 { font-size: 18px; border-bottom: 2px solid #003D8F; padding-bottom: 4px; }
    h2 { font-size: 14px; color: #003D8F; border-left: 3px solid #003D8F; padding-left: 8px; margin-top: 12px; }
    h3 { font-size: 12px; margin: 8px 0 4px 0; }
    ul { margin: 4px 0; padding-left: 20px; }
    li { margin: 2px 0; }
    p { margin: 4px 0; }
    .personal-info { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; }
    .personal-info p { margin: 2px 0; font-size: 10px; }
    .personal-info strong { display: inline-block; width: 70px; }
    .period { color: #888; font-size: 9px; }
    @media print { body { margin: 0; padding: 10mm; } }
  </style>
</head>
<body>
  <div class="logo">CVQuery</div>
  ${html}
</body>
</html>`;
  }
  renderMarkdown(text) {
    return text;
  }
}

class CVQueryPipeline {
  constructor(template, data, format = 'text') {
    this.template = template;
    this.data = data;
    this.format = format;
  }
  process() {
    const parser = new CVQueryParser(this.template);
    const ast = parser.parse();
    const binder = new CVQueryBinder(ast, this.data);
    const boundContent = binder.bind();
    const renderer = new CVQueryRenderer(boundContent, this.format);
    return renderer.render();
  }
}

// ============================================================
// 🆕 FUNÇÃO PARA APLICAR REGRAS DO TEMPLATE (FILTRAGEM E TRADUÇÃO)
// ============================================================
function applyTemplateRules(originalData, template) {
  if (!template) return originalData;
  // Clona para não modificar o estado original
  const data = JSON.parse(JSON.stringify(originalData));

  // 1. Filtrar secções com base no templateType (se existir campo 'sections')
  if (template.templateType && template.templateType !== 'all' && data.sections) {
    data.sections = data.sections.filter(
      section => section.category === template.templateType
    );
  }

  // 2. Traduzir para inglês se o template tiver language = 'en'
  if (template.language === 'en') {
    return translateObject(data);
  }

  return data;
}

// Dicionário básico de tradução (expanda conforme necessário)
function translateObject(obj) {
  const dict = {
    "Experiência Profissional": "Professional Experience",
    "Formação Académica": "Education",
    "Competências": "Skills",
    "Objetivo": "Objective",
    "Informações Pessoais": "Personal Information",
    "Nome": "Name",
    "Email": "Email",
    "Telefone": "Phone",
    "Localização": "Location",
    "Empresa": "Company",
    "Cargo": "Position",
    "Período": "Period",
    "Descrição": "Description",
    "Instituição": "Institution",
    "Curso": "Course",
    "Estado": "Status"
  };

  if (typeof obj === 'string') {
    return dict[obj] || obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => translateObject(item));
  }
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = translateObject(value);
    }
    return newObj;
  }
  return obj;
}

// ============================================================
// 📄 COMPONENTE PRINCIPAL
// ============================================================
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.3,
    backgroundColor: '#ffffff'
  },
  header: { marginBottom: 12, textAlign: 'center' },
  logo: { fontSize: 18, fontWeight: 'bold', color: '#003D8F', marginBottom: 8, letterSpacing: 3 },
  personalInfo: { marginBottom: 12, padding: 10, backgroundColor: '#F5F5F5', borderRadius: 4 },
  personalInfoTitle: { fontSize: 9, fontWeight: 'bold', color: '#003D8F', marginBottom: 4 },
  personalInfoRow: { fontSize: 8, color: '#333', marginBottom: 2, flexDirection: 'row' },
  personalInfoLabel: { fontWeight: 'bold', width: 70 },
  personalInfoValue: { flex: 1 },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#003D8F', paddingBottom: 3, marginBottom: 6, color: '#003D8F' },
  itemTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 2, color: '#1A1A1A' },
  itemPeriod: { fontSize: 8, color: '#999', marginBottom: 2 },
  itemDescription: { fontSize: 8, marginBottom: 4, textAlign: 'justify', color: '#333' },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  skillItem: { fontSize: 7, padding: '2 6', backgroundColor: '#F5F5F5', borderRadius: 3, marginRight: 4, marginBottom: 3, color: '#333' },
});

const PDFDocument = ({ cvData }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.logo}>CVQuery</Text>
      </View>
      <View style={pdfStyles.personalInfo}>
        <Text style={pdfStyles.personalInfoTitle}>INFORMAÇÕES PESSOAIS</Text>
        <View style={pdfStyles.personalInfoRow}>
          <Text style={pdfStyles.personalInfoLabel}>Nome:</Text>
          <Text style={pdfStyles.personalInfoValue}>{cvData?.name || "—"}</Text>
        </View>
        <View style={pdfStyles.personalInfoRow}>
          <Text style={pdfStyles.personalInfoLabel}>Email:</Text>
          <Text style={pdfStyles.personalInfoValue}>{cvData?.contact?.email || "—"}</Text>
        </View>
        <View style={pdfStyles.personalInfoRow}>
          <Text style={pdfStyles.personalInfoLabel}>Telefone:</Text>
          <Text style={pdfStyles.personalInfoValue}>{cvData?.contact?.phone || "—"}</Text>
        </View>
        <View style={pdfStyles.personalInfoRow}>
          <Text style={pdfStyles.personalInfoLabel}>Localização:</Text>
          <Text style={pdfStyles.personalInfoValue}>{cvData?.contact?.location || "—"}</Text>
        </View>
        {cvData?.course && (
          <View style={pdfStyles.personalInfoRow}>
            <Text style={pdfStyles.personalInfoLabel}>Estado:</Text>
            <Text style={pdfStyles.personalInfoValue}>{cvData.course}</Text>
          </View>
        )}
      </View>
      {cvData?.objective && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Objetivo</Text>
          <Text style={pdfStyles.itemDescription}>{cvData.objective}</Text>
        </View>
      )}
      {cvData?.experience?.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Experiência Profissional</Text>
          {cvData.experience.map((exp, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <Text style={pdfStyles.itemTitle}>{exp.title} | {exp.company}</Text>
              <Text style={pdfStyles.itemPeriod}>{exp.period}{exp.location ? `  |  ${exp.location}` : ""}</Text>
              <Text style={pdfStyles.itemDescription}>{exp.description}</Text>
            </View>
          ))}
        </View>
      )}
      {cvData?.education?.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Formação Académica</Text>
          {cvData.education.map((edu, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <Text style={pdfStyles.itemTitle}>{edu.degree}</Text>
              <Text style={pdfStyles.itemPeriod}>{edu.institution}{edu.period ? `  |  ${edu.period}` : ""}</Text>
              <Text style={pdfStyles.itemDescription}>{edu.description}</Text>
            </View>
          ))}
        </View>
      )}
      {cvData?.skills?.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Competências</Text>
          <View style={pdfStyles.skillsContainer}>
            {cvData.skills.map((skill, idx) => <Text key={idx} style={pdfStyles.skillItem}>{skill}</Text>)}
          </View>
        </View>
      )}
    </Page>
  </Document>
);

export default function ExportPage() {
  const { api } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [cvData, setCvData] = useState({});
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [processedOutput, setProcessedOutput] = useState("");
  const [outputFormat, setOutputFormat] = useState("text");
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [cvsRes, templatesRes] = await Promise.all([
        api("/api/cv"),
        api("/api/templates")
      ]);
      const cvsData = await cvsRes.json();
      const templatesData = await templatesRes.json();
      setCvs(Array.isArray(cvsData) ? cvsData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      if (cvsData.length > 0) {
        setSelectedCV(cvsData[0]);
        setCvData(cvsData[0].data || {});
        setJsonText(JSON.stringify(cvsData[0].data || {}, null, 2));
      }
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
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
      const parsed = JSON.parse(text);
      setCvData(parsed);
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
        method: "PATCH",
        body: JSON.stringify({ data: cvData })
      });
      if (!res.ok) throw new Error("Erro ao guardar");
      alert("CV guardado com sucesso!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 🆕 Processar com dados filtrados/traduzidos
  const handleProcess = () => {
    if (!selectedTemplate) {
      setError("Selecione um template");
      return;
    }
    if (!selectedCV) {
      setError("Selecione um CV");
      return;
    }
    try {
      const processedData = applyTemplateRules(cvData, selectedTemplate);
      const pipeline = new CVQueryPipeline(
        selectedTemplate.content,
        processedData,
        outputFormat
      );
      const result = pipeline.process();
      setProcessedOutput(result);
      setShowOutput(true);
      setError("");
    } catch (err) {
      setError("Erro ao processar template: " + err.message);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🆕 Exportar com dados filtrados/traduzidos
  const exportWithPipeline = (format) => {
    if (!selectedTemplate) {
      setError("Selecione um template");
      return;
    }
    if (!selectedCV) {
      setError("Selecione um CV");
      return;
    }
    try {
      const processedData = applyTemplateRules(cvData, selectedTemplate);
      const pipeline = new CVQueryPipeline(
        selectedTemplate.content,
        processedData,
        format
      );
      const result = pipeline.process();
      const ext = format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'txt';
      const mime = format === 'html' ? 'text/html' : format === 'markdown' ? 'text/markdown' : 'text/plain';
      let finalContent = result;
      if (format === 'text') {
        finalContent = `CVQuery\n${"=".repeat(40)}\n\nINFORMAÇÕES PESSOAIS\n-------------------\nNome: ${processedData?.name || "—"}\nEmail: ${processedData?.contact?.email || "—"}\nTelefone: ${processedData?.contact?.phone || "—"}\nLocalização: ${processedData?.contact?.location || "—"}\n${processedData?.course ? `Estado: ${processedData.course}` : ""}\n\n${result}`;
      }
      downloadFile(finalContent, `${selectedCV?.name || "cv"}.${ext}`, mime);
      setError("");
    } catch (err) {
      setError("Erro ao exportar: " + err.message);
    }
  };

  const exportJSON = () => {
    downloadFile(JSON.stringify(cvData, null, 2), `${selectedCV?.name || "cv"}.json`, "application/json");
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center" }}>A carregar...</div>;
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
            <h1 className="page-title" style={{ fontSize: "24px", fontWeight: 600, color: "#FFFFFF", marginBottom: 4 }}>Exportar CV</h1>
            <p className="page-subtitle" style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>Processador CVQuery - Parse → Bind → Render</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", background: "#FFFFFF", color: "#003D8F", border: "none", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}>
            {saving ? "A guardar..." : "💾 Guardar alterações"}
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {error && <div style={{ marginBottom: 16, padding: 12, background: "#fee2e2", color: "#dc2626", borderRadius: 8 }}>❌ {error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 1fr", gap: 24 }}>
          {/* Sidebar CVs */}
          <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#F5F5F5", borderBottom: "1px solid #E0E0E0", fontWeight: 600, color: "#1A1A1A" }}>Meus CVs</div>
            <div style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
              {cvs.map(cv => (
                <button key={cv._id} onClick={() => handleSelectCV(cv)} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", border: "none", background: selectedCV?._id === cv._id ? "#DBEAFE" : "transparent", cursor: "pointer", borderBottom: "1px solid #F0F0F0" }}>
                  <div style={{ fontWeight: selectedCV?._id === cv._id ? 600 : 400, color: "#1A1A1A" }}>{cv.name}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{new Date(cv.updatedAt).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor JSON + Template */}
          <div>
            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 12, color: "#1A1A1A" }}>📝 Dados do CV (JSON)</h3>
              <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Dados que serão injetados no template</p>
              <textarea value={jsonText} onChange={handleJsonChange} rows={10} style={{ width: "100%", fontFamily: "monospace", fontSize: 12, padding: 12, border: "1px solid #E0E0E0", borderRadius: 8 }} />
            </div>

            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ marginBottom: 12, color: "#1A1A1A" }}>📋 Template CVQuery</h3>
              <select
                value={selectedTemplate?._id || ""}
                onChange={(e) => {
                  const template = templates.find(t => t._id === e.target.value);
                  handleSelectTemplate(template);
                }}
                style={{ width: "100%", padding: 10, border: "1px solid #E0E0E0", borderRadius: 6, marginBottom: 12 }}
              >
                {templates.length === 0 && <option value="">Nenhum template disponível</option>}
                {templates.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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
                <div style={{ padding: 12, background: "#F5F5F5", borderRadius: 6, fontSize: 12, marginTop: 12 }}>
                  <strong>Template:</strong> {selectedTemplate.name}
                  {selectedTemplate.templateType && (
                    <span style={{ marginLeft: 12, background: "#003D8F", color: "#fff", padding: "2px 10px", borderRadius: 12 }}>
                      {selectedTemplate.templateType}
                    </span>
                  )}
                  {selectedTemplate.language && (
                    <span style={{ marginLeft: 8, background: "#6B7280", color: "#fff", padding: "2px 10px", borderRadius: 12 }}>
                      {selectedTemplate.language}
                    </span>
                  )}
                </div>
              )}

              {showOutput && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>📄 Output processado:</div>
                  <div style={{
                    background: "#F5F5F5",
                    borderRadius: 6,
                    padding: 12,
                    maxHeight: 300,
                    overflow: "auto",
                    fontFamily: outputFormat === "html" ? "inherit" : "monospace",
                    fontSize: outputFormat === "html" ? "inherit" : 11,
                    whiteSpace: outputFormat === "html" ? "normal" : "pre-wrap"
                  }}>
                    {outputFormat === "html" ? (
                      <div dangerouslySetInnerHTML={{ __html: processedOutput }} />
                    ) : (
                      processedOutput || "Clique em 'Processar' para ver o resultado..."
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Exportação */}
          <div>
            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, color: "#1A1A1A" }}>📤 Exportar</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={() => exportWithPipeline('html')} style={buttonStyle("#003D8F")}>🌐 HTML</button>
                <button onClick={() => exportWithPipeline('text')} style={buttonStyle("#4A4A4A")}>📝 Texto</button>
                <button onClick={() => exportWithPipeline('markdown')} style={buttonStyle("#6B7280")}>📊 Markdown</button>
                <button onClick={exportJSON} style={buttonStyle("#003D8F")}>🔧 JSON</button>
                {/* 🆕 PDF com dados processados */}
                <PDFDownloadLink
                  document={<PDFDocument cvData={applyTemplateRules(cvData, selectedTemplate)} />}
                  fileName={`${selectedCV?.name || "cv"}.pdf`}
                  style={{ textDecoration: "none", gridColumn: "span 2" }}
                >
                  {({ loading }) => (
                    <button style={{ ...buttonStyle("#003D8F", loading), width: "100%" }} disabled={loading}>
                      📑 {loading ? "A gerar PDF..." : "Exportar PDF"}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
              {!selectedTemplate && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#999", textAlign: "center" }}>
                  ⚠️ Selecione um template para exportar
                </div>
              )}
            </div>

            {/* Resumo do CV */}
            <div style={{ border: "1px solid #E0E0E0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ marginBottom: 12, color: "#1A1A1A" }}>👤 Resumo do CV</h3>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "#4A4A4A" }}>
                <p><strong>Nome:</strong> {cvData?.name || "—"}</p>
                <p><strong>Email:</strong> {cvData?.contact?.email || "—"}</p>
                <p><strong>Experiências:</strong> {cvData?.experience?.length || 0}</p>
                <p><strong>Educação:</strong> {cvData?.education?.length || 0}</p>
                <p><strong>Competências:</strong> {cvData?.skills?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, padding: 16, background: "#F5F5F5", borderRadius: 8, fontSize: 13, color: "#666" }}>
          <h4 style={{ color: "#1A1A1A", marginBottom: 4 }}>⚡ CVQuery Pipeline</h4>
          <p><strong>Parse → Bind → Render</strong></p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            {`A sintaxe CVQuery suporta placeholders ($$.campo), loops ({{#each $.array}}) e condicionais ({{#if $.campo}}). O pipeline é extensível e desacoplado, permitindo novos formatos de saída.`}
          </p>
        </div>
      </div>
    </>
  );
}

const buttonStyle = (bgColor, disabled = false) => ({
  padding: "10px 14px",
  background: disabled ? "#ccc" : bgColor,
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 13,
  fontWeight: 500,
  transition: "all 0.2s",
  width: "100%"
});