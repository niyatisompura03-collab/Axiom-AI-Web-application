# Axiom – AI Web Application

Axiom is an AI-powered web application designed to provide conversational AI with memory, personalization, and intelligent tool capabilities.

## Features

- AI-powered conversational chat
- User authentication
- Persistent conversation history
- Long-term memory system
- Memory classification and retrieval
- Personalized AI responses
- User profile management
- Settings and appearance customization
- Message editing
- Calculator tool
- Date and time tool
- Web search tool
- Secure environment-based configuration
- FastAPI backend with Swagger API documentation
- Next.js frontend

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- CSS Modules

### Backend
- Python
- FastAPI
- Uvicorn

### AI
- Groq API
- LLM-based conversational system
- Sentence-transformer embeddings

### Database
- MongoDB

### External Services
- Tavily – web search
- Hugging Face – embedding model resources

## Project Structure

```text
Axiom/
├── backend/
│   ├── agents/
│   ├── core/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── tests/
│
├── frontend/
│   ├── app/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── public/
│   └── utils/
│
├── .env.example
├── .gitignore
├── package.json
├── requirements.txt
└── README.md