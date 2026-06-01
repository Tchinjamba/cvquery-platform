const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
    createCV,
    listCVs,
    getCV,
    updateCV,
    deleteCV,
    processCV
} = require('../controllers/cvController');

router.use(auth);

router.post('/process', processCV);

router.post('/', createCV);
router.get('/', listCVs);
router.get('/:id', getCV);
router.put('/:id', updateCV);
router.delete('/:id', deleteCV);

module.exports = router;