const puppeteer = require('puppeteer');

const CV = require('../models/CV');
const Template = require('../models/Template');

const { processCV } = require('../services/cvqueryProcessor');

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
    const browser = await puppeteer.launch();

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Gerar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
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
    return res.status(500).json({
      error: err.message
    });
  }
}

module.exports = {
  exportPDF
};