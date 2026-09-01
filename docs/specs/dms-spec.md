# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus próprios documentos, com arquivos armazenados localmente e metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um arquivo por requisição.
- Armazenamento do arquivo no filesystem local em `backend/storage`.
- Criação de metadados em memória para cada arquivo enviado.
- Listagem dos documentos pertencentes ao usuário solicitante.
- Download de um documento pelo seu identificador, somente pelo proprietário.
- Identificação simples do usuário pelo header HTTP `X-User-Id`.
- Interface React para enviar, listar e baixar documentos por meio do prefixo `/api`.

### Fora do escopo

- Autenticação, sessão, cadastro ou gestão de credenciais de usuários.
- Banco de dados ou persistência dos metadados após reiniciar a aplicação.
- Armazenamento externo, em nuvem ou serviços de upload de terceiros.
- Versionamento, exclusão, atualização ou compartilhamento de documentos.
- Busca, paginação, classificação, tags ou pré-visualização de arquivos.
- Antivírus, análise de conteúdo ou restrição por tipo MIME nesta fase.
- Interface administrativa e gestão de permissões além da propriedade simples.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o upload de exatamente um arquivo no campo multipart `file`, desde que o header `X-User-Id` esteja presente e o arquivo tenha no máximo 10 MB. |
| RF-02 | Ao concluir um upload válido, o sistema deve gravar o arquivo em `backend/storage` e criar seus metadados em memória, associados ao valor de `X-User-Id`. |
| RF-03 | O sistema deve gerar um identificador único para cada documento com `crypto.randomUUID()` e registrar a data/hora do upload em formato ISO 8601. |
| RF-04 | O sistema deve listar somente os metadados dos documentos cujo `owner` corresponda ao valor de `X-User-Id` da requisição. |
| RF-05 | O sistema deve disponibilizar o conteúdo binário de um documento quando o identificador existir e o solicitante for seu proprietário. |
| RF-06 | O sistema não deve expor o caminho físico nem o nome interno do arquivo nas respostas de metadados. |
| RF-07 | O frontend deve consumir a API pelo prefixo `/api` e permitir upload, listagem e download para o usuário identificado no cliente. |

### Critérios de aceite

| Fluxo | Critério |
| --- | --- |
| Upload válido | Com `X-User-Id` e um arquivo de até 10 MB no campo `file`, retorna `201` com os metadados criados e o arquivo é salvo localmente. |
| Upload inválido | Sem `X-User-Id`, sem arquivo ou com arquivo maior que 10 MB, retorna um erro JSON sem criar metadados. |
| Listagem | Com `X-User-Id`, retorna `200` e somente documentos do proprietário; para usuário sem documentos, retorna uma lista vazia. |
| Download válido | Com proprietário e ID existente, retorna `200` com o arquivo e um cabeçalho de anexo com o nome original. |
| Download inacessível | Para ID inexistente ou documento de outro proprietário, retorna `404` sem revelar sua existência. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js, Express e JavaScript CommonJS; o frontend deve usar React, Vite e módulos ESM. |
| RNF-02 | Os arquivos devem ser gravados exclusivamente no filesystem local por `multer` com `diskStorage`, no diretório configurável `backend/storage`. |
| RNF-03 | Os metadados devem permanecer somente em memória nesta fase e podem ser perdidos quando a aplicação for reiniciada. |
| RNF-04 | A configuração de porta, diretório de armazenamento e limite de upload deve ser feita por variáveis de ambiente, com valores padrão documentados. |
| RNF-05 | O backend deve manter o fluxo de dependências `routes -> controllers -> services -> repositories`; camadas internas não podem depender de Express ou de rotas. |
| RNF-06 | Todos os erros esperados da API devem retornar JSON no formato `{ "error": "mensagem" }`. |
| RNF-07 | Os testes de backend devem usar o runner nativo `node:test` e cobrir os fluxos de sucesso e erro dos endpoints. |
| RNF-08 | O sistema deve tratar erros de leitura e escrita de arquivos nos limites HTTP e não expor caminhos internos do servidor. |

## 5. Modelo de dados (metadados do documento)

### Entidade `Document`

| Campo | Tipo | Persistência | Descrição |
| --- | --- | --- | --- |
| `id` | string | Em memória | Identificador único UUID do documento. |
| `originalName` | string | Em memória | Nome original informado pelo arquivo enviado. |
| `size` | number | Em memória | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Em memória | Data e hora de criação em ISO 8601. |
| `owner` | string | Em memória | Identificador simples do proprietário, recebido de `X-User-Id`. |
| `storedFilename` | string | Em memória, interno | Nome gerado pelo `multer` para localizar o arquivo; nunca é retornado pela API. |

A representação pública de um documento contém somente `id`, `originalName`, `size`, `uploadedAt` e `owner`.

Exemplo de metadados públicos:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-01T10:30:00.000Z",
  "owner": "usuario-123"
}
```

## 6. Contratos de API

### Convenções comuns

- O prefixo externo do frontend é `/api`; o proxy do Vite encaminha as requisições ao backend.
- `X-User-Id` é obrigatório nos três endpoints e deve conter um valor não vazio.
- Os erros usam `Content-Type: application/json` e corpo `{ "error": "mensagem" }`.
- A ausência ou valor vazio de `X-User-Id` retorna `400` com `{ "error": "Cabeçalho X-User-Id é obrigatório." }`.
- Falhas inesperadas retornam `500` com `{ "error": "Erro interno do servidor." }`, sem detalhes internos.

### POST /upload

Envia um documento e cria seus metadados.

**Requisição**

- Header obrigatório: `X-User-Id: <identificador-do-usuario>`.
- Content-Type: `multipart/form-data`.
- Campo obrigatório: `file`, contendo um único arquivo.
- Tipos de arquivo: sem restrição nesta fase.
- Tamanho máximo: 10 MB.

**Resposta de sucesso: `201 Created`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-01T10:30:00.000Z",
  "owner": "usuario-123"
}
```

**Erros esperados**

| Status | Condição | Corpo |
| --- | --- | --- |
| `400` | `X-User-Id` ausente/vazio ou campo `file` ausente | `{ "error": "Cabeçalho X-User-Id é obrigatório." }` ou `{ "error": "Arquivo é obrigatório." }` |
| `413` | Arquivo maior que 10 MB | `{ "error": "Arquivo excede o tamanho máximo de 10 MB." }` |
| `500` | Falha ao gravar arquivo ou criar metadados | `{ "error": "Erro interno do servidor." }` |

### GET /documents

Lista os metadados dos documentos do usuário solicitante.

**Requisição**

- Header obrigatório: `X-User-Id: <identificador-do-usuario>`.
- Não recebe parâmetros de rota, consulta ou corpo nesta fase.

**Resposta de sucesso: `200 OK`**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-09-01T10:30:00.000Z",
    "owner": "usuario-123"
  }
]
```

Quando não houver documentos do proprietário, a resposta deve ser `[]`.

**Erros esperados**

| Status | Condição | Corpo |
| --- | --- | --- |
| `400` | `X-User-Id` ausente ou vazio | `{ "error": "Cabeçalho X-User-Id é obrigatório." }` |
| `500` | Falha inesperada ao consultar metadados | `{ "error": "Erro interno do servidor." }` |

### GET /documents/:id/download

Baixa o arquivo de um documento pertencente ao usuário solicitante.

**Requisição**

- Header obrigatório: `X-User-Id: <identificador-do-usuario>`.
- Parâmetro obrigatório: `id`, UUID do documento.

**Resposta de sucesso: `200 OK`**

- Corpo: conteúdo binário do arquivo.
- Cabeçalho `Content-Disposition`: `attachment; filename="<originalName>"`.
- O `Content-Type` deve corresponder ao tipo identificado pelo arquivo, quando disponível.

**Erros esperados**

| Status | Condição | Corpo |
| --- | --- | --- |
| `400` | `X-User-Id` ausente ou vazio | `{ "error": "Cabeçalho X-User-Id é obrigatório." }` |
| `404` | Documento inexistente, sem propriedade do solicitante ou arquivo local ausente | `{ "error": "Documento não encontrado." }` |
| `500` | Falha inesperada na leitura do arquivo | `{ "error": "Erro interno do servidor." }` |

## 7. Decisões arquiteturais

### Backend

O backend seguirá Clean Architecture simples, com dependências dirigidas das camadas externas para as internas:

```text
routes -> controllers -> services -> repositories
```

| Camada | Responsabilidades |
| --- | --- |
| `routes/` | Declara os endpoints, aplica o middleware `multer` ao upload e delega ao controller apropriado. |
| `controllers/` | Lê parâmetros, headers e arquivo processado; valida entradas HTTP básicas; transforma resultados e erros em respostas HTTP. |
| `services/` | Gera IDs e data de upload, aplica regra de propriedade, monta metadados públicos e coordena operações de documento. |
| `repositories/` | Mantém metadados em memória e fornece acesso ao arquivo armazenado localmente, sem conhecer HTTP. |

O `multer` usa `diskStorage` para gravar em `backend/storage`. A rota é responsável por sua integração com Express; serviços e repositórios não dependem de objetos `req` ou `res`.

### Frontend

O frontend futuro usará componentes funcionais React organizados em `components/`, `pages/` e `services/`. O serviço de API usará `fetch` com URLs iniciadas por `/api`, enviará `X-User-Id` e tratará erros retornados no contrato da API. Os componentes previstos são uma área de upload, uma lista de documentos e uma ação de download.

### Segurança e limites do MVP

`X-User-Id` oferece somente separação funcional de dados e não substitui autenticação. A política de `404` para documentos de outros usuários evita revelar se um ID pertence a outro proprietário. O nome físico gerado pelo `multer` e caminhos internos não fazem parte da API pública.

## 8. Plano de execução

As etapas abaixo são futuras. A entrega atual consiste exclusivamente nesta especificação e não inclui implementação de arquivos de backend, frontend ou testes.

1. Configurar as variáveis de ambiente para porta, diretório de armazenamento e limite de upload, mantendo valores padrão adequados ao desenvolvimento local.
2. Implementar o repositório de documentos para armazenar e consultar metadados em memória e localizar arquivos no diretório local.
3. Implementar o serviço de documentos com geração de UUID, data ISO 8601, projeção pública de metadados e verificação de propriedade.
4. Implementar controllers e rotas Express para upload, listagem e download, integrando `multer.diskStorage` na rota de upload e o tratamento uniforme de erros.
5. Registrar o roteador no aplicativo Express e preservar o endpoint de saúde existente.
6. Implementar no frontend os componentes e o serviço `fetch` para upload, listagem e download pelo prefixo `/api`.
7. Criar testes de backend com `node:test` para os casos de sucesso, validações, isolamento por proprietário, arquivo ausente e erros de limite de tamanho.
8. Executar testes, validar manualmente o fluxo completo e atualizar a documentação operacional quando a implementação estiver concluída.
