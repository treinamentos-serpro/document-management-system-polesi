const API_BASE_URL = '/api';

async function parseResponse(response) {
  if (response.ok) {
    return response;
  }

  const fallbackMessage = 'Não foi possível concluir a operação.';

  try {
    const body = await response.json();
    throw new Error(body.error || fallbackMessage);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(fallbackMessage);
    }

    throw error;
  }
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: formData,
  });

  const parsedResponse = await parseResponse(response);
  return parsedResponse.json();
}

export async function listDocuments(owner) {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    headers: { 'X-User-Id': owner },
  });

  const parsedResponse = await parseResponse(response);
  return parsedResponse.json();
}

export async function downloadDocument(documentId, owner) {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
    headers: { 'X-User-Id': owner },
  });

  const parsedResponse = await parseResponse(response);
  return parsedResponse.blob();
}