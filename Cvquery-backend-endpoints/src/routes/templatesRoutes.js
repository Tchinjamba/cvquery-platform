const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
    createTemplate,
    listTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate
} = require('../controllers/templatesController');

router.use(auth);

router.post('/', createTemplate);
router.get('/', listTemplates);
router.get('/:id', getTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

module.exports = router;