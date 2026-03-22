"""OpenAI SDK thin wrapper — singleton client, retry on rate limit and connection errors."""

from __future__ import annotations

import os
import time
from pathlib import Path

import httpx
import openai
from dotenv import load_dotenv

# Load .env from project root (or cwd)
_env_loaded = False
_client: openai.OpenAI | None = None


def _load_env() -> None:
    global _env_loaded
    if _env_loaded:
        return
    # Walk up from this file to find .env
    for candidate in (Path.cwd(), Path(__file__).resolve().parent.parent):
        env_path = candidate / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            break
    _env_loaded = True


def get_client() -> openai.OpenAI:
    """Return a singleton OpenAI client configured from .env."""
    global _client
    if _client is not None:
        return _client

    _load_env()
    api_key = os.environ.get("OPENAI_KEY") or os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASEURL") or os.environ.get("OPENAI_BASE_URL")

    if not api_key:
        raise RuntimeError(
            "No API key found. Set OPENAI_KEY in .env or environment."
        )

    _client = openai.OpenAI(api_key=api_key, base_url=base_url or None)
    return _client


def chat(
    messages: list[dict],
    *,
    tools: list[dict] | None = None,
    model: str = "gpt-5-chat",
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> openai.types.chat.ChatCompletion:
    """Send a chat completion request with one retry on rate limit."""
    client = get_client()
    kwargs: dict = dict(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if tools:
        kwargs["tools"] = tools

    try:
        return client.chat.completions.create(**kwargs)
    except openai.RateLimitError:
        print("[llm] Rate limited, retrying in 5s...")
        time.sleep(5)
        return client.chat.completions.create(**kwargs)
    except (openai.APIConnectionError, httpx.RemoteProtocolError):
        print("[llm] Connection error, retrying in 10s...")
        time.sleep(10)
        return client.chat.completions.create(**kwargs)
