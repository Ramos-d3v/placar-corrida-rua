# API Configuration and Code Review Design

## Goal

Review the tracked application code and its configuration for correctness, security, accessibility, maintainability, and operational concerns. Move the runtime API base URL out of application source into a local environment file without suggesting that a browser-exposed value is secret.

## Findings already established

- The API base URL is hard-coded as a fallback in `src/services/resultsApi.js`, and is also in `.env.example`.
- No API keys or credentials were found in the inspected tracked source and configuration.
- The frontend uses Vite. Values prefixed with `VITE_` are exposed to browser code and must be treated as public.
- `.gitignore` already excludes `.env` and `.env.*`, while allowing `.env.example`.
- `@neon/config` and `@neon/env` are direct dependencies with no imports in application source; confirm and report this during the audit rather than remove unrelated dependencies.

## Configuration design

- Keep the existing `VITE_API_BASE_URL` interface and direct browser-to-API requests.
- Store the current API base URL in a root `.env` file for local development; do not add that file to Git.
- Make `.env.example` a safe template with a placeholder URL and document how to copy it to `.env`.
- Remove the production URL fallback from application source. If configuration is missing, surface a clear API configuration error rather than sending a malformed request.
- Build the Swagger link from the configured base URL and avoid rendering a broken link when configuration is absent.
- Document that the API URL is public configuration, not a credential. A server-side proxy is out of scope because the user confirmed the host is public.

## Audit scope and reporting

Inspect tracked application files, API request/response handling, routing, responsive/accessibility styles, dependency manifests, build/lint configuration, and project documentation. Exclude generated directories and do not read the contents of local environment files. Report findings with severity, location, evidence, and suggested action. Fix only the API configuration changes above; keep unrelated findings as recommendations.

## Validation

- Run `npm run lint` and `npm run build`.
- Verify the root `.env` remains ignored and is not staged.
- Verify application source no longer contains a hard-coded API base URL and that missing configuration produces an explicit user-visible error.
- Recheck `http://localhost:5173/` with the configured environment and confirm results still load.
