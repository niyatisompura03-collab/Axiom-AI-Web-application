# Axiom – AI Web Application

Axiom is an AI-powered web application designed to provide conversational AI with memory, personalization, and intelligent tool capabilities.

## Features

- AI-powered conversational chat with an intelligent multi-intent agent router
- Advanced User Authentication (Login, Signup, Password Recovery/Reset)
- Persistent conversation history & Long-term memory system
- Memory classification and retrieval for personalized AI responses
- User profile management & preferences
- Enhanced UI/UX (Custom Cursor, Theme support, Settings/Appearance customization-still in progress)
- Message editing & interactive Chat UI(still in progress)
- Image support in chat 
- Integrated AI Tools:
  - Calculator tool
  - Date and time tool
  - Web search tool (Tavily)
  - Document analysis tool (Groq Qwen3.6-27b)
- Secure environment-based configuration
- FastAPI backend with Swagger API documentation & robust testing suite
- Next.js frontend with React components

## Current Development Status

The project is currently in the **Auth V2 & UI/UX Enhancement Phase**, focusing on:
- **Authentication V2**: Implementing comprehensive authentication flows including Login, Signup, Forgot Password, and Reset Password pages.
- **Agent Capabilities**: Upgraded the AI agent router to handle multi-intent requests, capable of detecting and executing multiple tool calls simultaneously.
- **UI/UX Polishing**: Adding theme initialization, custom cursors, and modular modals (Settings, Profile, Help).
- **Backend Testing & Verification**: Integrating rigorous test suites (`test_phase3_5`, `test_regression`, etc.) and a robust verifier for agent response validation.

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