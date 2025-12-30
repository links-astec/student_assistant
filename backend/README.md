# Coventry University Student Assistant - Backend

An AI-powered chatbot backend that helps Coventry University students with administrative queries using RAG (Retrieval-Augmented Generation).

## Features

- 🤖 **AI Chat**: Intelligent responses to student queries using local LLM (FREE with Ollama)
- 🔍 **Semantic Search**: Vector-based search across the knowledge base
- 📚 **Knowledge Base**: Comprehensive coverage of university services (90 documents)
- 🔐 **Optional Supabase**: User management and persistent storage (optional)
- 🚀 **Production Ready**: Error handling, logging, and health checks

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **AI/ML**: Ollama (FREE, local) or OpenAI (paid)
  - Chat Model: llama3.2 (3.2B parameters)
  - Embedding Model: nomic-embed-text
- **Database**: Supabase (optional) or local file cache
- **Validation**: Zod

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Ollama installed and running (https://ollama.ai)

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Install Ollama** (if not already installed):
   ```bash
   # Windows
   winget install Ollama.Ollama
   
   # Then pull required models
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

3. **Configure environment**:
   The default `.env` is configured for Ollama (FREE).
   No API keys required!

4. **Generate embeddings** (required first time):
   ```bash
   npm run ingest
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`.

## API Endpoints

### Chat

**POST** `/api/chat`
```json
{
  "message": "How do I apply for accommodation?",
  "conversationId": "optional-uuid",
  "userId": "optional-user-id"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "To apply for accommodation at Coventry University...",
    "conversationId": "uuid",
    "sources": [
      {
        "title": "Accommodation Overview",
        "url": "https://www.coventry.ac.uk/...",
        "category": "Accommodation"
      }
    ]
  }
}
```

### Search

**POST** `/api/search`
```json
{
  "query": "scholarships for international students",
  "limit": 5
}
```

**GET** `/api/search/categories` - Get all knowledge base categories

### Health

**GET** `/api/health` - Health check
**GET** `/api/health/ready` - Readiness check

## Knowledge Base

The knowledge base is organized into categories:

- **Student Support**: Success coaches, customer services
- **Academic Support**: Tutors, library, writing center, maths help
- **Health & Wellbeing**: Mental health, disability, medical center
- **Fees & Finance**: Scholarships, funding, cost of living
- **International Students**: Visas, English requirements, applications
- **Accommodation**: Halls, applications, fees
- **Employability**: Careers service, placements, CV help
- **Applications**: How to apply, deadlines, offers
- **Campus Locations**: All university campuses
- **General Info**: Contact details, portals, FAQs

### Adding New Content

1. Add JSON documents to `data/knowledge_base/`
2. Run `npm run ingest` to regenerate embeddings

## Supabase Setup

1. Create a new Supabase project
2. Run the schema from `supabase/schema.sql` in SQL Editor
3. Copy your project URL and keys to `.env`
4. Run ingestion with Supabase flag:
   ```bash
   npm run ingest -- --supabase
   ```

## Project Structure

```
backend/
├── data/
│   └── knowledge_base/     # JSON knowledge base files
├── src/
│   ├── config/             # Environment and service configuration
│   ├── middleware/         # Express middleware
│   ├── routes/             # API route handlers
│   ├── scripts/            # Utility scripts (ingestion)
│   ├── services/           # Business logic
│   ├── types/              # TypeScript types
│   └── index.ts            # Application entry point
├── supabase/
│   └── schema.sql          # Database schema
└── package.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run ingest` - Generate embeddings for knowledge base

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment mode | No |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes* |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes* |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No |
| `FRONTEND_URL` | CORS allowed origin | No |

*Required for Supabase features, optional for local-only development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
