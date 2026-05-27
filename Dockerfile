FROM node:22-alpine AS frontend-builder
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
# Test to make usre the Public Key is available before build
# if it is not available run RUN node -e "console.log('IN_DOCKER_KEY=', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '<empty>')"
# to see if it is in the env. If it is not re-run in command line: export $(cat .env | grep -v '^#' | xargs)
RUN test -n "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"

RUN yarn build

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl && rm -rf /var/lib/apt/lists/*

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

COPY api ./api
COPY --from=frontend-builder /app/out ./static

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["sh","-c","curl -f http://localhost:8000/health || exit 1"]

EXPOSE 8000
CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000"]