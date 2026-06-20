# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a new project (Study-04) in early setup. No build system, package manager, or source files exist yet.

## Environment

- `OPENROUTER_API_KEY` is set in `.env` — this project uses [OpenRouter](https://openrouter.ai/) as the LLM provider.
- When making API calls, read the key from `process.env.OPENROUTER_API_KEY` (Node.js) or `os.environ["OPENROUTER_API_KEY"]` (Python).
- Never commit `.env` to version control.
