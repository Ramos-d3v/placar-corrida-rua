# Plano inicial do MVP — Placar de Corrida de Rua

**Status:** proposta para aprovação antes de iniciar a implementação  
**Escopo:** frontend React/Vite existente, consumindo a API de resultados já publicada  
**Documentação da API:** [Swagger — API de Resultados](https://placar-corrida-rua-backend.onrender.com/swagger/)

## 1. Objetivo

Entregar uma primeira versão do placar público de uma corrida de rua, com:

- listas Feminino e Masculino, sem uma aba Geral;
- filtro por categoria combinada de gênero e faixa etária, como `F35-39` e `M35-39`;
- busca por nome ou número de peito;
- paginação compatível com o limite da API;
- apresentação do evento e dos tempos/posições fornecidos pela API.

As listas Feminino e Masculino filtram o mesmo conjunto de resultados. Cada lista exibe apenas participantes do gênero selecionado, sem duplicatas.

Este documento é uma proposta de MVP para revisão. Nenhuma alteração de aplicação ou chamada POST à API faz parte desta etapa.

## 2. Contexto atual do repositório

- O frontend usa React 19, Vite e Tailwind CSS 4.
- A entrada da aplicação é `src/main.jsx`; a tela inicial está em `src/App.jsx`.
- O CSS importa Tailwind em `src/index.css`.
- Ainda não há tela de placar nem cliente para a API.
- A API já oferece operações de importação e consulta; não é necessário criar backend ou banco de dados neste MVP.

## 3. Contrato da API considerado

### Consultas

| Método e rota | Uso no MVP |
|---|---|
| `GET /api/results` | Consultar evento e resultados. |
| `GET /api/results/{bibNumber}` | Consultar o detalhe de uma pessoa pelo número de peito. |

`GET /api/results` aceita:

- `page`: página, começa em 1;
- `limit`: itens por página, de 1 a 100 (padrão 50);
- `gender`: filtra pelo texto exato enviado nos resultados;
- `category`: filtra pelo nome exato da categoria;
- `search`: busca por nome ou parte do número de peito.

A resposta contém `event`, `pagination` e `results`. A listagem é ordenada pela classificação geral e número de peito. Quando não há evento importado, a API retorna uma lista vazia. O limite documentado é de 120 requisições por minuto.

### Importação para os testes

`POST /api/results` recebe `event_title`, `event_slug`, `total_results` e `results`. Cada resultado inclui, entre outros campos, `bib_number`, `athlete_name`, `category`, `status`, `gender`, `rank_general`, `rank_category`, `time_gross`, `time_net` e `team_name`.

O POST é público, não exige credenciais e **substitui integralmente o evento e os resultados atuais**. O contrato aceita até 50.000 participantes, com corpo de até 10 MB. Os exemplos deste plano não foram enviados à API. Só devem ser executados em ambiente de demonstração/staging ou quando houver autorização explícita para substituir os dados existentes.

## 4. Regras do MVP

1. **Seleção inicial:** abrir com Feminino selecionado. As listas por gênero exibem `rank_general`; uma categoria específica exibe `rank_category` quando estiver presente.
2. **Feminino/Masculino:** enviar no filtro `gender` o valor exato usado nos dados deste evento, `FEMININO` ou `MASCULINO`. A tela preserva a ordenação e a posição geral devolvidas pela API; não inventa uma posição por gênero que a API não fornece.
3. **Categorias:** o código de categoria é composto pelo prefixo de gênero (`F` ou `M`) e pela faixa etária, por exemplo `F35-39` ou `M35-39`. Para este evento, as faixas são `15-19`, `20-24`, `25-29`, `30-34`, `35-39`, `40-44`, `45-49`, `50-54`, `55-59`, `60-64` e `65+`. Enviar o código completo no parâmetro exato `category`; o frontend não calcula idade.
4. **Posição por faixa:** exibir `rank_category` quando estiver presente; não recalcular posições localmente, porque a resposta é paginada e o contrato não fornece idade ou os dados completos de todos os participantes em cada página.
5. **Filtros combinados:** selecionar uma categoria define o gênero correspondente e envia `category` com o código exato (`F...` ou `M...`) e `gender` com o valor exato (`FEMININO` ou `MASCULINO`). Selecionar uma aba de gênero limpa a categoria específica. Busca continua combinável com ambos.
6. **Busca:** pesquisar por nome ou parte do número de peito com o parâmetro `search`; executar a consulta ao enviar o formulário/pressionar Enter, não a cada tecla. Ao aplicar uma busca ou mudar filtros, voltar à página 1.
7. **Detalhe:** permitir abrir o resultado individual usando `GET /api/results/{bibNumber}`. A navegação pode ser mantida simples no MVP, sem adicionar uma biblioteca de rotas.
8. **Dados:** usar apenas a resposta da API como fonte do placar. Não manter cópia persistente no navegador nem fabricar registros quando a consulta falhar.

### Limite importante sobre ranking

O contrato possui `rank_general` e um único `rank_category`; não possui uma posição separada por gênero. A tela apresentará os valores realmente enviados pela API. Para obter uma classificação de faixa etária separada por gênero, o sistema de cronometragem deverá enviar uma categoria combinada, como `F35-39`. O frontend usa esses códigos exatos e apresenta os rankings disponíveis sem recalculá-los.

## 5. Experiência e escopo funcional

### Tela do placar

- Cabeçalho com título do evento e total de resultados, quando disponíveis.
- Controles apenas para Feminino e Masculino; Feminino é selecionado inicialmente.
- Filtro de categoria combinada, com opções como “Feminino · 35–39 anos” e “Masculino · 35–39 anos”; a opção “Todas as categorias” remove o filtro.
- Campo de busca por nome/número de peito.
- Tabela de resultados com posição, número de peito, atleta, gênero, categoria, tempo e equipe; valores opcionais ausentes não devem ser substituídos por dados inventados.
- Paginação usando os valores de `pagination` recebidos da API, respeitando no máximo 100 itens por requisição.
- Ação para abrir o resultado individual da pessoa selecionada.
- Layout responsivo e estados visíveis de carregamento, erro, nenhum resultado e ausência de evento.

### Fora do MVP

- Criar ou alterar backend, banco de dados, contrato da API ou autenticação.
- Importação de dados pela interface pública.
- Execução automática de POST, reset ou carga de demonstração.
- Cálculo de idade, rankings ou categorias que não estejam nos dados da API.
- Painel administrativo, autenticação, gestão de múltiplos eventos e recursos não necessários para validar o placar.

## 6. Plano de implementação

### Etapa 1 — Cliente e configuração da API

- Criar um módulo de acesso HTTP reutilizável para a API.
- Configurar a origem via variável `VITE_API_BASE_URL`, com valor de desenvolvimento/documentação claramente definido e sem credenciais no frontend.
- Implementar as chamadas de listagem e busca por número de peito com parâmetros codificados corretamente.
- Tratar respostas HTTP não bem-sucedidas como erro explícito; não exibir lista vazia como se fosse sucesso.

### Etapa 2 — Estado de filtros e consultas

- Manter estado da aba (Feminino/Masculino), categoria, texto de busca e página.
- Construir `GET /api/results` com os filtros ativos e `limit` até 100.
- Executar a busca somente no envio do formulário/Enter para evitar uma requisição a cada tecla e respeitar o limite da API.
- Reiniciar a página para 1 sempre que busca, gênero ou categoria mudar.
- Evitar que uma resposta antiga sobrescreva os resultados de uma consulta mais recente.

### Etapa 3 — Placar e detalhe

- Implementar cabeçalho do evento, tabela/lista responsiva e navegação de páginas.
- Exibir `rank_general` nas listas por gênero e posição de categoria quando `rank_category` estiver disponível.
- Implementar a consulta individual por número de peito e estados de carregamento, erro e não encontrado.
- Usar classes Tailwind e os padrões já presentes no projeto; não introduzir dependências de UI ou roteamento sem necessidade.

### Etapa 4 — Validação

- Executar lint e build do frontend.
- Validar manualmente os cenários de aceitação abaixo contra uma carga de demonstração autorizada.
- Não executar `POST /api/results/reset` no ambiente compartilhado.

## 7. Critérios de aceitação

- A tela inicial consulta `GET /api/results` e apresenta evento, resultados e paginação.
- Feminino e Masculino enviam o filtro esperado e não mostram duplicatas dentro da própria lista.
- As cinco faixas etárias usam exatamente os valores definidos no campo `category`.
- Busca por nome e por parte do número de peito, ao ser enviada, atualiza os resultados e reinicia a paginação sem consultar a API a cada tecla.
- Mudanças de filtro não deixam uma resposta anterior substituir os dados atuais da tela.
- `rank_general` e `rank_category` são apresentados conforme a lista/valor fornecido pela API, sem cálculo enganoso no cliente.
- Estados de carregamento, lista vazia, ausência de evento, erro HTTP e participante não encontrado são distinguíveis.
- A interface permanece utilizável em telas estreitas.
- Lint e build terminam sem erros.

## 8. Testes manuais da API e do frontend

### Atenção antes de qualquer POST

**Não execute o exemplo contra dados compartilhados/produção sem autorização:** `POST /api/results` apaga/substitui integralmente o evento atual. Os comandos abaixo são apenas uma fixture opcional para ambiente isolado. Não execute `POST /api/results/reset`.

### Fixture opcional para ambiente de demonstração

No PowerShell, o objeto abaixo pode ser enviado como uma única importação para fornecer participantes em todas as faixas e nos dois gêneros. `total_results` corresponde à quantidade de itens. Use somente se a substituição dos resultados no endpoint selecionado for intencional:

```powershell
$payload = @{
  event_title = "Corrida de Demonstração — MVP"
  event_slug = "corrida-demonstracao-mvp"
  total_results = 10
  results = @(
    @{ bib_number = "1001"; athlete_name = "Ana Silva";      category = "F15-19"; status = "Concluído"; gender = "FEMININO";  rank_general = 1;  rank_category = 1; time_gross = "00:24:12.100"; time_net = "00:24:10.000"; team_name = "Equipe Horizonte" }
    @{ bib_number = "1002"; athlete_name = "Bruno Costa";    category = "M15-19"; status = "Concluído"; gender = "MASCULINO"; rank_general = 2;  rank_category = 2; time_gross = "00:25:03.200"; time_net = "00:25:01.000"; team_name = "Corre Mais" }
    @{ bib_number = "1003"; athlete_name = "Carla Souza";    category = "F20-24"; status = "Concluído"; gender = "FEMININO";  rank_general = 3;  rank_category = 1; time_gross = "00:26:14.300"; time_net = "00:26:12.000"; team_name = "Equipe Horizonte" }
    @{ bib_number = "1004"; athlete_name = "Diego Lima";     category = "M20-24"; status = "Concluído"; gender = "MASCULINO"; rank_general = 4;  rank_category = 2; time_gross = "00:27:05.400"; time_net = "00:27:03.000"; team_name = "Pés na Rua" }
    @{ bib_number = "1005"; athlete_name = "Elisa Rocha";    category = "F25-29"; status = "Concluído"; gender = "FEMININO";  rank_general = 5;  rank_category = 1; time_gross = "00:28:16.500"; time_net = "00:28:14.000"; team_name = "Corre Mais" }
    @{ bib_number = "1006"; athlete_name = "Fabio Mendes";   category = "M25-29"; status = "Concluído"; gender = "MASCULINO"; rank_general = 6;  rank_category = 2; time_gross = "00:29:07.600"; time_net = "00:29:05.000"; team_name = "Pés na Rua" }
    @{ bib_number = "1007"; athlete_name = "Gabriela Alves"; category = "F30-34"; status = "Concluído"; gender = "FEMININO";  rank_general = 7;  rank_category = 1; time_gross = "00:30:18.700"; time_net = "00:30:16.000"; team_name = "Equipe Horizonte" }
    @{ bib_number = "1008"; athlete_name = "Hugo Reis";      category = "M30-34"; status = "Concluído"; gender = "MASCULINO"; rank_general = 8;  rank_category = 2; time_gross = "00:31:09.800"; time_net = "00:31:07.000"; team_name = "Corre Mais" }
    @{ bib_number = "1009"; athlete_name = "Iara Nunes";     category = "F35-39"; status = "Concluído"; gender = "FEMININO";  rank_general = 9;  rank_category = 1; time_gross = "00:32:20.900"; time_net = "00:32:18.000"; team_name = "Pés na Rua" }
    @{ bib_number = "1010"; athlete_name = "Joao Pedro";     category = "M35-39"; status = "Concluído"; gender = "MASCULINO"; rank_general = 10; rank_category = 2; time_gross = "00:33:11.000"; time_net = "00:33:09.000"; team_name = "Corre Mais" }
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "https://placar-corrida-rua-backend.onrender.com/api/results" `
  -Method Post `
  -ContentType "application/json" `
  -Body $payload
```

### Consultas para conferir a API

Execute os GETs abaixo somente após ter um evento de teste autorizado:

```powershell
$base = "https://placar-corrida-rua-backend.onrender.com/api/results"

# Feminino: primeira página, 10 resultados
Invoke-RestMethod -Uri "$base?page=1&limit=10&gender=FEMININO"

# Masculino, categoria 25-29
Invoke-RestMethod -Uri "$base?page=1&limit=10&gender=MASCULINO&category=M25-29"

# Busca pelo nome
Invoke-RestMethod -Uri "$base?page=1&limit=10&search=Ana"

# Busca pelo número de peito
Invoke-RestMethod -Uri "$base/1001"
```

### Roteiro de validação no frontend

1. Abrir a aplicação e confirmar evento, total e primeira página.
2. Alternar entre Feminino e Masculino; confirmar que a consulta muda e que cada lista contém apenas participantes do gênero selecionado.
3. Selecionar categorias Feminino/Masculino e confirmar que o filtro usa os códigos exatos, como `F35-39` e `M35-39`.
4. Combinar categoria e busca; confirmar que a página volta para 1.
5. Avançar e voltar páginas; confirmar que o estado de paginação acompanha a resposta da API.
6. Enviar buscas por nome e número de peito; abrir um participante e conferir a consulta individual.
7. Conferir estado sem resultados, API indisponível e número não encontrado.
8. Repetir em viewport estreito e validar navegação e leitura da tabela.

## 9. Riscos e decisões para aprovação

- **Substituição de dados pelo POST:** a importação não é incremental. Testar apenas com autorização e dados descartáveis.
- **Categorias textuais:** o filtro depende de o importador enviar exatamente os códigos de categoria combinados, como `F35-39` e `M35-39`. Diferenças de grafia resultam em resultados ausentes.
- **Ranking por gênero/faixa combinados:** não há campo de posição específico por gênero no contrato atual. O MVP mostra posições fornecidas e não recalcula classificações incompletas.
- **Endpoint público:** a interface será somente de consulta; não expor importação nem reset ao usuário final.
- **Limites e desempenho:** sempre paginar e nunca solicitar mais que 100 resultados por chamada.

## 10. Aprovação solicitada

Revisar e aprovar este escopo antes de iniciar alterações no frontend. Em especial, confirmar:

- as faixas e códigos de categoria do evento, no formato `F35-39`/`M35-39`;
- os valores `Feminino` e `Masculino` enviados no campo `gender`;
- o uso de rankings exatamente como fornecidos pela API;
- que não há uma aba Geral e que Feminino é selecionado inicialmente;
- o uso do POST de demonstração apenas em ambiente isolado e com autorização para substituir os dados.