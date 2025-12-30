# CampusFlow - Coventry University Student Assistant

AI-powered student support chatbot for Coventry University, helping students with accommodation, fees, courses, and university services.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Ollama (for local AI)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd campusflow
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📦 Deployment

### Option 1: Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy:**
   ```bash
   npm run deploy:vercel
   ```

### Option 2: Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Or build manually:**
   ```bash
   docker build -t campusflow .
   docker run -p 3000:3000 campusflow
   ```

### Option 3: Cloudflare Workers

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Deploy:**
   ```bash
   npm run deploy:worker
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | Production |

### SEO Configuration

The app includes comprehensive SEO optimization:
- Meta tags for search engines
- Open Graph for social media
- Twitter Cards
- Structured data (JSON-LD)
- Sitemap and robots.txt

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

#### Option A: Using Supabase Dashboard (Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in the dashboard
3. Run the migration:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute in SQL Editor
4. Seed the database:
   - Copy contents of `supabase/seed.sql`
   - Paste and execute in SQL Editor
5. Get your credentials from **Settings > API**:
   - Project URL
   - `anon` public key

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Push schema
supabase db push

# Seed data
supabase db execute --file ./supabase/seed.sql
```

### 3. Configure Environment Variables

Create `.env.local` for local development:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

DIAGNOSIS_MODE=rule
DRAFTER_MODE=template
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Cloudflare Workers

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 2. Set Secrets

```bash
# Set Supabase credentials as secrets (not in wrangler.toml)
wrangler secret put SUPABASE_URL
# Enter your Supabase URL when prompted

wrangler secret put SUPABASE_ANON_KEY
# Enter your Supabase anon key when prompted
```

### 3. Build for Workers

```bash
npm run build:worker
```

### 4. Preview Locally

```bash
npm run preview
```

### 5. Deploy to Production

```bash
npm run deploy
```

Your app will be available at `https://campusflow.<your-subdomain>.workers.dev`

---

## Environment Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `DIAGNOSIS_MODE` | No | `rule` (default) or `llm` |
| `DRAFTER_MODE` | No | `template` (default) or `llm` |

### Cloudflare Environments

```bash
# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main chat UI
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Tailwind styles
│   └── api/
│       ├── chat/route.ts           # POST /api/chat (orchestrator)
│       ├── bootstrap/route.ts      # GET /api/bootstrap (taxonomy)
│       └── llm/*/route.ts          # LLM stubs (future)
├── components/
│   ├── ChatWindow.tsx              # Message bubbles
│   ├── QuickReplies.tsx            # Quick reply buttons
│   ├── SlotForm.tsx                # Text inputs for slots
│   ├── MessageInput.tsx            # Main text input
│   └── result/                     # Result cards
│       ├── DiagnosisSummaryCard.tsx
│       ├── ContactCard.tsx
│       └── EmailDraftCard.tsx
└── lib/
    ├── diagnosis/
    │   ├── interfaces.ts           # LLM-ready abstractions
    │   ├── index.ts                # Engine factory
    │   ├── rule-based/             # Keyword-based implementations
    │   └── llm/                    # LLM stubs (fallback to rule-based)
    └── supabase/
        ├── client.ts               # Server-side Supabase client
        └── types.ts                # TypeScript types

supabase/
├── migrations/
│   └── 001_initial_schema.sql      # Database schema
├── seed.sql                        # MVP seed data
└── config.toml                     # Local dev config
```

---

## API Reference

### POST /api/chat

Main orchestrator endpoint for all chat interactions.

**Request:**

```json
{
  "actionType": "start" | "message" | "answer" | "confirm",
  "sessionId": "uuid (optional, required after start)",
  "userMessage": "string (for 'message' action)",
  "answer": {
    "type": "quickReply" | "text",
    "value": "string"
  },
  "confirmed": true | false
}
```

**Response:**

```json
{
  "sessionId": "uuid",
  "botMessages": [{ "role": "assistant", "content": "string" }],
  "quickReplies": [{ "id": "string", "label": "string", "value": "string" }],
  "slotRequest": {
    "slotKeys": ["student_name"],
    "hints": { "student_name": "Enter your full name" }
  },
  "result": {
    "issueKey": "id_card_pickup",
    "summary": "You need help with: ID Card Pickup",
    "slots": { "urgency": "within_week" },
    "contact": {
      "departmentName": "Student Services",
      "emails": ["idcard@university.edu"],
      "phones": ["+1-555-123-4567"],
      "hoursText": "Mon-Fri 9AM-5PM",
      "links": ["https://..."]
    },
    "emailDraft": {
      "subject": "Student ID Card Pickup Request",
      "body": "Dear Team,\n\n**WHO:** I am..."
    }
  }
}
```

### GET /api/bootstrap

Returns taxonomy snapshot for client-side caching.

---

## MVP Scenarios

The seed data includes two issue flows:

### 1. ID Card Pickup
- For students picking up first or replacement ID card
- 3 follow-up questions
- Contact: Student Services - ID Card Office

### 2. ID Card Replacement (Lost/Stolen)
- For students who lost their ID card
- 3 follow-up questions
- Includes security reporting guidance

Each flow includes:
- Quick reply questions
- Contact information
- 5W1H email template with placeholders

---

## Future LLM Integration

The codebase is designed for easy LLM integration:

1. Set environment flags:
   ```env
   DIAGNOSIS_MODE=llm
   DRAFTER_MODE=llm
   ```

2. Implement the LLM providers in `src/lib/diagnosis/llm/`:
   - `classifier.ts` - Replace keyword matching with LLM classification
   - `question-planner.ts` - Dynamic question generation
   - `email-drafter.ts` - LLM-generated emails
   - `summariser.ts` - Natural language summaries

3. The stub implementations currently fall back to rule-based logic.

---

## Security Notes

- UI **never** calls Supabase directly
- All DB operations happen in server route handlers
- Client only holds `sessionId`
- Secrets stored via Cloudflare Wrangler (not in code)
- Supabase Row Level Security can be added for multi-tenant use

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for Node.js
npm run build:worker # Build for Cloudflare Workers
npm run preview      # Preview Workers build locally
npm run deploy       # Deploy to Cloudflare
npm run lint         # Run ESLint
```

---

## License

Private - All rights reserved
