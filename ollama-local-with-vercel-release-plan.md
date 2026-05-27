---
sessionId: session-260527-104310-1oo2
---

# Requirements

### Overview & Goals
Implement an LLM integration strategy that supports **local `Ollama` during development** while remaining deployable for production usage with a **Vercel-hosted frontend**.

### Scope
#### In Scope
- Replace direct model coupling in `api/server.py` (`OpenAI()` + `model="gpt-5-nano"`) with a provider approach that supports `Ollama`.
- Preserve existing endpoint contract at `POST /api/consultation` used by `pages/product.tsx` SSE flow.
- Define deployment topology compatible with current architecture (`Next.js` frontend + `FastAPI` backend).
- Keep existing prompt guardrails (input normalization + injection checks) intact.

#### Out of Scope
- Redesigning frontend UX in `pages/product.tsx`.
- Removing Clerk auth model already used in backend (`fastapi_clerk_auth`).
- Migrating entire backend to Vercel serverless functions.

### Functional Requirements
- Local development must allow running generation through `Ollama` (e.g., `http://localhost:11434`) with streaming output.
- Production must avoid dependency on a localhost model runtime inside Vercel.
- The existing SSE response semantics must remain compatible with `fetchEventSource` consumer in `pages/product.tsx`.
- Backend must fail fast with clear errors when provider configuration is missing or invalid.

### Non-Functional Requirements
- Keep protected route behavior (`Depends(clerk_guard)`) unchanged.
- Ensure deployment path is explicit and reproducible for both local and production.
- Avoid introducing model-provider specifics into UI code.

# Technical Design

### Current Implementation
- `api/server.py` currently:
  - defines guarded prompt construction (`normalize_input`, `contains_suspicious_injection`, `validate_visit_for_prompt`, `user_prompt_for`).
  - calls `OpenAI()` directly and streams via `client.chat.completions.create(..., stream=True)`.
- `pages/product.tsx` posts to `/api/consultation` and expects incremental SSE chunks.
- `next.config.ts` uses `output: 'export'`, meaning frontend is static-export oriented.
- `Dockerfile` currently builds static frontend and runs FastAPI with `uvicorn` in one container.

### Key Decisions
1. **Introduce provider abstraction in backend**
   - Encapsulate model call path in an internal adapter layer in `api/server.py` (or a small `api/llm_provider.py`).
   - Rationale: keeps guardrails + endpoint stable while changing only generation backend.
2. **Use environment-driven provider selection**
   - `LLM_PROVIDER=ollama|openai` and provider-specific vars (e.g., `OLLAMA_BASE_URL`, `OLLAMA_MODEL`).
   - Rationale: no code edits required between local and production.
3. **Split deploy responsibilities**
   - Vercel hosts frontend.
   - FastAPI hosts on a service that can reach an LLM runtime (self-hosted VM/container, or managed Ollama-compatible endpoint).
   - Rationale: Vercel cannot run persistent local `ollama serve`.

### Proposed Changes
- Backend integration:
  - Refactor model invocation in `consultation_summary` to call a provider service returning streamed tokens/chunks.
  - Preserve existing `event_stream()` formatting so frontend parsing behavior stays unchanged.
- Configuration surface:
  - Add explicit environment contracts in backend startup/docs:
    - common: `LLM_PROVIDER`
    - ollama: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`
    - optional fallback: `OPENAI_API_KEY`, `OPENAI_MODEL`
- Frontend connectivity for Vercel:
  - Update frontend to call backend base URL from env (e.g., `NEXT_PUBLIC_API_BASE_URL`) rather than assuming same-origin `/api/consultation`, since backend is separately hosted.
- Deployment notes:
  - Keep existing Docker path for backend runtime.
  - Use Vercel env variables for backend URL and Clerk settings.

### File Structure
- **Modify**: `api/server.py` (provider selection + streaming adapter integration)
- **Potentially add**: `api/llm_provider.py` (provider interface + ollama/openai implementations)
- **Modify**: `pages/product.tsx` (API base URL usage while preserving SSE behavior)
- **Update docs/config references**: `README.md`, deployment docs/env examples

### Risks
- **SSE stream shape mismatch** between providers may break markdown accumulation.
  - Mitigation: normalize chunk extraction in one adapter.
- **Vercel + static export routing assumptions** may fail if frontend still targets relative `/api`.
  - Mitigation: explicit absolute backend URL env for production.
- **Auth/CORS issues** across Vercel frontend and external backend.
  - Mitigation: narrow CORS origins and validate Clerk JWT flow end-to-end with production domains.

# Testing

### Validation Approach
- Validate the same user flow currently implemented in `pages/product.tsx`: submit form, receive streamed markdown output, render sections.
- Verify both provider modes (`ollama` local and production-configured provider) using env switches only.

### Key Scenarios
- Local: `LLM_PROVIDER=ollama` with running local model returns streamed response at `POST /api/consultation`.
- Production-like: frontend hosted configuration calls external backend URL and successfully streams response.
- Guardrails: malicious/injection-like `notes` still return existing `400` validation errors.

### Edge Cases
- Missing `OLLAMA_BASE_URL` / `OLLAMA_MODEL` -> clear startup/runtime configuration error.
- Provider unavailable / timeout -> deterministic error response (no hanging stream).
- Large note payload near existing limits still handled with current validation boundaries.

# Delivery Steps

###   Step 1: Design provider abstraction and environment contract in the FastAPI backend
Backend has a clear, provider-agnostic model invocation contract for streaming consultation output.
- Define an internal provider interface aligned with current `consultation_summary` streaming needs in `api/server.py`.
- Specify env-driven provider selection (`LLM_PROVIDER`) and provider-specific variables (`OLLAMA_*`, optional `OPENAI_*`).
- Keep existing prompt safety pipeline (`validate_visit_for_prompt` and `user_prompt_for`) as a mandatory pre-step before any provider call.

###   Step 2: Integrate Ollama streaming path while preserving existing endpoint behavior
`POST /api/consultation` streams output through the new provider layer without changing frontend-visible SSE semantics.
- Route generation calls from `OpenAI()` direct usage to the abstraction and add an `ollama` implementation path.
- Normalize provider chunk format to the current `event_stream()` behavior expected by `fetchEventSource` in `pages/product.tsx`.
- Add clear error handling for provider connectivity and misconfiguration so failures return actionable responses.

###   Step 3: Make Vercel-ready frontend/backend connectivity explicit
Frontend can run on Vercel while calling a separately hosted FastAPI backend that serves LLM responses.
- Update request URL strategy in `pages/product.tsx` to support env-configured backend base URL instead of hardcoded same-origin API path.
- Define required Vercel environment variables and backend CORS/auth expectations for Clerk-protected endpoints.
- Confirm architecture fit with current `next.config.ts` static export approach and avoid assumptions of co-located backend runtime.

###   Step 4: Document deployment runbook for local Ollama and production release
Project has a reproducible operational guide for local development and production deployment.
- Document local workflow: run `ollama serve`, select model, set backend env vars, run FastAPI + Next frontend.
- Document production workflow: deploy frontend to Vercel, deploy backend to a container host/VM with reachable model runtime.
- Include troubleshooting matrix for common failures (CORS, auth token forwarding, SSE buffering, model unavailability).