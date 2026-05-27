import os
from typing import Iterable, Iterator

from openai import OpenAI


class LLMConfigurationError(ValueError):
    pass


def _required_env(name: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value:
        raise LLMConfigurationError(f"Missing required environment variable: {name}")
    return value


def _ollama_base_url() -> str:
    base_url = _required_env("OLLAMA_BASE_URL").rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1"
    return base_url


def stream_consultation_chunks(messages: list[dict[str, str]]) -> Iterator[str]:
    provider = (os.getenv("LLM_PROVIDER") or "openai").strip().lower()

    if provider == "openai":
        yield from _stream_openai_chunks(messages)
        return

    if provider == "ollama":
        yield from _stream_ollama_chunks(messages)
        return

    raise LLMConfigurationError(
        "Invalid LLM_PROVIDER. Expected one of: openai, ollama"
    )


def _stream_openai_chunks(messages: list[dict[str, str]]) -> Iterable[str]:
    client = OpenAI(api_key=_required_env("OPENAI_API_KEY"), timeout=60.0)
    model = (os.getenv("OPENAI_MODEL") or "gpt-5-nano").strip()

    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )

    for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text


def _stream_ollama_chunks(messages: list[dict[str, str]]) -> Iterable[str]:
    client = OpenAI(
        base_url=_ollama_base_url(),
        api_key=os.getenv("OLLAMA_API_KEY") or "ollama",
        timeout=60.0,
    )
    model = _required_env("OLLAMA_MODEL")

    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )

    for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text
