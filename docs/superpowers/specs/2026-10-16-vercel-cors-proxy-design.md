# Same-Origin API Proxy for Vercel

## Goal

Fix browser CORS failures when the deployed Placar frontend at `https://cronoracingrua.vercel.app` requests the results API hosted on Render, without changing the backend or weakening its CORS policy.

## Current state

- The browser currently fetches the Render API directly using `VITE_API_BASE_URL`.
- This frontend repository has no backend implementation or Vercel configuration.
- The results list and individual participant views call `/api/results` and `/api/results/:bib`.
- `VITE_API_BASE_URL` is already used to build the external Swagger documentation link.

## Design

Use a same-origin reverse proxy:

1. Add a Vercel rewrite mapping `/api/:path*` to the matching path on the Render API. The browser then calls the deployed Vercel origin, so the browser's CORS check does not apply to the server-side rewrite.
2. Change browser API requests to relative `/api/...` URLs rather than the cross-origin Render host.
3. Configure the Vite development server to proxy `/api` to `VITE_API_BASE_URL`, preserving local development behavior without browser CORS.
4. Keep `VITE_API_BASE_URL` for the Vite proxy target and Swagger link; it is public configuration, not a secret. Keep `.env` local/ignored and keep `.env.example` as a placeholder template.
5. Document that the Vercel rewrite is required for production and the Vercel project must deploy the commit containing `vercel.json`.

The alternative—adding `https://cronoracingrua.vercel.app` to the backend CORS allowlist—requires backend access and changes a separate service. A third-party CORS proxy is not acceptable because it adds an untrusted dependency and exposes API traffic.

## Scope and behavior

- Do not modify the backend or its CORS headers.
- Preserve current query parameters, response parsing, participant lookup, and the Swagger link.
- Keep the proxy path limited to `/api/*`; do not route unrelated assets or pages to the backend.
- If the backend is unavailable or returns an error, preserve the frontend's existing explicit error display.

## Validation

- Run lint and production build.
- Confirm `/api/results` and `/api/results/:bib` use same-origin relative URLs in the browser bundle.
- Verify Vite development proxy reaches the configured Render API and loads the current results at `http://localhost:5173/`.
- Inspect `vercel.json` rewrite source and destination for matching `/api` paths and ensure no credentials are present.
- Deployment validation requires a Vercel redeploy; local changes cannot modify the already deployed site's routing configuration.
