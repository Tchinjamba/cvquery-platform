const puppeteer = require('puppeteer');
const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = require('docx');
const CV = require('../models/CV');

const DESIGN = {
  color: {
    accent:      '#003D8F',
    text:        '#1A1A1A',
    meta:        '#555555',
    skillBg:     '#EEF2FF',
    skillBorder: '#C7D5F0',
  },
  font: { css: 'Helvetica, Arial, sans-serif' },
  size: { name: 22, section: 11, itemTitle: 10, body: 10, meta: 9 },
  margin: { cssPage: '15mm 20mm', cssPrint: '10mm 15mm' },
};

// ─── HTML renderer (single source of truth) ───────────────────────────────────

function buildHTMLDocument(cvData) {
  const { color, font, size, margin } = DESIGN;
  const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const section = (title, body) => body ? `<section><h2>${esc(title)}</h2>${body}</section>` : '';

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${font.css}; font-size: ${size.body}pt; color: ${color.text};
           max-width: 210mm; margin: 0 auto; padding: ${margin.cssPage}; line-height: 1.5; }
    header { text-align: center; margin-bottom: 18px; }
    header h1 { font-size: ${size.name}pt; font-weight: bold; color: ${color.text}; }
    header .contact { font-size: ${size.meta}pt; color: ${color.meta}; margin-top: 4px; }
    .divider { border: none; border-top: 1.5px solid ${color.accent}; margin: 12px 0 16px; }
    section { margin-bottom: 18px; }
    section h2 { font-size: ${size.section}pt; font-weight: bold; color: ${color.accent};
                 text-transform: uppercase; letter-spacing: 0.05em;
                 border-bottom: 0.5px solid ${color.accent}; padding-bottom: 3px; margin-bottom: 10px; }
    .item { margin-bottom: 10px; }
    .item-title { font-weight: bold; font-size: ${size.itemTitle}pt; color: ${color.text}; }
    .item-meta  { font-size: ${size.meta}pt; color: ${color.meta}; margin: 2px 0 4px; }
    .item p     { font-size: ${size.body}pt; margin-top: 3px; text-align: justify; }
    .skills     { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .skill      { background: ${color.skillBg}; border: 1px solid ${color.skillBorder};
                  color: ${color.accent}; padding: 2px 10px; border-radius: 12px; font-size: ${size.meta}pt; }
    @media print { body { padding: ${margin.cssPrint}; } }
  `;

  const contactParts = [cvData.contact?.email, cvData.contact?.phone, cvData.contact?.location].filter(Boolean);

  const expHTML = (cvData.experience || []).map(e => `
    <div class="item">
      <div class="item-title">${esc(e.title)}${e.company ? ` — ${esc(e.company)}` : ''}</div>
      ${e.period || e.location ? `<div class="item-meta">${[e.period, e.location].filter(Boolean).map(esc).join(' | ')}</div>` : ''}
      ${e.description ? `<p>${esc(e.description)}</p>` : ''}
    </div>`).join('');

  const eduHTML = (cvData.education || []).map(e => `
    <div class="item">
      <div class="item-title">${esc(e.degree)}</div>
      ${e.institution || e.period ? `<div class="item-meta">${[e.institution, e.period].filter(Boolean).map(esc).join(' | ')}</div>` : ''}
      ${e.description ? `<p>${esc(e.description)}</p>` : ''}
    </div>`).join('');

  const skillsHTML = (cvData.skills || []).length
    ? `<div class="skills">${cvData.skills.map(s => `<span class="skill">${esc(s)}</span>`).join('')}</div>`
    : '';

  const langHTML = (cvData.languages || []).map(l =>
    `<div class="item"><span class="item-title">${esc(l.name)}</span>${l.level ? `<span class="item-meta"> — ${esc(l.level)}</span>` : ''}</div>`
  ).join('');

  const certHTML = (cvData.certifications || []).map(c => `
    <div class="item">
      <div class="item-title">${esc(c.title)}</div>
      ${c.institution || c.date ? `<div class="item-meta">${[c.institution, c.date].filter(Boolean).map(esc).join(' | ')}</div>` : ''}
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(cvData.name || 'Curriculum Vitae')}</title>
  <style>${css}</style>
</head>
<body>
  <header>
    <h1>${esc(cvData.name || 'Curriculum Vitae')}</h1>
    ${contactParts.length ? `<div class="contact">${contactParts.map(esc).join('  |  ')}</div>` : ''}
  </header>
  <hr class="divider">
  ${cvData.objective ? section('Objetivo', `<p>${esc(cvData.objective)}</p>`) : ''}
  ${expHTML    ? section('Experiência Profissional', expHTML)   : ''}
  ${eduHTML    ? section('Formação Académica',        eduHTML)   : ''}
  ${skillsHTML ? section('Competências',              skillsHTML): ''}
  ${langHTML   ? section('Idiomas',                   langHTML)  : ''}
  ${certHTML   ? section('Certificações',             certHTML)  : ''}
</body>
</html>`;
}

// ─── DOCX renderer ────────────────────────────────────────────────────────────

async function buildDOCXBuffer(cvData) {
  // Colors without # for docx package
  const ACCENT = '003D8F';
  const GRAY   = '666666';
  const BLACK  = '1A1A1A';

  const heading = (title) => new Paragraph({
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, color: ACCENT })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 2 } },
    spacing: { before: 300, after: 140 },
  });

  const itemTitle = (text) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: BLACK })],
    spacing: { before: 100, after: 20 },
  });

  const itemMeta = (text) => new Paragraph({
    children: [new TextRun({ text, size: 18, color: GRAY })],
    spacing: { after: 40 },
  });

  const body = (text) => new Paragraph({
    children: [new TextRun({ text, size: 20, color: BLACK })],
    spacing: { after: 80 },
  });

  const children = [];

  // Name
  children.push(new Paragraph({
    children: [new TextRun({ text: cvData.name || 'Curriculum Vitae', bold: true, size: 48, color: BLACK })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }));

  // Contact line
  const cp = [cvData.contact?.email, cvData.contact?.phone, cvData.contact?.location].filter(Boolean);
  if (cp.length) {
    children.push(new Paragraph({
      children: [new TextRun({ text: cp.join('  |  '), size: 18, color: GRAY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
    }));
  }

  // Divider
  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 1 } },
    spacing: { after: 200 },
  }));

  if (cvData.objective) {
    children.push(heading('Objetivo'));
    children.push(body(cvData.objective));
  }

  if (cvData.experience?.length) {
    children.push(heading('Experiência Profissional'));
    cvData.experience.forEach(e => {
      children.push(itemTitle([e.title, e.company].filter(Boolean).join(' — ')));
      const meta = [e.period, e.location].filter(Boolean).join(' | ');
      if (meta) children.push(itemMeta(meta));
      if (e.description) children.push(body(e.description));
    });
  }

  if (cvData.education?.length) {
    children.push(heading('Formação Académica'));
    cvData.education.forEach(e => {
      children.push(itemTitle(e.degree || ''));
      const meta = [e.institution, e.period].filter(Boolean).join(' | ');
      if (meta) children.push(itemMeta(meta));
      if (e.description) children.push(body(e.description));
    });
  }

  if (cvData.skills?.length) {
    children.push(heading('Competências'));
    children.push(new Paragraph({
      children: [new TextRun({ text: cvData.skills.join('  •  '), size: 20, color: BLACK })],
      spacing: { after: 80 },
    }));
  }

  if (cvData.languages?.length) {
    children.push(heading('Idiomas'));
    cvData.languages.forEach(l => {
      children.push(body(l.name + (l.level ? ' — ' + l.level : '')));
    });
  }

  if (cvData.certifications?.length) {
    children.push(heading('Certificações'));
    cvData.certifications.forEach(c => {
      children.push(itemTitle(c.title || ''));
      const meta = [c.institution, c.date].filter(Boolean).join(' | ');
      if (meta) children.push(itemMeta(meta));
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

// ─── LaTeX renderer ───────────────────────────────────────────────────────────

function buildLaTeXDocument(cvData) {
  const esc = (s) => String(s || '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g,  '\\&')
    .replace(/%/g,  '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g,  '\\#')
    .replace(/_/g,  '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g,  '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');

  const accentHex = DESIGN.color.accent.replace('#', '');
  const contactParts = [cvData.contact?.email, cvData.contact?.phone, cvData.contact?.location].filter(Boolean);

  const sections = [];

  if (cvData.objective) {
    sections.push(`\\section*{Objetivo}\n${esc(cvData.objective)}`);
  }

  if (cvData.experience?.length) {
    const items = cvData.experience.map(e => {
      const title = `\\textbf{${esc([e.title, e.company].filter(Boolean).join(' --- '))}}`;
      const meta  = [e.period, e.location].filter(Boolean).map(esc).join(' | ');
      const desc  = e.description ? `\n\n${esc(e.description)}` : '';
      return `${title}\\\\${meta ? `\n{\\small \\textcolor{gray}{${meta}}}` : ''}${desc}`;
    }).join('\n\n\\vspace{6pt}\n');
    sections.push(`\\section*{Experiência Profissional}\n${items}`);
  }

  if (cvData.education?.length) {
    const items = cvData.education.map(e => {
      const title = `\\textbf{${esc(e.degree || '')}}`;
      const meta  = [e.institution, e.period].filter(Boolean).map(esc).join(' | ');
      const desc  = e.description ? `\n\n${esc(e.description)}` : '';
      return `${title}\\\\${meta ? `\n{\\small \\textcolor{gray}{${meta}}}` : ''}${desc}`;
    }).join('\n\n\\vspace{6pt}\n');
    sections.push(`\\section*{Formação Académica}\n${items}`);
  }

  if (cvData.skills?.length) {
    sections.push(`\\section*{Competências}\n${cvData.skills.map(esc).join(' $\\bullet$ ')}`);
  }

  if (cvData.languages?.length) {
    const items = cvData.languages.map(l =>
      `${esc(l.name)}${l.level ? ' --- ' + esc(l.level) : ''}`
    ).join('\\\\[2pt]');
    sections.push(`\\section*{Idiomas}\n${items}`);
  }

  if (cvData.certifications?.length) {
    const items = cvData.certifications.map(c => {
      const title = `\\textbf{${esc(c.title || '')}}`;
      const meta  = [c.institution, c.date].filter(Boolean).map(esc).join(' | ');
      return `${title}${meta ? `\\\\\n{\\small \\textcolor{gray}{${meta}}}` : ''}`;
    }).join('\n\n\\vspace{6pt}\n');
    sections.push(`\\section*{Certificações}\n${items}`);
  }

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=2cm]{geometry}
\\usepackage{titlesec}
\\usepackage{parskip}
\\usepackage[hidelinks]{hyperref}
\\usepackage{xcolor}

\\definecolor{accent}{HTML}{${accentHex}}

\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[{\\color{accent}\\hrule}]
\\titlespacing{\\section}{0pt}{14pt}{5pt}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries ${esc(cvData.name || 'Curriculum Vitae')}}\\\\[4pt]
  ${contactParts.length ? `{\\small ${contactParts.map(esc).join(' $\\cdot$ ')}}` : ''}
\\end{center}

\\vspace{4pt}
{\\color{accent}\\rule{\\linewidth}{1.5pt}}
\\vspace{8pt}

${sections.join('\n\n')}

\\end{document}`;
}

// ─── Shared loader ────────────────────────────────────────────────────────────

async function loadCV(cvId, userId) {
  return CV.findOne({ _id: cvId, owner: userId }).lean();
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function exportHTML(req, res) {
  try {
    const { cvId } = req.body;
    if (!cvId) return res.status(400).json({ error: 'cvId é obrigatório.' });
    const cv = await loadCV(cvId, req.user.id);
    if (!cv) return res.status(404).json({ error: 'CV não encontrado.' });

    res.set({ 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${cv.name || 'cv'}.html"` });
    return res.send(buildHTMLDocument(cv.data));
  } catch (err) {
    console.error('exportHTML:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function exportPDF(req, res) {
  try {
    const { cvId } = req.body;
    if (!cvId) return res.status(400).json({ error: 'cvId é obrigatório.' });
    const cv = await loadCV(cvId, req.user.id);
    if (!cv) return res.status(404).json({ error: 'CV não encontrado.' });

    const html = buildHTMLDocument(cv.data);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBytes = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '20mm', right: '20mm' } });
    await browser.close();

    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${cv.name || 'cv'}.pdf"` });
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('exportPDF:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function exportDOCX(req, res) {
  try {
    const { cvId } = req.body;
    if (!cvId) return res.status(400).json({ error: 'cvId é obrigatório.' });
    const cv = await loadCV(cvId, req.user.id);
    if (!cv) return res.status(404).json({ error: 'CV não encontrado.' });

    const docx = await buildDOCXBuffer(cv.data);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${cv.name || 'cv'}.docx"`,
    });
    return res.send(docx);
  } catch (err) {
    console.error('exportDOCX:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function exportLaTeX(req, res) {
  try {
    const { cvId } = req.body;
    if (!cvId) return res.status(400).json({ error: 'cvId é obrigatório.' });
    const cv = await loadCV(cvId, req.user.id);
    if (!cv) return res.status(404).json({ error: 'CV não encontrado.' });

    res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="${cv.name || 'cv'}.tex"` });
    return res.send(buildLaTeXDocument(cv.data));
  } catch (err) {
    console.error('exportLaTeX:', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { exportHTML, exportPDF, exportDOCX, exportLaTeX };
