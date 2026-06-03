# Deployment Guide

This guide documents the deployed portfolio architecture for `consultationAI`.

## Deployment topology

```text
Vercel frontend
    -> Render FastAPI backend
        -> Render private Ollama service
```

## Services

### Frontend

Host: Vercel

Purpose:

- Serve the Next.js frontend
- Authenticate users through Clerk
- Call the Render backend API
- Render streaming model responses

Required Vercel environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://consultation-api-f1vm.onrender.com
```

Do not include a trailing slash.

### Backend API

Host: Render Web Service

Purpose:

- Public API endpoint for the frontend
- Clerk bearer-token validation
- CORS enforcement
- Prompt construction
- Private call to Ollama
- SSE streaming back to the browser

Recommended Render settings:

```text
Service Type: Web Service
Runtime: Docker
Branch: main or develop, but keep this aligned with Vercel
Root Directory: blank
Dockerfile Path: Dockerfile.render-api
Docker Build Context Directory: .
Health Check Path: /health
```

Required Render API environment variables:

```text
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://consultationai:11434
OLLAMA_MODEL=llama3.2:1b
FRONTEND_ORIGINS=<comma-separated Vercel origins>
CLERK_JWKS_URL=<your Clerk JWKS URL>
```

Example `FRONTEND_ORIGINS`:

```text
FRONTEND_ORIGINS=https://saas-bice-iota.vercel.app,https://saas-git-main-bkane56s-projects.vercel.app,https://saas-1lledrc8q-bkane56s-projects.vercel.app
```

No trailing slashes.

### Ollama model runtime

Host: Render Private Service

Purpose:

- Run Ollama as a private model service
- Serve model output to the backend only
- Avoid exposing the model runtime to the public internet

Recommended Render settings:

```text
Service Type: Private Service
Runtime: Docker
Branch: same branch used by backend
Root Directory: blank
Dockerfile Path: Dockerfile.ollama
Docker Build Context Directory: .
Service Address: consultationai:11434
```

Required Render Ollama environment variables:

```text
PORT=11434
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_MODELS=/var/lib/ollama/models
OLLAMA_MODEL=llama3.2:1b
```

If using a persistent disk, mount it at:

```text
/var/lib/ollama
```

## URL map

### Browser to backend

Used in Vercel:

```text
NEXT_PUBLIC_API_BASE_URL=https://consultation-api-f1vm.onrender.com
```

The frontend calls:

```text
https://consultation-api-f1vm.onrender.com/api/consultation
```

### Backend to Ollama

Used in Render API:

```text
OLLAMA_BASE_URL=http://consultationai:11434
```

This is private Render service communication. Do not use this in browser code.

## Deployment order

1. Deploy the Ollama private service.
2. Confirm the private service address and port.
3. Deploy the FastAPI backend web service.
4. Confirm `/health` returns `200`.
5. Set `NEXT_PUBLIC_API_BASE_URL` in Vercel.
6. Redeploy Vercel.
7. Test the frontend with synthetic patient examples only.

## Health checks

Backend health:

```bash
curl -i https://consultation-api-f1vm.onrender.com/health
```

Expected:

```text
HTTP/2 200
{"status":"healthy"}
```

CORS preflight test:

```bash
curl -i -X OPTIONS https://consultation-api-f1vm.onrender.com/api/consultation \
  -H "Origin: https://saas-git-main-bkane56s-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expected headers include:

```text
access-control-allow-origin: https://saas-git-main-bkane56s-projects.vercel.app
access-control-allow-methods: GET, POST, OPTIONS
access-control-allow-headers: Accept, Accept-Language, Authorization, Content-Language, Content-Type
```

Invalid token test:

```bash
curl -i -N -X POST https://consultation-api-f1vm.onrender.com/api/consultation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST" \
  -d '{
    "patient_name": "Synthetic Patient",
    "date_of_visit": "2026-06-01",
    "notes": "Synthetic example only. Patient reports low back pain after lifting a box."
  }'
```

Expected:

```text
HTTP/2 403
```

That confirms the API is reachable and auth protection is active.

## Common mistakes

### Wrong API URL in Vercel

Wrong:

```text
NEXT_PUBLIC_API_BASE_URL=https://consultationai-api.onrender.com
```

Correct:

```text
NEXT_PUBLIC_API_BASE_URL=https://consultation-api-f1vm.onrender.com
```

### Wrong Ollama URL in backend

Wrong:

```text
OLLAMA_BASE_URL=http://localhost:11434
```

Correct:

```text
OLLAMA_BASE_URL=http://consultationai:11434
```

### Wrong Dockerfile

API service should use:

```text
Dockerfile.render-api
```

Ollama service should use:

```text
Dockerfile.ollama
```

### Wrong service type

The backend API must be a Render Web Service.

The Ollama runtime should be a Render Private Service.

### Branch mismatch

Keep Vercel and Render aligned. Use either `main` everywhere or `develop` everywhere while debugging.

If Vercel deploys `main` while Render deploys `develop`, frontend and backend changes may not match.

### CORS origin mismatch

Use exact frontend origins. Do not include trailing slashes.

## Final verification checklist

- Vercel deployment is current
- Render API deployment is current
- Render Ollama deployment is current
- `/health` returns `200`
- CORS preflight returns `200`
- Invalid bearer token returns `403`
- Signed-in browser request produces streamed output
- Demo banner warns against real PHI/PII
- Ollama service remains private
