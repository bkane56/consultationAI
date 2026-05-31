# consultationAI release runbook (Vercel frontend + hosted FastAPI backend)

This runbook is written for your portfolio demo architecture:

- Frontend: `Next.js` on `Vercel`
- Backend: `FastAPI` on a separate container/VM host
- Model runtime: contained/self-hosted `Ollama` reachable by backend

> This is a demo deployment pattern. Do **not** use real `PHI/PII` data.

## 0) Choose backend host (recommended order)

Given your prior Railway friction with Python, use this order:

1. **Render (recommended first)** — very stable for Python web services + Docker deploys.
2. **Fly.io** — strong option for containerized services, more infra control.
3. **Railway** — still viable, but use the troubleshooting section below if Python runtime/build issues recur.

If you want the least friction now, use `Render` with the project `Dockerfile`.

## 1) Pre-release checks (local)

From repo root:

```bash
yarn lint
yarn test
yarn test:ui
```

Run backend locally from `.venv` (already the project convention):

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
yarn dev:api
```

Confirm frontend can call backend locally before deploying.

## 2) Release frontend to Vercel (exact UI flow)

1. Push latest code to your deployment branch (for example `develop`).
2. In Vercel dashboard: `Add New` -> `Project`.
3. Import your Git repo.
4. Configure project:
   - Framework preset: `Next.js` (auto-detected)
   - Install command: `yarn install`
   - Build command: `yarn build`
5. Add frontend environment variables in Vercel (`Project Settings` -> `Environment Variables`):

```bash
NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

6. Deploy (Preview first, then Production).
7. Record frontend URLs:
   - `https://<project>.vercel.app`
   - custom domain (if configured)

## 3) Release backend to Render (recommended path)

### 3.0 Deploy Ollama as a Render service

Ollama must run as its own Render service using the public `ollama/ollama` Docker image. **Do not use the project `Dockerfile` for Ollama.**

#### Architecture summary

| Service | Image | Port |
|---------|-------|------|
| `consultation-backend` | Project `Dockerfile` (FastAPI) | `8000` |
| `ollama` | `ollama/ollama` (public image) | `11434` |

#### Steps to create the Ollama service

1. In Render: `New` -> `Web Service`.
2. On the source selection screen, choose **"Existing Image"** (also labeled "Deploy an existing Docker image" in some Render UI versions). If you see options like "Git Repository" and "Public Git Repository", look for the **"Existing Image"** tab or option.
3. In the image field, enter: `ollama/ollama`
4. Click **Connect** or **Next**.
5. Name the service (e.g. `ollama`).
6. Region: **same region as your backend service**.
7. Add environment variable:
   ```bash
   OLLAMA_HOST=0.0.0.0
   ```
   > **Note:** Render does not show a separate "Port" field for image-based services. The port (`11434`) is defined by the `ollama/ollama` image itself and is used automatically for internal networking. You do not need to set it manually.
8. Click **Deploy**.

#### Pull the model after first deploy

Once the Ollama service is running:

1. In Render dashboard, open the `ollama` service.
2. Click **Shell** (top-right tab).
3. Run:
   ```bash
   ollama pull llama3.1:8b
   ```
4. Wait for the pull to complete before sending traffic from the backend.

#### Get the Internal URL

In the Render dashboard for the `ollama` service, find the **Internal URL** (shown under the service name). It will look like:

```
http://ollama:11434
```

Copy this — you will use it as `OLLAMA_BASE_URL` in the backend service.

### 3.1 Create backend service

1. In Render: `New` -> `Web Service`.
2. Connect the same Git repository.
3. Choose branch (`develop` or your release branch).
4. Runtime: `Docker` (recommended for consistency).
5. Region: choose closest to expected demo audience.

### 3.2 Set backend environment variables

Use these in Render environment settings:

```bash
CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://<your-ollama-service-name>:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_API_KEY=ollama
```

> **Note:** Replace `<your-ollama-service-name>` with the Internal URL name shown in your Render Ollama service dashboard (e.g. `ollama` if that is the service name). `localhost` will **not** work here — Ollama is a separate Render service.

Recommended additional vars:

```bash
PYTHONUNBUFFERED=1
PORT=8000
```

> **Verify connectivity:** After both services are deployed, check backend logs for connection errors to Ollama on the first request. A 503 response with "LLM provider unavailable" usually means `OLLAMA_BASE_URL` is wrong or the model has not been pulled yet.

### 3.3 Configure CORS on backend

Allow only exact frontend origins:

- `https://<project>.vercel.app`
- `https://<your-custom-domain>` (if used)

No wildcard (`*`) in production-like environments.

### 3.4 Deploy and capture backend URL

After successful deploy, save:

- `https://<your-render-service>.onrender.com`

Update Vercel `NEXT_PUBLIC_API_BASE_URL` if needed, then redeploy frontend.

## 4) Alternative backend release on Railway (if you retry)

1. `New Project` -> `Deploy from GitHub repo`.
2. Prefer Docker-based deploy for Python consistency.
3. Set the same backend env vars listed above.
4. Ensure service starts with app bound to `0.0.0.0:$PORT`.

If not using Docker, Railway Python detection/start command issues are common; explicitly set start command to your FastAPI app entrypoint.

## 5) Post-deploy verification checklist

1. Open Vercel frontend URL.
2. Sign in via Clerk.
3. Submit a consultation in `/product`.
4. Verify browser network:
   - request goes to `https://<backend-domain>/api/consultation`
   - response is streaming (`text/event-stream`) without buffering failures
5. Verify backend logs show authenticated request handling and no missing env errors.
6. Confirm no CORS errors in browser console.

## 6) Railway/Python troubleshooting quick-reference

If Railway failed before, these are the most common causes:

1. **Wrong Python/runtime detection**
   - Fix: use Docker deploy or pin Python version explicitly.
2. **App not binding to platform port**
   - Fix: run server on `0.0.0.0` and `$PORT`.
3. **Missing env vars (`LLM_PROVIDER`, `OLLAMA_*`, `CLERK_JWKS_URL`)**
   - Fix: set all required vars before deploy.
4. **Dependency/build drift**
   - Fix: rebuild from lockfile and keep `requirements.txt` clean/pinned.
5. **Ollama endpoint unreachable from Railway**
   - Fix: host Ollama on a reachable private/public endpoint; `localhost` will not work unless Ollama runs in the same network namespace.
6. **SSE buffered by proxy layer**
   - Fix: ensure upstream/proxy path preserves `text/event-stream` without response buffering.

## 7) Environment matrix (copy/paste)

### Vercel (Frontend)

```bash
# Preview / Production
NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Backend host (Render/Fly/Railway)

```bash
CLERK_JWKS_URL=https://<your-clerk-domain>/.well-known/jwks.json
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://<your-ollama-service-name>:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_API_KEY=ollama
PORT=8000
```

## 8) Interview-ready release statement (optional)

"This portfolio system is intentionally deployed with a split architecture: static frontend on Vercel, authenticated FastAPI backend on a container host, and contained Ollama inference to minimize data exposure during demos. I explicitly separate demo controls from production compliance requirements and can describe the threat model and control gaps." 