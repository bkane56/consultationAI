# Render Deployment Files

This folder documents the Render-specific deployment files for `consultationAI`.

The deployed backend uses two Render services:

```text
Render Web Service: FastAPI backend
Render Private Service: Ollama model runtime
```

## Why two services

The API and model runtime have different responsibilities and different exposure requirements.

The FastAPI backend is public because the Vercel frontend must call it over HTTPS.

The Ollama service is private because model inference should not be exposed directly to the public internet.

## API service

Render service type:

```text
Web Service
```

Dockerfile:

```text
Dockerfile.render-api
```

Build context:

```text
.
```

Health check path:

```text
/health
```

Required environment variables:

```text
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://consultationai:11434
OLLAMA_MODEL=llama3.2:1b
FRONTEND_ORIGINS=<comma-separated frontend origins>
CLERK_JWKS_URL=<your Clerk JWKS URL>
```

The API service receives browser traffic and calls the private Ollama service.

## Ollama private service

Render service type:

```text
Private Service
```

Dockerfile:

```text
Dockerfile.ollama
```

Build context:

```text
.
```

Private service address:

```text
consultationai:11434
```

Required environment variables:

```text
PORT=11434
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_MODELS=/var/lib/ollama/models
OLLAMA_MODEL=llama3.2:1b
```

The API service should call Ollama with:

```text
OLLAMA_BASE_URL=http://consultationai:11434
```

## Startup script

`render/ollama-start.sh` should start Ollama and ensure the configured model is available.

Expected behavior:

1. Start the Ollama server.
2. Wait for the Ollama API to become reachable.
3. Pull the configured model if needed.
4. Keep the Ollama server process running.

## Common deployment issues

### Render uses the wrong Dockerfile

Symptoms:

- Ollama service logs show Node or Python base images
- API service tries to build frontend code

Fix:

```text
API Dockerfile Path: Dockerfile.render-api
Ollama Dockerfile Path: Dockerfile.ollama
Docker Build Context Directory: .
```

### Ollama listens on the wrong port

Symptoms:

- API cannot reach Ollama
- Private service address does not respond

Fix:

```text
PORT=11434
OLLAMA_HOST=0.0.0.0:11434
```

### API uses localhost for Ollama

Wrong:

```text
OLLAMA_BASE_URL=http://localhost:11434
```

Correct on Render:

```text
OLLAMA_BASE_URL=http://consultationai:11434
```

### CORS fails from Vercel

Fix the API environment variable:

```text
FRONTEND_ORIGINS=<exact Vercel origins, comma-separated, no trailing slash>
```

Then redeploy the API service.

### API URL is wrong in Vercel

Vercel should use the public API URL:

```text
NEXT_PUBLIC_API_BASE_URL=https://consultation-api-f1vm.onrender.com
```

Do not put the private Ollama URL in Vercel.

## Cost and model-size note

Small Render instances are not suitable for larger models such as `llama3.1:8b`. For a portfolio demo, a smaller model such as `llama3.2:1b` may be a practical trade-off that preserves the private-inference architecture while reducing cost.

The architecture demonstrates the important healthcare-aware design choice: model inference is private and not performed through a third-party LLM API.
