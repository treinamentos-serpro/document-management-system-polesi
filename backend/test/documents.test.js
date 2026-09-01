const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let baseUrl;
let storageFilesBeforeTest;

before(async () => {
  const storageDirectory = path.resolve(__dirname, '../storage');
  storageFilesBeforeTest = new Set(await fs.readdir(storageDirectory));

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  const storageDirectory = path.resolve(__dirname, '../storage');
  const storageFilesAfterTest = await fs.readdir(storageDirectory);
  await Promise.all(
    storageFilesAfterTest
      .filter((filename) => !storageFilesBeforeTest.has(filename))
      .map((filename) => fs.unlink(path.join(storageDirectory, filename))),
  );
});

test('envia, lista e baixa documento somente para seu proprietário', async () => {
  const owner = `owner-${randomUUID()}`;
  const otherOwner = `owner-${randomUUID()}`;
  const form = new FormData();
  form.append('file', new Blob(['conteúdo do documento'], { type: 'text/plain' }), 'nota.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });

  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'nota.txt');
  assert.equal(document.owner, owner);
  assert.equal(typeof document.id, 'string');
  assert.equal(document.storedFilename, undefined);

  const documentsResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': owner },
  });
  assert.equal(documentsResponse.status, 200);
  assert.deepEqual(await documentsResponse.json(), [document]);

  const inaccessibleResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': otherOwner },
  });
  assert.equal(inaccessibleResponse.status, 404);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': owner },
  });
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment; filename="nota.txt"/);
  assert.equal(await downloadResponse.text(), 'conteúdo do documento');
});

test('rejeita upload sem identificação do proprietário', async () => {
  const form = new FormData();
  form.append('file', new Blob(['conteúdo'], { type: 'text/plain' }), 'nota.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Cabeçalho X-User-Id é obrigatório.',
  });
});
