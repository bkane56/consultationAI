---
sessionId: session-260527-115259-14li
---

# Requirements

### Overview & Goals
The repository should no longer present itself as `saas`; all first-party project identity references should consistently use `consultationAI`.

### Scope
#### In Scope
- Replace current `saas` project-name references in root metadata/config.
- Remove stale name-coupled path strings that embed `saas`.
- Update top-level documentation to identify the app as `consultationAI`.
- Confirm attached UI file (`pages/product.tsx`) does not require rename-specific changes.

#### Out of Scope
- UI copy/content changes unrelated to project identity.
- Backend/frontend functional behavior changes.
- Any rename work inside dependency/vendor code (`node_modules`).

### Functional Requirements
- `package.json` uses `"name": "consultationAI"`.
- `tsconfig.json` no longer excludes `"saas/node_modules"` and uses rename-safe exclusion.
- `styles/globals.css` no longer contains the `saas/node_modules` commented import.
- `README.md` introduces the project as `consultationAI` instead of generic template-only text.
- Repository scan of tracked source/config/docs finds no remaining first-party `saas` references.

# Technical Design

### Current Implementation
Confirmed current first-party `saas` references are:
- `package.json:2` → `"name": "saas"`
- `tsconfig.json:23` → `"saas/node_modules"`
- `styles/globals.css:1` → `/*@import "saas/node_modules/tailwindcss";*/`

Additional context from inspection:
- `README.md` is still default Next.js boilerplate and does not establish `consultationAI` identity.
- `pages/product.tsx` (attached) contains consultation/subscription UI text and no `saas` literal, so no rename edits are needed there.
- Architecture remains config-driven Next.js frontend + Python API via `Dockerfile` multi-stage build.

### Key Decisions
- Keep requested canonical name as exact casing `consultationAI`.
- Replace repo-name-prefixed config paths with neutral values (e.g., `node_modules`) to avoid future rename drift.
- Limit changes to first-party files only; ignore dependency matches found under `node_modules`.

### Proposed Changes
- `package.json`
  - Change `name` from `saas` to `consultationAI`.
- `tsconfig.json`
  - Replace `exclude: ["saas/node_modules"]` with `exclude: ["node_modules"]`.
- `styles/globals.css`
  - Remove or normalize the obsolete commented `saas/node_modules` import line.
- `README.md`
  - Add a project heading/introduction naming `consultationAI` while preserving run instructions.
- Consistency scan
  - Re-scan tracked files for `saas` and ensure remaining hits are dependency-only.

### Risks
- Package naming convention risk if later published to npm (uppercase may be disallowed), though acceptable for private app metadata.
- Hidden references could exist in unscanned generated artifacts; mitigate by focusing on tracked project files and root configs.