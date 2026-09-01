import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/documentsApi';

export default function App() {
  const [owner, setOwner] = useState('usuario-demo');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadDocuments() {
    if (!owner.trim()) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const loadedDocuments = await listDocuments(owner.trim());
      setDocuments(loadedDocuments);
    } catch (listError) {
      setError(listError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [owner]);

  return (
    <main style={{ display: 'grid', fontFamily: 'system-ui, sans-serif', gap: '2rem', padding: '2rem' }}>
      <header>
        <h1>Document Management System</h1>
        <p>Envie, liste e baixe documentos vinculados ao usuário informado.</p>
      </header>

      <section style={{ display: 'grid', gap: '0.75rem', maxWidth: '28rem' }}>
        <label htmlFor="owner">Usuário</label>
        <input
          id="owner"
          type="text"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="Informe o identificador do usuário"
        />
      </section>

      <UploadComponent owner={owner.trim()} onUploadComplete={loadDocuments} />

      {error && <p style={{ color: '#b42318', margin: 0 }}>{error}</p>}

      <DocumentList
        documents={documents}
        owner={owner.trim()}
        isLoading={isLoading}
        onRefresh={loadDocuments}
      />
    </main>
  );
}
