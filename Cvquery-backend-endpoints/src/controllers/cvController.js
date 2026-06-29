const CV = require('../models/CV');
const Template = require('../models/Template');
const { processWithHandlebars: runProcessor } = require('../services/cvqueryProcessor');

async function createCV(req, res) {
  const { name, data } = req.body;

  if (!name || !data) {
    return res.status(400).json({ error: 'name e data sao obrigatorios.' });
  }

  try {
    const cv = await CV.create({ owner: req.user.id, name, data });
    return res.status(201).json(cv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listCVs(req, res) {
  try {
    const cvs = await CV.find({ owner: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json(cvs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getCV(req, res) {
  try {
    const cv = await CV.findOne({ _id: req.params.id, owner: req.user.id }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    return res.json(cv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateCV(req, res) {
  const { name, data } = req.body;

  try {
    const cv = await CV.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      {
        ...(name && { name }),
        ...(data && { data })
      },
      { new: true, runValidators: true }
    ).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    return res.json(cv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteCV(req, res) {
  try {
    const cv = await CV.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    }).lean();

    if (!cv) {
      return res.status(404).json({ error: 'CV nao encontrado.' });
    }

    return res.json({ message: 'CV removido com sucesso.', id: req.params.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function processCV(req, res) {
  const { template, templateId, cvData, cvId, format = 'text' } = req.body;

  let data;
  let finalTemplate = template;
  let finalFormat = format;

  if (cvId) {
    try {
      const cv = await CV.findOne({
        _id: cvId,
        owner: req.user.id
      }).lean();

      if (!cv) {
        return res.status(404).json({ error: 'CV nao encontrado.' });
      }

      data = cv.data;
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else if (cvData && typeof cvData === 'object') {
    data = cvData;
  } else {
    return res.status(400).json({ error: 'Fornece cvData (object) ou cvId (string).' });
  }

  if (templateId) {
    try {
      const templateDoc = await Template.findOne({
        _id: templateId,
        owner: req.user.id
      }).lean();

      if (!templateDoc) {
        return res.status(404).json({ error: 'Template nao encontrado.' });
      }

      finalTemplate = templateDoc.content;
      finalFormat = templateDoc.format || format;
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (!finalTemplate) {
    return res.status(400).json({ error: 'template ou templateId e obrigatorio.' });
  }

  try {
    const output = runProcessor(data, finalTemplate, finalFormat);

    return res.json({
      output,
      format: finalFormat,
      source: {
        cvId: cvId || null,
        templateId: templateId || null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createCV,
  listCVs,
  getCV,
  updateCV,
  deleteCV,
  processCV
};