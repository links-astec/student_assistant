# Coventry University Student Assistant

An AI-powered chatbot that helps University students navigate administrative queries using local language models and a knowledge base.

## Features

- Interactive chat interface for student support
- Category-based guidance for common administrative issues
- AI-driven responses using local Ollama models (no API costs)
- Knowledge base integration with university documents
- Student information collection and tracking
- Email template generation for professional communication

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase
- **AI Models**: Ollama (Llama 3.2, Nomic Embed)
- **Deployment**: Vercel, Railway

## Installation

### Prerequisites
- Node.js 18+
- Ollama installed and running
- npm or yarn

### Setup
1. Install Ollama and pull models:
   ```bash
   # Install Ollama (Windows)
   winget install Ollama.Ollama
   
   # Pull required models
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

2. Clone the repository
3. Install dependencies for backend and frontend:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```
4. Configure environment variables (see backend/config/env.ts)
5. Ingest knowledge base (first time only):
   ```bash
   cd backend
   npm run ingest
   ```
6. Start the development servers:
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev
   ```
7. Open http://localhost:3000

## Deployment

The application is configured for deployment on Vercel and Railway. Use the provided scripts in the root directory for deployment.
