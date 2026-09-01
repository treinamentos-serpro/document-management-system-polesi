const fs = require('node:fs');
const documentsService = require('../services/documents.service');

function uploadDocument(req, res, next) {
  try {
    const owner = getOwner(req);

    if (!owner) {
      return res.status(400).json({ error: 'Cabeçalho X-User-Id é obrigatório.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório.' });
    }

    const document = documentsService.createDocument(req.file, owner);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function listDocuments(req, res, next) {
  try {
    const owner = getOwner(req);

    if (!owner) {
      return res.status(400).json({ error: 'Cabeçalho X-User-Id é obrigatório.' });
    }

    return res.json(documentsService.listDocuments(owner));
  } catch (error) {
    return next(error);
  }
}

function downloadDocument(req, res, next) {
  try {
    const owner = getOwner(req);

    if (!owner) {
      return res.status(400).json({ error: 'Cabeçalho X-User-Id é obrigatório.' });
    }

    const document = documentsService.findDocumentForDownload(req.params.id, owner);

    if (!document || !fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    return res.download(document.filePath, document.originalName, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

function getOwner(req) {
  const owner = req.get('X-User-Id');
  return owner && owner.trim();
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
