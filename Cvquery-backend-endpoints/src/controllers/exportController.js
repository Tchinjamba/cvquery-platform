const puppeteer  = require('puppeteer');
const HTMLtoDOCX = require('html-to-docx');
const CV         = require('../models/CV');
const Template   = require('../models/Template');
const { processWithHandlebars } = require('../services/cvqueryProcessor');

const ACCENT = '#003D8F';

// ─── Text → HTML body ────────────────────────────────────────────────────────
// Converts the plain-text output of the CVQuery processor into semantic HTML.
// Recognised patterns (in priority order):
//   # Title        → <h1>
//   ## Section     → <h2>
//   Short text:    → <h2> (section heading heuristic — short line ending with colon)
//   • item / - i   → <li> inside <ul>
//   **bold**       → <p><strong>
//   (empty line)   → paragraph break (skipped, handled by CSS margin)
//   anything else  → <p>

function textToHTML(text) {
  const lines = text.split('\n');
  const out   = [];
  let inList  = false;

  for (const line of lines) {
    const t = line.trim();

    if (!t) {
      if (inList) { out.push('</ul>'); inList = false; }
      continue; // blank lines become natural spacing via CSS margins
    }

    const isBullet  = t.startsWith('• ') || (t.startsWith('- ') && t.length > 2);
    const isH1      = t.startsWith('# ');
    const isH2Md    = t.startsWith('## ');
    // Heuristic: short line (under 60 chars) ending with ':' that isn't an email or URL
    const isSection = !isH1 && !isH2Md && t.endsWith(':') && t.length < 60 &&
                      !t.includes('@') && !t.includes('://');
    const boldMatch = !isBullet && !isH1 && !isH2Md && !isSection && t.match(/^\*\*(.+)\*\*$/);

    if (isBullet) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${t.slice(2)}</li>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      if (isH1) {
        out.push(`<h1>${t.slice(2)}</h1>`);
      } else if (isH2Md) {
        out.push(`<h2>${t.slice(3)}</h2>`);
      } else if (isSection) {
        out.push(`<h2>${t.slice(0, -1)}</h2>`);
      } else if (boldMatch) {
        out.push(`<p><strong>${boldMatch[1]}</strong></p>`);
      } else {
        out.push(`<p>${t}</p>`);
      }
    }
  }

  if (inList) out.push('</ul>');
  return out.join('\n');
}

// ─── Full HTML document wrapper ───────────────────────────────────────────────

function wrapInDocument(bodyHTML, title) {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10pt;
      color: #1A1A1A;
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm 20mm;
      line-height: 1.55;
    }
    h1 {
      font-size: 22pt;
      font-weight: bold;
      text-align: center;
      color: #1A1A1A;
      margin-bottom: 6px;
    }
    h2 {
      font-size: 11pt;
      font-weight: bold;
      color: ${ACCENT};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid ${ACCENT};
      padding-bottom: 3px;
      margin: 18px 0 8px;
    }
    h3 {
      font-size: 10pt;
      font-weight: bold;
      margin: 8px 0 3px;
    }
    p {
      font-size: 10pt;
      margin: 3px 0 6px;
    }
    ul {
      margin: 4px 0 8px 20px;
    }
    li {
      font-size: 10pt;
      margin: 2px 0;
    }
    strong { font-weight: bold; }
    @media print { body { padding: 10mm 15mm; } }
  </style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
}

// ─── HTML → LaTeX ─────────────────────────────────────────────────────────────

function htmlToLaTeX(html) {
  const esc = (s) => String(s)
    .replace(/\\/g,  '\\textbackslash{}')
    .replace(/&amp;/g, '\\&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&/g,  '\\&').replace(/%/g,  '\\%').replace(/\$/g, '\\$')
    .replace(/#/g,  '\\#').replace(/_/g,  '\\_')
    .replace(/\{/g, '\\{').replace(/\}/g, '\\}')
    .replace(/~/g,  '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}');

  // Strip <head> and <style> blocks
  let body = html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>|<\/html>/gi, '')
    .replace(/<body[^>]*>|<\/body>/gi, '');

  const stripTags = (s) => s.replace(/<[^>]+>/g, '');

  body = body
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi,
      (_, t) => `\n{\\LARGE\\bfseries ${esc(stripTags(t))}}\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi,
      (_, t) => `\n\\section*{${esc(stripTags(t))}}\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi,
      (_, t) => `\n\\subsection*{${esc(stripTags(t))}}\n`)
    .replace(/<strong>([\s\S]*?)<\/strong>/gi,
      (_, t) => `\\textbf{${esc(stripTags(t))}}`)
    .replace(/<em>([\s\S]*?)<\/em>/gi,
      (_, t) => `\\textit{${esc(stripTags(t))}}`)
    .replace(/<ul>([\s\S]*?)<\/ul>/gi, (_, items) => {
      const listItems = items.replace(
        /<li>([\s\S]*?)<\/li>/gi,
        (__, item) => `  \\item ${esc(stripTags(item))}\n`
      );
      return `\n\\begin{itemize}\n${listItems}\\end{itemize}\n`;
    })
    .replace(/<p>([\s\S]*?)<\/p>/gi,
      (_, t) => `\n${esc(stripTags(t))}\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  // Clean up excess blank lines
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  const accentHex = ACCENT.replace('#', '');

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=2cm]{geometry}
\\usepackage{titlesec}
\\usepackage{parskip}
\\usepackage[hidelinks]{hyperref}
\\usepackage{xcolor}
\\usepackage{enumitem}

\\definecolor{accent}{HTML}{${accentHex}}

\\titleformat{\\section}
  {\\large\\bfseries\\color{accent}}{}{0em}{}[{\\color{accent}\\hrule}]
\\titlespacing{\\section}{0pt}{14pt}{5pt}

\\titleformat{\\subsection}
  {\\normalsize\\bfseries}{}{0em}{}
\\titlespacing{\\subsection}{0pt}{10pt}{3pt}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlist[itemize]{noitemsep, topsep=2pt}

\\begin{document}

${body}

\\end{document}`;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function loadCVAndTemplate(req, res) {
  const { cvId, templateId } = req.body;
  if (!cvId)       { res.status(400).json({ error: 'cvId é obrigatório.' });       return null; }
  if (!templateId) { res.status(400).json({ error: 'templateId é obrigatório.' }); return null; }

  const [cv, template] = await Promise.all([
    CV.findOne({ _id: cvId, owner: req.user.id }).lean(),
    Template.findOne({ _id: templateId, owner: req.user.id }).lean(),
  ]);

  if (!cv)       { res.status(404).json({ error: 'CV não encontrado.' });       return null; }
  if (!template) { res.status(404).json({ error: 'Template não encontrado.' }); return null; }

  return { cv, template };
}

function buildExportHTML(cvData, template) {
  const text    = processWithHandlebars(cvData, template.content, 'text');
  const bodyHTML = textToHTML(text);
  return wrapInDocument(bodyHTML, cvData.name || 'Curriculum Vitae');
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function exportHTML(req, res) {
  try {
    const docs = await loadCVAndTemplate(req, res);
    if (!docs) return;
    const html = buildExportHTML(docs.cv.data, docs.template);
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${docs.cv.name || 'cv'}.html"`,
    });
    return res.send(html);
  } catch (err) {
    console.error('exportHTML:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function exportPDF(req, res) {
  try {
    const docs = await loadCVAndTemplate(req, res);
    if (!docs) return;
    const html = buildExportHTML(docs.cv.data, docs.template);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '20mm', right: '20mm' },
    });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${docs.cv.name || 'cv'}.pdf"`,
    });
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('exportPDF:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function exportDOCX(req, res) {
  try {
    const docs = await loadCVAndTemplate(req, res);
    if (!docs) return;
    const html = buildExportHTML(docs.cv.data, docs.template);

    const docxBuffer = await HTMLtoDOCX(html, null, {
      table:      { row: { cantSplit: true } },
      footer:     false,
      pageNumber: false,
      font:       'Calibri',
      fontSize:   22,
      margins:    { top: 1134, bottom: 1134, left: 1134, right: 1134 },
    });

    res.set({
      'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${docs.cv.name || 'cv'}.docx"`,
    });
    return res.send(docxBuffer);
  } catch (err) {
    console.error('exportDOCX:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function exportLaTeX(req, res) {
  try {
    const docs = await loadCVAndTemplate(req, res);
    if (!docs) return;
    const html  = buildExportHTML(docs.cv.data, docs.template);
    const latex = htmlToLaTeX(html);

    res.set({
      'Content-Type':        'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${docs.cv.name || 'cv'}.tex"`,
    });
    return res.send(latex);
  } catch (err) {
    console.error('exportLaTeX:', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { exportHTML, exportPDF, exportDOCX, exportLaTeX };
