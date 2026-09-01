import { useState } from 'react';
import { uploadDocument } from '../services/documentsApi';

export default function UploadComponent({ owner, onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!selectedFile) {
      setError('Selecione um arquivo antes de enviar.');
      return;
    }

    setIsUploading(true);

    try {
      await uploadDocument(selectedFile, owner);
      setSelectedFile(null);
      event.target.reset();
      setMessage('Documento enviado com sucesso.');
      onUploadComplete();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
      <label htmlFor="document-file">Arquivo</label>
      <input
        id="document-file"
        name="file"
        type="file"
        onChange={(event) => setSelectedFile(event.target.files[0] || null)}
      />
      <button type="submit" disabled={isUploading || !owner}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      {message && <p style={{ color: '#027a48', margin: 0 }}>{message}</p>}
      {error && <p style={{ color: '#b42318', margin: 0 }}>{error}</p>}
    </form>
  );
}