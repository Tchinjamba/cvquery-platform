const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const {
    exportPDF
} = require('../controllers/exportController');

router.use(auth);

router.post('/pdf', exportPDF);

module.exports = router;