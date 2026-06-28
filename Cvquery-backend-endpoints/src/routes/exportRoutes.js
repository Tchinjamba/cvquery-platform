const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { exportHTML, exportPDF, exportDOCX, exportLaTeX } = require('../controllers/exportController');

router.use(auth);

router.post('/html',  exportHTML);
router.post('/pdf',   exportPDF);
router.post('/docx',  exportDOCX);
router.post('/latex', exportLaTeX);

module.exports = router;
