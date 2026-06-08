const puppeteer = require('puppeteer');
const CV = require('../models/CV');
const Template = require('../models/Template');
const { processCV } = require('../services/cvqueryProcessor');

// Exportar para PDF (já existente)
async function exportPDF(req, res) {
  try {
    const { cvId, templateId } = req.body;

    if (!cvId || !templateId) {
      return res.status(400).json({
        error: 'cvId e templateId sao obrigatorios.'
      });
    }

    // Buscar CV
    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({
        error: 'CV nao encontrado.'
      });
    }

    // Buscar template
    const template = await Template.findOne({
      _id: templateId,
      owner: req.user.id
    }).lean();

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    // Gerar HTML
    const html = processCV(
      cv.data,
      template.content,
      'html'
    );

    // Abrir browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Gerar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
    });

    await browser.close();

    const pdfBuffer = Buffer.from(pdf);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cv.pdf"',
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Exportar para JSON
async function exportJSON(req, res) {
  try {
    const { cvId } = req.body;

    if (!cvId) {
      return res.status(400).json({
        error: 'cvId é obrigatorio.'
      });
    }

    // Buscar CV
    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({
        error: 'CV nao encontrado.'
      });
    }

    const jsonData = JSON.stringify(cv.data, null, 2);

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="cv.json"'
    });

    return res.send(jsonData);

  } catch (err) {
    console.error('Erro ao gerar JSON:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Exportar para HTML
async function exportHTML(req, res) {
  try {
    const { cvId, templateId } = req.body;

    if (!cvId || !templateId) {
      return res.status(400).json({
        error: 'cvId e templateId sao obrigatorios.'
      });
    }

    // Buscar CV
    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({
        error: 'CV nao encontrado.'
      });
    }

    // Buscar template
    const template = await Template.findOne({
      _id: templateId,
      owner: req.user.id
    }).lean();

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    // Gerar HTML usando o processCV
    const html = processCV(
      cv.data,
      template.content,
      'html'
    );

    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': 'attachment; filename="cv.html"'
    });

    return res.send(html);

  } catch (err) {
    console.error('Erro ao gerar HTML:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Exportar para LaTeX
async function exportLaTeX(req, res) {
  try {
    const { cvId, templateId } = req.body;

    if (!cvId || !templateId) {
      return res.status(400).json({
        error: 'cvId e templateId sao obrigatorios.'
      });
    }

    // Buscar CV
    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({
        error: 'CV nao encontrado.'
      });
    }

    // Buscar template
    const template = await Template.findOne({
      _id: templateId,
      owner: req.user.id
    }).lean();

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    // Gerar LaTeX usando o processCV
    const latex = processCV(
      cv.data,
      template.content,
      'latex'
    );

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="cv.tex"'
    });

    return res.send(latex);

  } catch (err) {
    console.error('Erro ao gerar LaTeX:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Exportar para Markdown
async function exportMarkdown(req, res) {
  try {
    const { cvId, templateId } = req.body;

    if (!cvId || !templateId) {
      return res.status(400).json({
        error: 'cvId e templateId sao obrigatorios.'
      });
    }

    // Buscar CV
    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({
        error: 'CV nao encontrado.'
      });
    }

    // Buscar template
    const template = await Template.findOne({
      _id: templateId,
      owner: req.user.id
    }).lean();

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    // Gerar Markdown usando o processCV
    const markdown = processCV(
      cv.data,
      template.content,
      'markdown'
    );

    res.set({
      'Content-Type': 'text/markdown',
      'Content-Disposition': 'attachment; filename="cv.md"'
    });

    return res.send(markdown);

  } catch (err) {
    console.error('Erro ao gerar Markdown:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Exportar para Texto
async function exportText(req, res) {
  try {
    const { cvId, templateId } = req.body;

    if (!cvId || !templateId) {
      return res.status(400).json({
        error: 'cvId e templateId sao obrigatorios.'
      });
    }

    // Buscar CV
    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({
        error: 'CV nao encontrado.'
      });
    }

    // Buscar template
    const template = await Template.findOne({
      _id: templateId,
      owner: req.user.id
    }).lean();

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    // Gerar Texto usando o processCV
    const text = processCV(
      cv.data,
      template.content,
      'text'
    );

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="cv.txt"'
    });

    return res.send(text);

  } catch (err) {
    console.error('Erro ao gerar Texto:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Exportar para múltiplos formatos (batch)
async function exportBatch(req, res) {
  try {
    const { cvId, templateId, formats } = req.body;

    if (!cvId || !templateId || !formats || !formats.length) {
      return res.status(400).json({
        error: 'cvId, templateId e formats sao obrigatorios.'
      });
    }

    // Buscar CV
    const cv = await CV.findOne({
      _id: cvId,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({
        error: 'CV nao encontrado.'
      });
    }

    // Buscar template
    const template = await Template.findOne({
      _id: templateId,
      owner: req.user.id
    }).lean();

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    const results = {};

    for (const format of formats) {
      switch(format) {
        case 'pdf':
          const html = processCV(cv.data, template.content, 'html');
          const browser = await puppeteer.launch({ headless: 'new' });
          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: 'networkidle0' });
          const pdf = await page.pdf({ format: 'A4', printBackground: true });
          await browser.close();
          results.pdf = pdf.toString('base64');
          break;
        case 'html':
          results.html = processCV(cv.data, template.content, 'html');
          break;
        case 'latex':
          results.latex = processCV(cv.data, template.content, 'latex');
          break;
        case 'markdown':
          results.markdown = processCV(cv.data, template.content, 'markdown');
          break;
        case 'text':
          results.text = processCV(cv.data, template.content, 'text');
          break;
        case 'json':
          results.json = JSON.stringify(cv.data, null, 2);
          break;
      }
    }

    return res.json({
      success: true,
      formats: results
    });

  } catch (err) {
    console.error('Erro ao gerar batch:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

module.exports = {
  exportPDF,
  exportJSON,
  exportHTML,
  exportLaTeX,
  exportMarkdown,
  exportText,
  exportBatch
};