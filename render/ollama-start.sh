#!/usr/bin/env sh
set -eu

MODEL_NAME="${OLLAMA_MODEL:-llama3.1:8b}"

mkdir -p "${OLLAMA_MODELS:-/models}"

ollama serve &
OLLAMA_PID="$!"

printf 'Waiting for Ollama to accept connections'
until ollama list >/dev/null 2>&1; do
  printf '.'
  sleep 2
done
printf '\n'

if ! ollama list | awk '{print $1}' | grep -Fxq "$MODEL_NAME"; then
  echo "Pulling Ollama model: $MODEL_NAME"
  ollama pull "$MODEL_NAME"
else
  echo "Ollama model already present: $MODEL_NAME"
fi

wait "$OLLAMA_PID"
