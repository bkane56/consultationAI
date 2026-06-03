# API README

This folder contains the FastAPI backend for `consultationAI`.

## Purpose

The API is the public backend boundary between the Vercel frontend and the private Ollama model runtime.

Responsibilities:

- Validate Clerk bearer tokens
- Accept consultation input from the frontend
- Normalize and validate request data
- Build the model prompt
- Call the configured LLM provider
- Stream output back to the browser using Server-Sent Events

## Main files

```text
server.py          Main FastAPI application
render_start.py    Render startup wrapper for Uvicorn
llm_provider.py    LLM provider abstraction
index.py           Alternate or legacy API entrypoint
```

## Main routes

```text
GET  /health
POST /api/consultation
```

`/health` is used by Render to verify that the service is running.

`/api/consultation` is the authenticated streaming endpoint used by the frontend.

## Required environment variables

For deployed Ollama mode:

```text
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://consultationai:11434
OLLAMA_MODEL=llama3.2:1b
FRONTEND_ORIGINS=<comma-separated frontend origins>
CLERK_JWKS_URL=<your Clerk JWKS URL>
```

For local Ollama development:

```text
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
FRONTEND_ORIGINS=http://localhost:3000
CLERK_JWKS_URL=<your Clerk JWKS URL>
```

## Local startup

From the repo root:

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
yarn dev:api
```

Or run Uvicorn directly:

```bash
.venv/bin/python -m uvicorn api.server:app --host 127.0.0.1 --port 8000 --reload
```

## Render startup

Render should use:

```text
Dockerfile Path: Dockerfile.render-api
Docker Build Context Directory: .
Health Check Path: /health
```

The container startup should read Render's `PORT` environment variable and bind Uvicorn to `0.0.0.0`.

## Authentication behavior

Requests to `/api/consultation` must include a valid Clerk bearer token.

Invalid example:

```bash
curl -i -X POST https://consultation-api-f1vm.onrender.com/api/consultation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST" \
  -d '{"patient_name":"Synthetic Patient","date_of_visit":"2026-06-01","notes":"Synthetic notes only."}'
```

Expected result:

```text
HTTP/2 403
```

That confirms the endpoint is reachable and protected.

## CORS behavior

The frontend sends requests with:

```text
Authorization
Content-Type
```

The backend must allow the exact Vercel origins in `FRONTEND_ORIGINS`.

Example:

```text
FRONTEND_ORIGINS=https://saas-bice-iota.vercel.app,https://saas-git-main-bkane56s-projects.vercel.app
```

Do not use trailing slashes.

## Streaming behavior

The consultation route streams output using Server-Sent Events.

Frontend failures should not retry indefinitely. The frontend `fetchEventSource` error handler should abort the controller, set loading to false, show a user-friendly error, and throw the error to stop retry behavior.

## Logging guidance

Do not log raw consultation notes or full bearer tokens.

Useful logs:

- Request started
- Request completed
- Provider error type
- Timing
- HTTP status

Avoid logs containing:

- Raw clinical text
- Generated note text
- Full prompt bodies
- Full JWTs
