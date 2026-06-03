# Security Notes

This project is a healthcare-focused AI documentation demo. It is designed to show PHI/PII-aware engineering choices, not to claim production clinical compliance.

## Demo data policy

Use synthetic patient examples only.

Do not enter:

- Real patient names
- Dates of birth
- Medical record numbers
- Addresses
- Phone numbers
- Insurance identifiers
- Real clinical notes
- Any other PHI, PII, or regulated data

## What this project intentionally demonstrates

The deployed architecture is designed to reduce unnecessary external data exposure:

```text
Browser
    -> FastAPI backend
        -> private Ollama service
```

The primary deployed inference path avoids third-party LLM API calls. Model inference is routed through a private Ollama service that is reachable by the backend, not by the public browser.

## What this project does not claim

This project does not claim to be:

- HIPAA compliant
- A medical device
- A production clinical documentation system
- Validated for real patient care
- Approved for regulated data processing

The correct positioning is:

```text
PHI/PII-aware demo architecture using private model inference and synthetic data only.
```

## Trust boundaries

Important boundaries include:

- Browser and user session
- Vercel-hosted frontend
- Render-hosted public backend API
- Render private Ollama service
- Clerk authentication provider
- Deployment environment variables and secrets

The backend is the main policy enforcement point. It validates tokens, enforces CORS, prepares prompts, and controls access to the private model service.

## CORS policy

The backend should allow only exact frontend origins.

Example:

```text
FRONTEND_ORIGINS=https://saas-bice-iota.vercel.app,https://saas-git-main-bkane56s-projects.vercel.app
```

Avoid wildcard CORS in deployed environments.

Do not use:

```text
*
```

for authenticated browser requests.

## Secrets management

Secrets should be stored only in deployment environment variables or a managed secret store.

Never commit:

- Clerk secret keys
- API keys
- Tokens
- Private `.env` files
- Production credentials

Useful environment variables:

```text
CLERK_JWKS_URL
LLM_PROVIDER
OLLAMA_BASE_URL
OLLAMA_MODEL
FRONTEND_ORIGINS
NEXT_PUBLIC_API_BASE_URL
```

Only variables prefixed with `NEXT_PUBLIC_` should be exposed to the browser.

## Logging guidance

Application logs should not include raw consultation notes or patient identifiers.

Recommended logging:

- Request IDs
- Response status
- Timing
- Provider errors without raw prompt content
- Auth failures without token contents

Avoid logging:

- Raw consultation text
- Generated clinical narratives containing patient data
- Full bearer tokens
- Prompt bodies
- User identifiers beyond what is necessary for debugging

## Authentication

The frontend obtains a Clerk bearer token and sends it to the backend. The backend validates the token using Clerk JWKS before processing the consultation request.

Invalid or missing tokens should be rejected before model invocation.

## Model runtime boundary

Ollama runs as a private service.

Expected backend value:

```text
OLLAMA_BASE_URL=http://consultationai:11434
```

This value belongs only in the Render API environment. It should not be exposed through Vercel or browser code.

## Production controls still required

A production clinical deployment would require more than private model inference.

Additional controls would include:

- Full security risk assessment
- Full privacy risk assessment
- Business associate agreements where applicable
- Formal access-control model
- Audit logging
- Encryption at rest and in transit
- Key management and rotation
- Data retention and deletion policies
- Incident response plan
- Monitoring and alerting
- Backup and disaster recovery
- Vulnerability scanning
- Dependency and container scanning
- Clinical validation and review workflow
- Policies for model output review and correction

## Recommended demo banner

Place this near the consultation form:

```text
Demo only. Use synthetic patient information only. Do not enter real PHI or PII.
```

This is important because the application is healthcare-themed and may invite users to enter realistic medical text.
