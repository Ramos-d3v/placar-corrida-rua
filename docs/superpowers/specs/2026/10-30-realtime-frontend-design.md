# Integração realtime do placar no frontend

## Objetivo

Conectar o frontend publicado em `https://cronoracingrua.vercel.app/` ao
Socket.IO do backend em
`https://placar-corrida-rua-backend.onrender.com`, mantendo a consulta HTTP
atual como carregamento inicial e fonte de dados.

## Decisões

- Usar `socket.io-client`; WebSocket nativo não é compatível com o servidor.
- Conectar diretamente à origem do backend configurada em
  `VITE_REALTIME_URL` (fallback para `VITE_API_BASE_URL`), removendo barras
  finais. A API REST continuará usando as URLs relativas e o proxy/rewrite
  existente.
- Configurar o evento com `VITE_EVENT_SLUG`, usando
  `corrida-demonstracao-mvp` como valor documentado.
- Usar o namespace padrão, o caminho padrão `/socket.io` e o transporte
  `websocket`.
- Assinar o evento `subscribe` somente na tela de listagem, enviando
  `{ event_slug: 'corrida-demonstracao-mvp' }`. A confirmação positiva do
  callback de inscrição permite manter os listeners ativos. O callback é
  tratado de forma tolerante (`{ ok: true }`, `true` ou resposta equivalente);
  qualquer resposta negativa, timeout ou formato inesperado é registrado como
  erro sem apagar dados HTTP.
- Os payloads de `results.snapshot`, `results.pending`, `results.updated` e
  `results.reset` são apenas notificações; o frontend não depende da estrutura
  deles e sempre obtém os dados oficiais por REST. Payloads malformados são
  ignorados com erro explícito no console.
- Ao receber `results.updated` ou `results.reset`, refazer a consulta atual,
  preservando filtros e paginação.
- Ao receber `results.pending`, manter os resultados atuais e permitir que a
  consulta HTTP determine se há dados. Eventos sem payload esperado não devem
  quebrar a tela.
- Socket.IO deve usar a reconexão padrão. Depois de cada `connect`, a
  inscrição deve ser refeita. Desconexão, erro de transporte ou falha de
  inscrição não bloqueiam o carregamento HTTP nem exibem uma lista vazia.
- Cada atualização dispara no máximo um refresh pendente. Se chegarem vários
  eventos durante uma consulta, o próximo refresh é mantido para executar
  depois que a consulta terminar. Cada consulta captura os filtros atuais e
  respostas antigas são canceladas/impedidas de sobrescrever a mais recente.
- Não substituir dados válidos por um estado vazio quando o Socket.IO falhar;
  a conexão realtime é complementar à consulta HTTP.
- Remover a conexão e os listeners no cleanup do componente.
- O detalhe do participante não abre uma assinatura própria; ele continua
  sendo carregado somente por REST.

## Alterações esperadas

1. Adicionar `socket.io-client` às dependências.
2. Criar um pequeno cliente/hook de realtime para encapsular conexão,
   inscrição e eventos.
3. Integrar o refresh na tela existente sem alterar o contrato REST.
4. Atualizar `.env.example` e o README com `VITE_REALTIME_URL`,
   `VITE_EVENT_SLUG`, os valores local/produção e a necessidade de permitir a
   origem `https://cronoracingrua.vercel.app` no CORS do backend.

Valores documentados:

- local: `VITE_REALTIME_URL=http://localhost:3001`;
- produção: `VITE_REALTIME_URL=https://placar-corrida-rua-backend.onrender.com`;
- ambos: `VITE_EVENT_SLUG=corrida-demonstracao-mvp`.

Se `VITE_REALTIME_URL` estiver ausente, o cliente usa
`VITE_API_BASE_URL`; se ambas estiverem ausentes ou a URL for inválida, o
realtime é desabilitado e a consulta REST continua funcionando. A ausência de
`VITE_EVENT_SLUG` usa o fallback documentado.

## Validação

- `npm run lint`
- `npm run build`
- Testes automatizados do cliente devem cobrir inscrição inicial, reinscrição
  após reconexão, refresh em `results.updated`/`results.reset`, cleanup e
  fallback HTTP quando a conexão está indisponível.
- Confirmar que a aplicação continua carregando resultados via HTTP quando a
  conexão realtime está indisponível e que um refresh HTTP com erro preserva o
  erro/estado já adotado pela tela.

## Critérios de aceitação

1. Em produção, o navegador abre a conexão Socket.IO no backend Render,
   assina `corrida-demonstracao-mvp` e não tenta usar `ws://` manualmente.
2. Uma atualização publicada pelo backend refaz a consulta com os filtros
   visíveis; um reset também refaz a consulta e, se a página deixar de existir,
   a resposta HTTP pode levar a tela ao estado vazio sem inventar resultados.
3. Recarregar a página ou desmontar a tela não deixa listeners ou conexões
   duplicadas.
4. Sem Socket.IO, a listagem REST continua funcionando e nenhum dado válido é
   apagado por causa da falha realtime.
5. Eventos repetidos não geram consultas concorrentes ilimitadas; uma consulta
   em andamento tem precedência e uma atualização posterior é processada.
