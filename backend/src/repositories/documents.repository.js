const path = require('node:path');

const documents = [];
const storageDirectory = process.env.STORAGE_DIRECTORY || path.resolve(__dirname, '../../storage');

function save(document) {
  documents.push(document);
  return document;
}

function findByOwner(owner) {
  return documents.filter((document) => document.owner === owner);
}

function findByIdAndOwner(id, owner) {
  return documents.find((document) => document.id === id && document.owner === owner);
}

function getFilePath(storedFilename) {
  return path.join(storageDirectory, storedFilename);
}

module.exports = {
  save,
  findByOwner,
  findByIdAndOwner,
  getFilePath,
};
