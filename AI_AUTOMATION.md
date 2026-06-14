# AI Automation

MailFlow Studio includes an AI provider abstraction table and UI for:

- OpenAI
- Anthropic
- Gemini
- OpenRouter
- Ollama

Supported action types:

- `ai_classify`
- `ai_summarize`
- `ai_extract_fields`

Current MVP behavior:

- OpenAI-compatible calls work with `OPENAI_API_KEY`.
- OpenRouter calls work with `OPENROUTER_API_KEY`.
- Ollama calls work with `OLLAMA_BASE_URL`.
- Anthropic and Gemini are represented in the provider abstraction and should be connected with provider-specific adapters before production use.

Prompt payloads include sender, recipient, subject, and body preview only.
