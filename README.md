# consultationAI

`consultationAI` is a portfolio-grade, AI-assisted clinical documentation experience.
It combines a `Next.js` frontend and a `FastAPI` backend to generate structured consultation outputs (summary, next steps, and patient-facing communication) from clinician notes.

### Demo and data-safety positioning

- This repository is a **demonstration/portfolio project** intended to showcase end-to-end AI engineering skills, not a production clinical system.
- It is designed to run with `OLLAMA` in a contained/self-hosted runtime to reduce data exposure risk during demos.
- <span style="color: #dc2626;"><strong>Do not use real PHI/PII or other regulated data</strong> in this demo environment.</span>
- A production deployment would require formal security, privacy, and compliance controls (for example: BAAs where applicable, audited access controls, encryption at rest/in transit, key management, retention/deletion policies, incident response, and continuous monitoring).

### Security posture (Demo vs Production)

#### Threat-model checklist (what this demo acknowledges)

- **Data classification:** treat all entered clinical text as potentially sensitive; never use real PHI/PII in this demo.
- **Trust boundaries:** browser, frontend hosting, backend API, and model runtime are separate boundaries and should be explicitly controlled.
- **Identity & access:** authenticated routes (`Clerk`) are required, but demo auth alone is not a full compliance program.
- **Transport security:** require `HTTPS/TLS` end-to-end for browser-to-backend and backend-to-model traffic in any internet-facing deployment.
- **Secrets management:** keep API keys/tokens in environment variables or secret managers; never commit credentials.
- **Injection resistance:** maintain prompt/input hardening and validation before model invocation.
- **CORS discipline:** allow only exact frontend origins (no wildcard) in non-local environments.
- **Observability:** log operational events and errors, but avoid storing raw sensitive note content.
- **Supply chain hygiene:** pin dependencies, scan images/packages, and patch known vulnerabilities.

#### Architecture note

This project intentionally demonstrates a security-conscious pattern: a `Next.js` frontend deployed separately from a guarded `FastAPI` backend, with model inference routed to a contained/self-hosted `Ollama` runtime to reduce unnecessary data exposure during demos. In production, this same topology must be augmented with formal controls (for example: regulated-data governance, audited access control, encryption and key lifecycle management, incident response, continuous monitoring, and contractual/compliance requirements such as BAAs where applicable).

### Why this project is compelling

- Demonstrates full-stack ownership across frontend UX, backend APIs, auth, and LLM integration.
- Uses streaming responses (`SSE`) for responsive, real-time UX.
- Applies input hardening and basic prompt-injection defenses before calling the model.
- Includes subscription gating and authenticated workflows via `Clerk`.
- Clearly distinguishes demo constraints from real-world security/compliance requirements.

### Product flow

```mermaid
flowchart TD
    A[Clinician signs in via Clerk] --> B[Open /product and enter consultation data]
    B --> C[Frontend POST /api/consultation with Bearer token]
    C --> D[FastAPI validates auth + sanitizes input]
    D --> E[Backend builds constrained system/user prompts]
    E --> F[LLM Provider stream \n OpenAI or Ollama]
    F --> G[SSE chunks streamed to browser]
    G --> H[ReactMarkdown renders final structured output]
```

### Architecture overview

```mermaid
flowchart LR
    subgraph Frontend[Next.js App]
      P1[pages/index.tsx\nLanding + Sign in]
      P2[pages/product.tsx\nConsultation form + streaming UI]
      APP[pages/_app.tsx\nClerkProvider + global styles]
    end

    subgraph Backend[Python API]
      API[api/server.py\nFastAPI + SSE endpoint]
      VAL[Input normalization + injection checks]
      LLM[Provider layer\nOpenAI or Ollama]
    end

    AUTH[Clerk JWKS + bearer validation]
    DEPLOY[Vercel project config + static export settings]

    P1 --> P2
    P2 -->|Bearer JWT| API
    API --> AUTH
    API --> VAL
    API --> LLM
    P2 --> DEPLOY
```

### Tech stack

#### Frontend
- `Next.js 15` (Pages Router, static export enabled in `next.config.ts`)
- `React 19` + `TypeScript`
- `Tailwind CSS 4`
- `Clerk` for authentication/subscription controls
- `react-datepicker`, `react-markdown`, `remark-gfm`, `remark-breaks`
- `@microsoft/fetch-event-source` for streaming consumption

#### Backend
- `FastAPI`
- `pydantic`
- `fastapi-clerk-auth`
- `openai` SDK (used for both OpenAI and Ollama-compatible chat endpoints)
- `uvicorn` for local API serving

#### Developer tooling
- `ESLint 9` with `next/core-web-vitals` and TypeScript rules
- TypeScript strict mode enabled (`tsconfig.json`)
- Vercel project configuration present in `.vercel/project.json`

### Repository map

- `pages/index.tsx` — marketing/entry page and auth-aware navigation
- `pages/product.tsx` — protected product UX and streaming summary UI
- `pages/_app.tsx` — app-wide providers and global CSS imports
- `api/server.py` — production-ready FastAPI endpoint (`/api/consultation`)
- `api/index.py` — alternate/lightweight API entry implementation
- `styles/globals.css` — Tailwind + markdown rendering styles

### Local development

#### 1) Install dependencies

```bash
yarn install
```

#### 2) Configure environment variables

Create `.env.local` for the frontend and `.env` for Python runtime as needed.
At minimum, configure:

- `CLERK_JWKS_URL`
- Clerk publishable/secret keys used by the Next app
- `LLM_PROVIDER` (`openai` or `ollama`)

Provider-specific requirements:

- For `LLM_PROVIDER=openai`
  - `OPENAI_API_KEY`
  - Optional: `OPENAI_MODEL` (defaults to `gpt-5-nano`)
- For `LLM_PROVIDER=ollama`
  - `OLLAMA_BASE_URL` (example: `http://localhost:11434`)
  - `OLLAMA_MODEL` (example: `llama3.1:8b`)
  - Optional: `OLLAMA_API_KEY` (defaults to `ollama`)
- For Vercel frontend calling a separate backend:
  - `NEXT_PUBLIC_API_BASE_URL` (example: `https://your-backend.example.com`)

#### 3) Run frontend

```bash
yarn dev
```

#### 4) Run backend

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
yarn dev:api
```

Always run backend through `.venv` (for example `yarn dev:api` or `.venv/bin/python -m uvicorn ...`).
Using global `uvicorn` can load mismatched system site-packages and trigger `pydantic_core` architecture import errors.

#### 5) Local Ollama workflow (development)

```bash
ollama serve
ollama pull llama3.1:8b
export LLM_PROVIDER=ollama
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=llama3.1:8b
yarn dev:api
```

#### 6) OpenAI workflow (alternative / production-compatible)

```bash
export LLM_PROVIDER=openai
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-5-nano
yarn dev:api
```

### Deployment runbook (Vercel frontend + hosted FastAPI backend)

1. Deploy the frontend to Vercel (static export remains enabled via `next.config.ts`).
2. Deploy FastAPI backend to a VM/container host (not Vercel serverless) that can reach your model runtime.
3. Set frontend env in Vercel:
   - `NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>`
   - Clerk publishable/secret keys
4. Set backend env:
   - `CLERK_JWKS_URL`
   - `LLM_PROVIDER`
   - matching provider variables (`OPENAI_*` or `OLLAMA_*`)
5. Configure backend CORS to allow your Vercel domain(s) instead of wildcard in production.

### Troubleshooting

- **Missing provider env vars**: backend returns clear config errors for missing `LLM_PROVIDER` settings.
- **Model unavailable/timeouts**: backend returns `503` with provider error detail.
- **No streamed output in browser**: verify `NEXT_PUBLIC_API_BASE_URL` points to backend and that proxy/CDN does not buffer `text/event-stream`.
- **Auth failures across domains**: verify Clerk token forwarding and backend `CLERK_JWKS_URL`.
- **CORS errors**: allow your exact Vercel frontend origins in backend CORS config.

### Quality gates (required standards)

This project should be maintained with the following non-negotiable thresholds:

- **Functional code coverage:** `>= 80%`
- **UI coverage:** critical paths covered (auth flow, consultation form, streaming output)
- **Accessibility:** `100%` pass target on agreed checks (axe/Lighthouse policy)
- **Responsiveness:** validated across mobile/tablet/desktop breakpoints

A local, git-ignored quality contract file is supported:

1. Copy `quality-gates.local.example.md` to `quality-gates.local.md`.
2. Keep `quality-gates.local.md` updated with current coverage and audit status.
3. Enforce these checks in CI before merge.

### Recommendations to further impress senior/principal reviewers

1. Add CI pipelines for frontend + backend tests, linting, and coverage reporting.
2. Add Playwright/Cypress E2E tests for the consultation flow and auth gating.
3. Add explicit a11y checks (`axe-core`, Lighthouse CI) and publish reports.
4. Harden CORS (`allow_origins`) and environment-based security settings for production.
5. Consolidate `api/index.py` and `api/server.py` into a single backend entrypoint to reduce drift.
6. Add architecture decision records (`docs/adr`) to explain key trade-offs.

### Deployment notes

- Frontend static export is configured in `next.config.ts` (`output: 'export'`).
- Vercel metadata exists in `.vercel/project.json`.
- Backend deploy target can be containerized (`Dockerfile`) or run on a Python-compatible service.
- See `vercel-backend-release-runbook.md` for exact release steps and provider-specific deployment guidance.
