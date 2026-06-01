const Template = require('../models/Template');

async function createTemplate(req, res) {
    const { name, format, content, description } = req.body;

    if (!name || !content) {
        return res.status(400).json({ error: 'name e content sao obrigatorios.' });
    }

    try {
        const template = await Template.create({
            owner: req.user.id,
            name,
            format,
            content,
            description
        });

        return res.status(201).json(template);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function listTemplates(req, res) {
    try {
        const templates = await Template.find({ owner: req.user.id }).sort({ createdAt: -1 }).lean();
        return res.json(templates);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getTemplate(req, res) {
    try {
        const template = await Template.findOne({
            _id: req.params.id,
            owner: req.user.id
        }).lean();

        if (!template) {
            return res.status(404).json({ error: 'Template nao encontrado.' });
        }

        return res.json(template);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function updateTemplate(req, res) {
    const { name, format, content, description } = req.body;

    try {
        const template = await Template.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            {
                ...(name && { name }),
                ...(format && { format }),
                ...(content && { content }),
                ...(description && { description })
            },
            { new: true, runValidators: true }
        ).lean();

        if (!template) {
            return res.status(404).json({ error: 'Template nao encontrado.' });
        }

        return res.json(template);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function deleteTemplate(req, res) {
    try {
        const template = await Template.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        }).lean();

        if (!template) {
            return res.status(404).json({ error: 'Template nao encontrado.' });
        }

        return res.json({ message: 'Template removido com sucesso.', id: req.params.id });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    createTemplate,
    listTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate
};