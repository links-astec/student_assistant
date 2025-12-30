# Coventry Student Assistant - Developer Handoff

## ✅ FRONTEND-BACKEND SYNC STATUS (100% Complete)

All backend endpoints now have corresponding frontend API routes.

### Complete Endpoint Mapping

| Backend Endpoint | Frontend Route | Status |
|-----------------|----------------|--------|
| `POST /api/chat` | `/api/assistant`, `/api/rag/chat`, `/api/llm/plan` | ✅ Connected |
| `GET /api/chat/:conversationId` | `/api/conversation/[conversationId]` | ✅ Connected |
| `DELETE /api/chat/:conversationId` | `/api/conversation/[conversationId]` | ✅ Connected |
| `POST /api/search` | `/api/llm/classify` | ✅ Connected |
| `GET /api/search/categories` | Uses Supabase directly | ✅ Working |
| `POST /api/search/reload` | `/api/admin/reload` | ✅ Connected |
| `POST /api/email/generate` | `/api/llm/draft` | ✅ Connected |
| `GET /api/email/contacts` | `/api/contacts` | ✅ Connected |
| `GET /api/email/contacts/search` | `/api/contacts?q=...` | ✅ Connected |
| `GET /api/email/contacts/category/:cat` | `/api/contacts?category=...` | ✅ Connected |
| `GET /api/email/emergency` | `/api/contacts?emergency=true` | ✅ Connected |
| `GET /api/email/categories` | `/api/email/categories` | ✅ Connected |
| `GET /api/email/subcategories/:cat` | `/api/email/subcategories/[category]` | ✅ Connected |
| `POST /api/feedback` | `/api/feedback` | ✅ Connected |
| `POST /api/feedback/user-info` | `/api/feedback/user-info` | ✅ Connected |
| `POST /api/feedback/resolve` | `/api/feedback` (PUT) | ✅ Connected |
| `GET /api/feedback/session/:id` | `/api/feedback/session/[sessionId]` | ✅ Connected |
| `GET /api/health` | `/api/assistant` | ✅ Connected |
| `GET /api/health/ready` | `/api/health/ready` | ✅ Connected |

### LLM Service Files → Backend

| Frontend Service | Backend Endpoint | Status |
|-----------------|-----------------|--------|
| `lib/diagnosis/llm/classifier.ts` | `POST /api/search` | ✅ |
| `lib/diagnosis/llm/email-drafter.ts` | `POST /api/email/generate` | ✅ |
| `lib/diagnosis/llm/summariser.ts` | `POST /api/chat` | ✅ |
| `lib/diagnosis/llm/question-planner.ts` | `POST /api/chat` | ✅ |

--- Document

## 🎯 Project Overview

A custom AI-powered chatbot for **Coventry University students** that helps with administrative tasks. The system uses:
- **Free Ollama LLM** (llama3.2) - no API costs
- **RAG (Retrieval Augmented Generation)** with 90 embedded university documents
- **Supabase PostgreSQL** for database and analytics
- **Beautiful CampusFlow UI** built by a team member

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Port 3000)                      │
│                  Next.js 14 - CampusFlow UI                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Chat Window │  │ Category   │  │ Result View             │  │
│  │ Messages    │  │ Cards      │  │ Email + Contact         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                              │                                   │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│  ┌─────────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │ /api/chat      │ │ /api/assistant│ │ /api/llm/*        │    │
│  │ (Diagnosis     │ │ (Direct RAG) │ │ (classify/draft/  │    │
│  │  Engine)       │ │              │ │  plan)            │    │
│  └────────┬────────┘ └──────┬──────┘ └──────────┬─────────┘    │
│           │                 │                    │               │
│           ▼                 ▼                    ▼               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Diagnosis Engine (LLM Mode)                    │ │
│  │  - LLMClassifier → Backend /api/search                      │ │
│  │  - LLMEmailDrafter → Backend /api/email/generate           │ │
│  │  - LLMSummariser → Backend /api/chat                       │ │
│  │  - ContactProvider → Supabase (shared DB)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Port 3001)                       │
│               Node.js + Express + TypeScript                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    API Endpoints                             │ │
│  │  POST /api/chat      - RAG chat with Ollama                 │ │
│  │  POST /api/search    - Semantic search (embeddings)         │ │
│  │  POST /api/email/generate - 5W1H email generator            │ │
│  │  GET  /api/email/contacts - Department directory            │ │
│  │  POST /api/feedback  - Analytics logging                    │ │
│  │  GET  /api/health    - Health check                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│              ┌───────────────┴───────────────┐                   │
│              ▼                               ▼                   │
│  ┌─────────────────────────┐  ┌────────────────────────────────┐ │
│  │     Ollama LLM          │  │     Knowledge Base             │ │
│  │  - llama3.2 (chat)      │  │  - 90 embedded documents       │ │
│  │  - nomic-embed-text     │  │  - 768-dim vectors             │ │
│  │    (embeddings)         │  │  - Cosine similarity search    │ │
│  └─────────────────────────┘  └────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Supabase PostgreSQL                         │ │
│  │  - chat_interactions (analytics)                             │ │
│  │  - chat_sessions, chat_state                                 │ │
│  │  - issue_nodes, issue_variants                               │ │
│  │  - contacts, question_nodes                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Korea Business/
├── backend/                          # Node.js + Express backend
│   ├── src/
│   │   ├── index.ts                  # App entry point (port 3001)
│   │   ├── routes/
│   │   │   ├── chat.ts               # RAG chat endpoint
│   │   │   ├── search.ts             # Semantic search endpoint
│   │   │   ├── email.ts              # Email generator + contacts
│   │   │   ├── feedback.ts           # Analytics logging
│   │   │   └── health.ts             # Health checks
│   │   ├── services/
│   │   │   ├── chatService.ts        # Ollama chat + RAG logic
│   │   │   ├── knowledgeService.ts   # Embeddings + search
│   │   │   ├── analyticsService.ts   # Supabase logging
│   │   │   ├── problemClassificationService.ts  # 3-level taxonomy
│   │   │   ├── emailTemplateService.ts          # 5W1H emails
│   │   │   └── contactDirectoryService.ts       # 11 departments
│   │   └── data/
│   │       └── *.json                # 90 embedded documents
│   ├── .env                          # Backend config
│   └── package.json
│
├── frontend/system_prototype/        # Next.js 14 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Main chat UI
│   │   │   ├── layout.tsx            # App layout
│   │   │   └── api/
│   │   │       ├── chat/route.ts     # Diagnosis engine API
│   │   │       ├── assistant/route.ts # Direct RAG chat
│   │   │       ├── contacts/route.ts  # Contacts sync
│   │   │       ├── feedback/route.ts  # Feedback logging
│   │   │       ├── llm/
│   │   │       │   ├── classify/     # LLM classification
│   │   │       │   ├── draft/        # LLM email drafting
│   │   │       │   └── plan/         # LLM question planning
│   │   │       └── rag/chat/         # Direct RAG proxy
│   │   ├── components/               # UI components
│   │   │   ├── ChatWindow.tsx        # Message display
│   │   │   ├── CategoryCards.tsx     # Category selection
│   │   │   ├── StudentInfoForm.tsx   # Student details form
│   │   │   ├── ResultView.tsx        # Final result display
│   │   │   └── ...
│   │   └── lib/
│   │       └── diagnosis/            # Diagnosis engine
│   │           ├── index.ts          # Factory function
│   │           ├── interfaces.ts     # Type definitions
│   │           ├── llm/              # LLM implementations
│   │           │   ├── classifier.ts # → Backend /api/search
│   │           │   ├── email-drafter.ts # → Backend /api/email/generate
│   │           │   └── summariser.ts # → Backend /api/chat
│   │           └── rule-based/       # Fallback implementations
│   ├── .env.local                    # Frontend config
│   └── package.json
│
└── LLM_DEVELOPER_HANDOFF.md          # This document
```

---

## 🔧 Configuration Files

### Backend `.env`
```env
PORT=3001
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434

# Supabase
SUPABASE_URL=https://xgwqdcdbhvwfziyocwoy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend `.env.local`
```env
# Backend connection
BACKEND_URL=http://localhost:3001

# LLM Mode (rule = fallback, llm = use backend RAG)
DIAGNOSIS_MODE=llm
DRAFTER_MODE=llm

# Supabase (shared with backend)
NEXT_PUBLIC_SUPABASE_URL=https://xgwqdcdbhvwfziyocwoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 How to Run

### Prerequisites
1. **Ollama** installed and running
   - Download from: https://ollama.ai
   - Pull models: `ollama pull llama3.2` and `ollama pull nomic-embed-text`
   
2. **Node.js** v18+ installed

### Start the Servers

```bash
# Terminal 1: Start Backend (port 3001)
cd "C:\Users\Gabriel\Desktop\projects\Korea Business\backend"
npm run dev

# Terminal 2: Start Frontend (port 3000)
cd "C:\Users\Gabriel\Desktop\projects\Korea Business\frontend\system_prototype"
npm run dev
```

### Access Points
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Test Page**: http://localhost:3001/test

---

## 📊 Knowledge Base

The system has **90 embedded documents** covering:

| Category | Documents | Topics |
|----------|-----------|--------|
| Student Support | 12 | General services, wellbeing, disability |
| Academic Support | 8 | PASS, Study skills, Academic writing |
| Health & Wellbeing | 11 | Mental health, Counselling, NHS |
| Fees & Finance | 10 | Tuition, Payments, Scholarships |
| International Students | 9 | Visas, UKVI, Immigration |
| Accommodation | 10 | Housing, Maintenance, Contracts |
| Careers | 10 | Job search, CV help, Add+vantage |
| Applications | 10 | Admissions, Clearing, Entry requirements |
| Campus Info | 10 | Facilities, Libraries, Sport |

### Adding New Documents

1. Add JSON files to `backend/src/data/`
2. Run ingestion: `npm run ingest`
3. Restart backend

---

## 🎨 User Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    1. LANDING PAGE                           │
│  Welcome message + Category cards (8 categories)             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  2. STUDENT INFO FORM                        │
│  Collect: Name, Student ID, Programme                        │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  3. SUBCATEGORY SELECTION                    │
│  Pick specific area (optional - can skip)                    │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  4. QUESTIONING PHASE                        │
│  LLM asks follow-up questions to understand issue            │
│  (Uses RAG to generate relevant questions)                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  5. CONFIRMATION                             │
│  "Is this correct?" - Summary of understood issue            │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  6. RESULT VIEW                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Issue Summary  │  │ Email Draft    │  │ Contact Info   │ │
│  │ from RAG       │  │ (5W1H format)  │  │ + Copy buttons │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 📧 5W1H Email Format

The system generates professional emails using the **5W1H framework**:

```
SUBJECT: [Category] - [Issue Summary]

Dear [Department],

WHO: I am [Student Name], [Student ID], studying [Programme].

WHAT: [Concise description of the issue]

WHEN: [When the issue occurred or deadline]

WHERE: [Relevant location/platform]

WHY: [Why this is urgent/important]

HOW: [What resolution is being requested]

Thank you for your assistance.

Best regards,
[Student Name]
```

---

## 📞 Department Contacts

The system includes 11 department contacts:

| Department | Email | Phone |
|------------|-------|-------|
| Student Hub | studenthub@coventry.ac.uk | +44 (0)24 7765 5700 |
| International Support | international@coventry.ac.uk | +44 (0)24 7765 5700 |
| Finance Office | studentfinance@coventry.ac.uk | +44 (0)24 7765 2000 |
| Academic Registry | registry@coventry.ac.uk | +44 (0)24 7765 4700 |
| Accommodation | accommodation@coventry.ac.uk | +44 (0)24 7765 4600 |
| IT Support | itsupport@coventry.ac.uk | +44 (0)24 7765 5050 |
| Disability Support | disability@coventry.ac.uk | +44 (0)24 7765 5050 |
| Counselling | counselling@coventry.ac.uk | +44 (0)24 7765 5050 |
| Careers Service | careers@coventry.ac.uk | +44 (0)24 7765 5050 |
| Library Services | library@coventry.ac.uk | +44 (0)24 7765 5050 |
| Admissions | admissions@coventry.ac.uk | +44 (0)24 7765 2222 |

---

## 📈 Analytics (Supabase)

All interactions are logged to Supabase for analytics:

### `chat_interactions` Table
```sql
- id (uuid)
- session_id (text)
- user_message (text)
- assistant_response (text)
- category (text)
- subcategory (text)
- classification_confidence (float)
- suggested_department (text)
- sources_used (jsonb)
- created_at (timestamp)
```

---

## 🔌 API Endpoints

### Backend (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | RAG chat - main AI endpoint |
| POST | `/api/search` | Semantic search in knowledge base |
| POST | `/api/email/generate` | Generate 5W1H email |
| GET | `/api/email/contacts` | Get all department contacts |
| GET | `/api/email/contacts/category/:category` | Get contacts by category |
| POST | `/api/feedback` | Log user feedback |
| GET | `/api/health` | Health check |

### Frontend (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Diagnosis engine orchestrator |
| POST | `/api/assistant` | Direct RAG chat proxy |
| POST | `/api/llm/classify` | LLM classification |
| POST | `/api/llm/draft` | LLM email drafting |
| POST | `/api/llm/plan` | LLM question planning |
| POST | `/api/rag/chat` | Direct RAG proxy |
| POST | `/api/feedback` | Feedback logging proxy |
| GET | `/api/contacts` | Contacts sync |

---

## ⚙️ Key Services

### 1. RAG Chat (`chatService.ts`)
- Finds relevant documents using semantic search
- Builds context from top 5 results
- Sends to Ollama with system prompt
- Returns response + sources + classification

### 2. Knowledge Service (`knowledgeService.ts`)
- Manages 90 embedded documents
- Uses nomic-embed-text for 768-dim embeddings
- Cosine similarity search
- Caches embeddings for fast startup

### 3. Problem Classification (`problemClassificationService.ts`)
- 3-level taxonomy: Category → Subcategory → Specific Issue
- 7 main categories
- Confidence scoring
- Department routing

### 4. Email Template Service (`emailTemplateService.ts`)
- 5W1H format generation
- Student info integration
- Department-specific addressing

### 5. Contact Directory (`contactDirectoryService.ts`)
- 11 department contacts
- Category-based lookup
- Emergency contacts

---

## 🧪 Testing

### Quick Tests

```bash
# Health check
curl http://localhost:3001/api/health

# Test chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I pay my tuition fees?"}'

# Test search
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "visa application", "limit": 5}'
```

### Test Page
Open http://localhost:3001/test in browser for interactive testing.

---

## 🚧 Known Issues & Solutions

1. **Ollama not responding**
   - Ensure Ollama is running: `ollama serve`
   - Check if models are pulled: `ollama list`

2. **Empty responses**
   - Check knowledge base has documents: Look at startup logs
   - Verify embeddings are cached

3. **Supabase connection issues**
   - Verify credentials in `.env`
   - Check Supabase dashboard for connection status

---

## 🔮 Future Enhancements

1. **More documents** - Add more university data
2. **Conversation memory** - Multi-turn context
3. **Voice input** - Speech-to-text
4. **Mobile app** - React Native version
5. **Admin dashboard** - Analytics visualization
6. **Fine-tuning** - Custom Ollama model on university data

---

## 👥 Team

- **Backend + RAG**: Built with AI assistance
- **Frontend (CampusFlow)**: Team member's Next.js implementation
- **Data**: Extracted from Coventry University website

---

## 📝 License

This project is for educational purposes at Coventry University.

---
*Last updated: December 2024*