# Coventry University Student Assistant - Developer Handoff

**Project:** Coventry University Student Assistant (AI Chatbot Backend)  
**Created:** 2025  
**Status:** ✅ READY FOR TESTING  
**Tech Stack:** Node.js + Express + TypeScript + Ollama (FREE LLM)

---

## 📋 Executive Summary

This is an AI-powered backend that helps Coventry University students with administrative queries using RAG (Retrieval-Augmented Generation).

**What's Been Completed:**
1. ✅ **Data Extraction** - 90 documents from Coventry University website
2. ✅ **Backend Structure** - Express.js with TypeScript
3. ✅ **FREE LLM Integration** - Ollama (no API costs!)
4. ✅ **Knowledge Base Ingestion** - All documents embedded and cached

**Key Feature:** Uses Ollama for completely FREE local LLM inference - no API costs!

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Ollama installed (`winget install Ollama.Ollama`)
- Ollama models pulled:
  ```bash
  ollama pull llama3.2
  ollama pull nomic-embed-text
  ```

### Start the Server
```bash
cd backend
npm install        # First time only
npm run ingest     # First time only (generates embeddings)
npm run dev        # Start development server
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "accommodation fees"}'

# Chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What support services are available?"}'
```

---

## 📁 Project Structure

```
backend/
├── data/
│   ├── knowledge_base/           # 10 JSON files with 90 documents
│   └── embeddings_cache.json     # Pre-computed embeddings
├── src/
│   ├── config/
│   │   ├── env.ts                # Environment configuration
│   │   ├── ollama.ts             # FREE local LLM client
│   │   ├── openai.ts             # Optional paid alternative
│   │   └── supabase.ts           # Optional database
│   ├── services/
│   │   ├── chatService.ts        # RAG-powered chat
│   │   ├── embeddingService.ts   # Vector embeddings
│   │   └── knowledgeService.ts   # Knowledge base management
│   ├── routes/
│   │   ├── chat.ts               # POST /api/chat
│   │   ├── search.ts             # POST /api/search
│   │   └── health.ts             # GET /api/health
│   └── index.ts                  # Express server
├── .env                          # Configuration (Ollama mode)
├── package.json
├── test_api.py                   # Python test script
└── README.md
```

---

## 🔧 Configuration

### Current Setup (FREE - Ollama)
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### Alternative (Paid - OpenAI)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

---

## 📚 Knowledge Base Coverage

| Category | Documents | Topics |
|----------|-----------|--------|
| Student Support | 4 | Success coaches, Phoenix+ |
| Academic Support | 6 | Tutors, library, CAW, sigma |
| Health & Wellbeing | 12 | Mental health, disability, medical |
| Fees & Finance | 11 | Tuition, scholarships, cost of living |
| International Students | 14 | Visas, English requirements |
| Accommodation | 9 | Halls, fees, applications |
| Employability | 5 | Careers, placements, global opportunities |
| Applications | 7 | Admissions process |
| Campus Locations | 12 | All campuses and locations |
| General Info | 10 | Contacts, portals, FAQs |

**Total: 90 documents**

---

## 🔌 API Reference

### GET /api/health
Returns system health and LLM status.

**Response:**
```json
{
  "status": "healthy",
  "provider": "ollama",
  "documentsLoaded": 90,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

### POST /api/search
Semantic search across the knowledge base.

**Request:**
```json
{
  "query": "How much does accommodation cost?",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "document": {
        "id": "...",
        "title": "Accommodation Fees",
        "content": "...",
        "url": "https://..."
      },
      "score": 0.8542,
      "category": "Accommodation"
    }
  ]
}
```

### POST /api/chat
Chat with the AI assistant (uses RAG).

**Request:**
```json
{
  "message": "What support services are available for students?",
  "conversationId": "optional-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Coventry University offers various support services...",
  "conversationId": "uuid",
  "sources": [
    { "title": "Student Support Overview", "url": "...", "category": "Student Support" }
  ]
}
```

---

## ⚡ Performance Notes

- **Response Time:** 10-30 seconds on CPU, 2-5 seconds with GPU
- **Memory:** llama3.2 uses ~2-4GB RAM when loaded
- **Embedding Cache:** Pre-computed for instant search

---

## 🎯 Next Steps

1. **Build Frontend** - React/Vue chat interface
2. **Improve Responses** - Add more documents or use larger model
3. **Deploy** - Set up production server with GPU for speed
4. **Optional Supabase** - Enable for user accounts and history

---

## 🐛 Troubleshooting

**Server won't start:**
- Check if Ollama is running: `ollama list`
- Check port 3000 is free

**Slow responses:**
- Normal on CPU - consider GPU
- Use smaller model: `OLLAMA_MODEL=llama3.2:1b`

**Search returns no results:**
- Run `npm run ingest` to regenerate embeddings

---

## 📞 Data Sources

All data extracted from: https://wayfinder.coventry.ac.uk/s/guide
