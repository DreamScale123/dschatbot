# Beardie Care Guide MVP

## Setup

1. Install dependencies.
2. Copy `.env.example` to `.env.local` and fill in values.
3. Run the dev server.

```bash
npm install
npm run dev
```

## Pages

- `/login` member password gate
- `/` chat UI
- `/admin` system prompt editor

## Knowledge files (File Search)

1. Create a vector store in the OpenAI dashboard.
2. Copy the vector store ID into `OPENAI_VECTOR_STORE_ID`.
3. Use `/admin` to upload PDFs/DOCX/TXT/CSV/JSON for retrieval.
