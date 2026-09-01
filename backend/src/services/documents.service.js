const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

function createDocument(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedFilename: file.filename,
  };

  return toPublicDocument(documentsRepository.save(document));
}

function listDocuments(owner) {
  return documentsRepository.findByOwner(owner).map(toPublicDocument);
}

function findDocumentForDownload(id, owner) {
  const document = documentsRepository.findByIdAndOwner(id, owner);

  if (!document) {
    return null;
  }

  return {
    originalName: document.originalName,
    filePath: documentsRepository.getFilePath(document.storedFilename),
  };
}

function toPublicDocument(document) {
  const { storedFilename, ...publicDocument } = document;
  return publicDocument;
}

module.exports = {
  createDocument,
  listDocuments,
  findDocumentForDownload,
};
