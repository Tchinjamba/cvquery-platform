const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const {
    exportPDF,
    exportJSON,
    exportHTML,
    exportLaTeX,
    exportMarkdown,
    exportText,
    exportBatch
} = require('../controllers/exportController');

// Aplicar middleware de autenticação em todas as rotas
router.use(auth);

// Rotas de exportação
router.post('/pdf', exportPDF);
router.post('/json', exportJSON);
router.post('/html', exportHTML);
router.post('/latex', exportLaTeX);
router.post('/markdown', exportMarkdown);
router.post('/text', exportText);
router.post('/batch', exportBatch);

module.exports = router;