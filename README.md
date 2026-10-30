# Placar de Corrida de Rua

Frontend React + Vite para consultar os resultados de uma corrida de rua.

## Desenvolvimento local

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env` e configure:
   - `VITE_API_BASE_URL=https://placar-corrida-rua-backend.onrender.com` para o proxy REST local;
   - `VITE_REALTIME_URL=http://localhost:3001` para o Socket.IO local;
   - `VITE_EVENT_SLUG=corrida` para o evento assinado.
3. Inicie o servidor local com `npm run dev`. O Vite encaminhará `/api/*` à API configurada.

Exemplo no PowerShell:

```powershell
Copy-Item .env.example .env
```

O `.env` local é ignorado pelo Git. Em produção na Vercel, as chamadas à API usam o rewrite de `vercel.json`; não dependem dessa variável para funcionar.

> Variáveis com prefixo `VITE_` são incluídas no JavaScript enviado ao navegador. O endereço da API é configuração pública; não coloque tokens, senhas ou outras credenciais nessas variáveis.

## Deploy na Vercel

O arquivo `vercel.json` encaminha `/api/*` à API Render, mantendo as chamadas REST do navegador no mesmo domínio do frontend e evitando a restrição CORS entre origens. O Socket.IO realtime conecta diretamente ao backend; na Vercel, configure `VITE_REALTIME_URL=https://placar-corrida-rua-backend.onrender.com` e `VITE_EVENT_SLUG=corrida` nos ambientes Production e Preview. O backend deve permitir no CORS do Socket.IO as origens `https://cronoracingrua.vercel.app` e `http://localhost:5173`.

Se `VITE_REALTIME_URL` estiver ausente ou inválida, o frontend usa o backend Render padrão; a consulta REST continua funcionando mesmo quando o realtime estiver indisponível.

## Verificações

```sh
npm run lint
npm run build
```
