"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ============================================================
// 🧠 MÓDULO CVQuery (corrigido para evitar [object Object])
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
        // 🔥 Se for objeto (não array), retorna undefined para ficar vazio
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
    /* 🔥 LOGO CVQuery no topo central */
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
// FUNÇÃO PARA APLICAR REGRAS DO TEMPLATE (FILTRAGEM E TRADUÇÃO)
// ============================================================
function applyTemplateRules(originalData, template) {
  if (!template) return originalData;
  const data = JSON.parse(JSON.stringify(originalData));
  if (template.templateType && template.templateType !== 'all' && data.sections) {
    data.sections = data.sections.filter(
      section => section.category === template.templateType
    );
  }
  if (template.language === 'en') {
    return translateObject(data);
  }
  return data;
}

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
  if (typeof obj === 'string') return dict[obj] || obj;
  if (Array.isArray(obj)) return obj.map(item => translateObject(item));
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
// 📄 COMPONENTE PDF (já tem o logo)
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
        {/* ... resto do PDF (mantido igual) ... */}
      </View>
      {cvData?.objective && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Objetivo</Text>
          <Text style={pdfStyles.itemDescription}>{cvData.objective}</Text>
        </View>
      )}
      {/* ... resto das secções ... */}
    </Page>
  </Document>
);

// ============================================================
// PÁGINA PRINCIPAL (mantida, apenas com as correções no pipeline)
// ============================================================
// ... (o resto do componente ExportPage permanece igual ao que já tem,
//      pois as correções estão nas classes acima)git 