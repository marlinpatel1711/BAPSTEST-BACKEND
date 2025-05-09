const express = require('express');
const router = express.Router();
const { uploadPDF, getPDF } = require('../controllers/fileController');

router.post('/upload', uploadPDF);
router.get('/getpdf', getPDF)// GET /api/file/upload

module.exports = router;
