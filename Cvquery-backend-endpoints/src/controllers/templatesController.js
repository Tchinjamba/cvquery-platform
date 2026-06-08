const Template = require('../models/Template');

// Criar um novo template
async function createTemplate(req, res) {
  try {
    const { name, body } = req.body;

    if (!name || !body) {
      return res.status(400).json({
        error: 'Nome e conteudo do template sao obrigatorios.'
      });
    }

    const template = new Template({
      name,
      content: body,
      owner: req.user.id
    });

    await template.save();

    return res.status(201).json({
      _id: template._id,
      name: template.name,
      content: template.content,
      createdAt: template.createdAt
    });

  } catch (err) {
    console.error('Erro ao criar template:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Listar todos os templates do utilizador
async function listTemplates(req, res) {
  try {
    const templates = await Template.find({
      owner: req.user.id
    }).sort({ createdAt: -1 }).lean();

    return res.json(templates);

  } catch (err) {
    console.error('Erro ao listar templates:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Obter um template específico
async function getTemplate(req, res) {
  try {
    const { id } = req.params;

    const template = await Template.findOne({
      _id: id,
      owner: req.user.id
    }).lean();

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    return res.json(template);

  } catch (err) {
    console.error('Erro ao obter template:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Atualizar um template
async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { name, body } = req.body;

    const template = await Template.findOne({
      _id: id,
      owner: req.user.id
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    if (name) template.name = name;
    if (body) template.content = body;

    await template.save();

    return res.json({
      _id: template._id,
      name: template.name,
      content: template.content,
      updatedAt: template.updatedAt
    });

  } catch (err) {
    console.error('Erro ao atualizar template:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

// Eliminar um template
async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;

    const template = await Template.findOneAndDelete({
      _id: id,
      owner: req.user.id
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template nao encontrado.'
      });
    }

    return res.json({
      message: 'Template eliminado com sucesso.'
    });

  } catch (err) {
    console.error('Erro ao eliminar template:', err);
    return res.status(500).json({
      error: err.message
    });
  }
}

module.exports = {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate
};