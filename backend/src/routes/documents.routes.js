const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const storageDirectory = process.env.STORAGE_DIRECTORY || path.resolve(__dirname, '../../storage');
const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024;

fs.mkdirSync(storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => {
      callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: maxUploadSize },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

module.exports = router;
