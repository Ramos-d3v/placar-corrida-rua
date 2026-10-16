# Placar de Corrida de Rua

Frontend React + Vite para consultar os resultados de uma corrida de rua.

## Desenvolvimento local

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env` e defina o endereço base da API em `VITE_API_BASE_URL`.
3. Inicie o servidor local com `npm run dev`.

Exemplo no PowerShell:

```powershell
Copy-Item .env.example .env
```

O `.env` local é ignorado pelo Git. Para outros ambientes, configure `VITE_API_BASE_URL` na configuração de build/deploy e gere novamente os arquivos estáticos.

> Variáveis com prefixo `VITE_` são incluídas no JavaScript enviado ao navegador. O endereço da API é configuração pública; não coloque tokens, senhas ou outras credenciais nessas variáveis.

## Verificações

```sh
npm run lint
npm run build
```
