import DownloadButton from './DownloadButton';

function formatFileSize(sizeInBytes) {
  if (!sizeInBytes) {
    return '0 KB';
  }

  return `${(sizeInBytes / 1024).toFixed(1)} KB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, owner, isLoading, onRefresh }) {
  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Documentos</h2>
        <button type="button" onClick={onRefresh}>Atualizar</button>
      </div>

      {documents.length === 0 ? (
        <p>Nenhum documento enviado para este usuário.</p>
      ) : (
        <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', padding: 0 }}>
          {documents.map((document) => (
            <li
              key={document.id}
              style={{
                alignItems: 'center',
                border: '1px solid #d0d5dd',
                borderRadius: '8px',
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: '1fr auto',
                padding: '1rem',
              }}
            >
              <div>
                <strong>{document.originalName}</strong>
                <p style={{ color: '#475467', margin: '0.35rem 0 0' }}>
                  {formatFileSize(document.size)} - enviado em {formatDate(document.uploadedAt)}
                </p>
              </div>
              <DownloadButton document={document} owner={owner} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}