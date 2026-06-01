const Tutorial = require("../models/Tutorial");

async function createTutorial(req, res) {
  const {
    title,
    slug,
    content,
    category,
    description,
    order,
    published,
    videoUrl,
    duration
  } = req.body;

  if (!title || !slug || !content || !category || !order) {
    return res.status(400).json({
      error: "title, slug, content, category e order sao obrigatorios."
    });
  }

  try {
    const tutorial = await Tutorial.create({
      title,
      slug,
      content,
      category,
      description,
      order,
      published,
      videoUrl,
      duration
    });

    return res.status(201).json(tutorial);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listTutorials(req, res) {
  try {
    const filter = {};

    if (req.query.published === "true") {
      filter.published = true;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const tutorials = await Tutorial.find(filter).sort({ order: 1 }).lean();

    return res.json(tutorials);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getTutorial(req, res) {
  try {
    const tutorial = await Tutorial.findOne({
      slug: req.params.slug
    }).lean();

    if (!tutorial) {
      return res.status(404).json({ error: "Tutorial nao encontrado." });
    }

    return res.json(tutorial);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateTutorial(req, res) {
  const allowed = [
    "title",
    "slug",
    "content",
    "category",
    "description",
    "order",
    "published",
    "videoUrl",
    "duration"
  ];

  const update = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      update[key] = req.body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({
      error: "Nenhum campo valido foi enviado para atualizacao."
    });
  }

  try {
    const tutorial = await Tutorial.findOneAndUpdate(
      { slug: req.params.slug },
      { $set: update },
      {
        new: true,
        runValidators: true
      }
    ).lean();

    if (!tutorial) {
      return res.status(404).json({ error: "Tutorial nao encontrado." });
    }

    return res.json(tutorial);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteTutorial(req, res) {
  try {
    const tutorial = await Tutorial.findOneAndDelete({
      slug: req.params.slug
    }).lean();

    if (!tutorial) {
      return res.status(404).json({ error: "Tutorial nao encontrado." });
    }

    return res.json({
      message: "Tutorial removido com sucesso.",
      slug: req.params.slug
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createTutorial,
  listTutorials,
  getTutorial,
  updateTutorial,
  deleteTutorial
};