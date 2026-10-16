# Placar de Corrida de Rua

Frontend React + Vite para consultar os resultados de uma corrida de rua.

## Desenvolvimento local

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env` e substitua o valor de exemplo por `https://placar-corrida-rua-backend.onrender.com`.
3. Inicie o servidor local com `npm run dev`. O Vite encaminhará `/api/*` à API configurada.

Exemplo no PowerShell:

```powershell
Copy-Item .env.example .env
```

O `.env` local é ignorado pelo Git. Em produção na Vercel, as chamadas à API usam o rewrite de `vercel.json`; não dependem dessa variável para funcionar.

> Variáveis com prefixo `VITE_` são incluídas no JavaScript enviado ao navegador. O endereço da API é configuração pública; não coloque tokens, senhas ou outras credenciais nessas variáveis.

## Deploy na Vercel

O arquivo `vercel.json` encaminha `/api/*` à API Render, mantendo as chamadas do navegador no mesmo domínio do frontend e evitando a restrição CORS entre origens. Faça deploy na Vercel do commit que contém esse arquivo; não é necessário configurar `VITE_API_BASE_URL` para as requisições de produção. Essa variável serve apenas como destino do proxy local do Vite e para exibir o link público do Swagger.

## Verificações

```sh
npm run lint
npm run build
```
