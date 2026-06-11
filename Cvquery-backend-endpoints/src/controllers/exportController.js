const puppeteer = require('puppeteer');
const CV = require('../models/CV');
const Template = require('../models/Template');
const { processCV, processWithHandlebars, generateDocxBuffer } = require('../services/cvqueryProcessor');

// Exportar para PDF
async function exportPDF(req, res) {
  try {
    const { cvId, templateId, content } = req.body;

    if (!cvId) {
      return res.status(400).json({
        error: 'cvId Ã© obrigatorio.'
      });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({
        error: 'CV nao encontrado.'
      });
    }

    let templateContent;

    if (content) {
      templateContent = content;
    } else if (templateId) {
      const template = await Template.findOne({
        _id: templateId,
        owner: req.user.id
      }).lean();
      templateContent = template?.content;
    } else {
      templateContent = `Nome: $.name\nEmail: $.contact.email`;
    }

    const html = processCV(cv.data, templateContent, 'html');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cv.pdf"'
    });

    return res.send(pdf);

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Exportar para JSON
async function exportJSON(req, res) {
  try {
    const { cvId } = req.body;

    if (!cvId) {
      return res.status(400).json({ error: 'cvId Ã© obrigatorio.' });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    const jsonData = JSON.stringify(cv.data, null, 2);

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="cv.json"'
    });

    return res.send(jsonData);

  } catch (err) {
    console.error('Erro ao gerar JSON:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Exportar para HTML
async function exportHTML(req, res) {
  try {
    const { cvId, templateId, content } = req.body;

    if (!cvId) {
      return res.status(400).json({ error: 'cvId Ã© obrigatorio.' });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    let templateContent;

    if (content) {
      templateContent = content;
    } else if (templateId) {
      const template = await Template.findOne({
        _id: templateId,
        owner: req.user.id
      }).lean();
      templateContent = template?.content;
    } else {
      templateContent = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${cv.data?.name || 'CV'}</title></head>
<body>
  <h1>${cv.data?.name || 'Nome nÃ£o definido'}</h1>
  <p>Email: ${cv.data?.contact?.email || ''}</p>
</body>
</html>`;
    }

    let html;
    try {
      html = processCV(cv.data, templateContent, 'html');
    } catch (err) {
      console.error('Erro no processCV:', err);
      html = templateContent;
    }

    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': 'attachment; filename="cv.html"'
    });

    return res.send(html);

  } catch (err) {
    console.error('Erro ao gerar HTML:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Exportar para LaTeX
async function exportLaTeX(req, res) {
  try {
    const { cvId, templateId, content } = req.body;

    if (!cvId) {
      return res.status(400).json({ error: 'cvId Ã© obrigatorio.' });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    let templateContent;

    if (content) {
      templateContent = content;
    } else if (templateId) {
      const template = await Template.findOne({
        _id: templateId,
        owner: req.user.id
      }).lean();
      templateContent = template?.content;
    } else {
      templateContent = `Nome: ${cv.data?.name || ''}\nEmail: ${cv.data?.contact?.email || ''}`;
    }

    let latex;
    try {
      latex = processCV(cv.data, templateContent, 'latex');
    } catch (err) {
      console.error('Erro no processCV:', err);
      latex = templateContent;
    }

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="cv.tex"'
    });

    return res.send(latex);

  } catch (err) {
    console.error('Erro ao gerar LaTeX:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Exportar para Markdown
async function exportMarkdown(req, res) {
  try {
    const { cvId, templateId, content } = req.body;

    if (!cvId) {
      return res.status(400).json({ error: 'cvId Ã© obrigatorio.' });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    let templateContent;

    if (content) {
      templateContent = content;
    } else if (templateId) {
      const template = await Template.findOne({
        _id: templateId,
        owner: req.user.id
      }).lean();
      templateContent = template?.content;
    } else {
      templateContent = `# ${cv.data?.name || 'CV'}\n\n**Email:** ${cv.data?.contact?.email || ''}`;
    }

    let markdown;
    try {
      markdown = processCV(cv.data, templateContent, 'markdown');
    } catch (err) {
      console.error('Erro no processCV:', err);
      markdown = templateContent;
    }

    res.set({
      'Content-Type': 'text/markdown',
      'Content-Disposition': 'attachment; filename="cv.md"'
    });

    return res.send(markdown);

  } catch (err) {
    console.error('Erro ao gerar Markdown:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Exportar para Texto
async function exportText(req, res) {
  try {
    const { cvId, templateId, content } = req.body;

    if (!cvId) {
      return res.status(400).json({ error: 'cvId Ã© obrigatorio.' });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    let templateContent;

    if (content) {
      templateContent = content;
    } else if (templateId) {
      const template = await Template.findOne({
        _id: templateId,
        owner: req.user.id
      }).lean();
      templateContent = template?.content;
    } else {
      templateContent = `Nome: ${cv.data?.name || ''}\nEmail: ${cv.data?.contact?.email || ''}`;
    }

    let text;
    try {
      text = processCV(cv.data, templateContent, 'text');
    } catch (err) {
      console.error('Erro no processCV:', err);
      text = templateContent;
    }

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="cv.txt"'
    });

    return res.send(text);

  } catch (err) {
    console.error('Erro ao gerar Texto:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Exportar com template personalizado (rota unificada)
async function exportWithTemplate(req, res) {
  try {
    const { cvId, templateContent, format } = req.body;

    if (!cvId || !templateContent || !format) {
      return res.status(400).json({
        error: 'cvId, templateContent e format sao obrigatorios.'
      });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    let output;
    let contentType;
    let extension;

    try {
      switch (format) {
        case 'html':
          output = processCV(cv.data, templateContent, 'html');
          contentType = 'text/html';
          extension = 'html';
          break;
        case 'latex':
          output = processCV(cv.data, templateContent, 'latex');
          contentType = 'text/plain';
          extension = 'tex';
          break;
        case 'markdown':
          output = processCV(cv.data, templateContent, 'markdown');
          contentType = 'text/markdown';
          extension = 'md';
          break;
        case 'json':
          output = JSON.stringify(cv.data, null, 2);
          contentType = 'application/json';
          extension = 'json';
          break;
        case 'pdf':
          const html = processCV(cv.data, templateContent, 'html');
          const browser = await puppeteer.launch({ headless: 'new' });
          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: 'networkidle0' });
          const pdf = await page.pdf({ format: 'A4', printBackground: true });
          await browser.close();
          output = pdf;
          contentType = 'application/pdf';
          extension = 'pdf';
          break;
        default:
          output = processCV(cv.data, templateContent, 'text');
          contentType = 'text/plain';
          extension = 'txt';
      }
    } catch (err) {
      console.error('Erro no processCV:', err);
      output = templateContent;
      contentType = 'text/plain';
      extension = 'txt';
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="cv.${extension}"`
    });

    return res.send(output);

  } catch (err) {
    console.error('Erro ao exportar com template:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Exportar batch
async function exportBatch(req, res) {
  try {
    const { cvId, templateId, content, formats } = req.body;

    if (!cvId || !formats || !formats.length) {
      return res.status(400).json({ error: 'cvId e formats sao obrigatorios.' });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    let templateContent;

    if (content) {
      templateContent = content;
    } else if (templateId) {
      const template = await Template.findOne({
        _id: templateId,
        owner: req.user.id
      }).lean();
      templateContent = template?.content;
    } else {
      templateContent = `Nome: ${cv.data?.name || ''}\nEmail: ${cv.data?.contact?.email || ''}`;
    }

    const results = {};

    for (const format of formats) {
      try {
        switch (format) {
          case 'html':
            results.html = processCV(cv.data, templateContent, 'html');
            break;
          case 'latex':
            results.latex = processCV(cv.data, templateContent, 'latex');
            break;
          case 'markdown':
            results.markdown = processCV(cv.data, templateContent, 'markdown');
            break;
          case 'text':
            results.text = processCV(cv.data, templateContent, 'text');
            break;
          case 'json':
            results.json = JSON.stringify(cv.data, null, 2);
            break;
        }
      } catch (err) {
        results[format] = { error: err.message };
      }
    }

    return res.json({ success: true, formats: results });

  } catch (err) {
    console.error('Erro ao gerar batch:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ... (resto do cÃ³digo)

// Exportar para DOCX
async function exportDOCX(req, res) {
  try {
    s
    const { cvId } = req.body;

    if (!cvId) {
      return res.status(400).json({ error: 'cvId Ã© obrigatÃ³rio.' });
    }

    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nÃ£o encontrado.' });
    }

    const docxBuffer = await generateDocxBuffer(cv.data);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="cv.docx"'
    });

    return res.send(docxBuffer);

  } catch (err) {
    console.error('Erro ao gerar DOCX:', err);
    return res.status(500).json({ error: err.message });
  }
}
module.exports = {
  exportPDF,
  exportJSON,
  exportHTML,
  exportLaTeX,
  exportMarkdown,
  exportText,
  exportWithTemplate,
  exportBatch,
  exportDOCX
};
