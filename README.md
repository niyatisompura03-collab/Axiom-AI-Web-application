# AI Chatbot Project

This is a personalized AI chatbot project that uses the **Groq API** (powered by the `openai/gpt-oss-120b` model) to provide intelligent responses. It integrates **MongoDB** to persist conversations, includes memory capabilities using **Sentence Transformers** for context-aware interactions, and employs an **agentic architecture** to route tasks to specialized tools.

## Features & Progress
- **Conversational AI**: Uses Groq's high-performance API and `openai/gpt-oss-120b` for fast, high-quality responses.
- **Conversation History**: Saves user and assistant messages in a MongoDB database so the bot remembers the context of the chat.
- **Memory & Context (RAG)**: Integrates sentence embeddings, along with memory extraction and classification, to search for relevant past memories and inject them into the chat context.
- **Agentic Architecture (New!)**: Implemented an intelligent routing system (`agent_router.py`) that delegates specific tasks to specialized agents.
- **Calculator Agent**: Automatically handles and evaluates mathematical expressions.
- **Date/Time Agent**: Provides accurate current date and time information, including relative dates (e.g., "tomorrow", "yesterday").
- **Automatic Chat Title Generation**: New titles are generated for each conversation using the `groq/compound-mini` model, giving each chat a meaningful heading.
- **Profile Editing Enhancements**: Added a date picker with validation that disallows birth dates after 2016, ensuring realistic user ages.
- **Advanced Memory Management**: Further enhancements to long-term memory retrieval and context injection.

## Future Improvements
- **Web Search Agent**: Will be adding a new agent that can browse the web in real-time to answer general knowledge queries and fetch live data.
- **Expanded Agent Ecosystem**: Integrating more specialized tools and APIs to handle complex, multi-step tasks.

## Prerequisites
Before you begin, ensure you have the following installed:
- [Python 3.8+](https://www.python.org/downloads/)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas cloud cluster)
- A [Groq API Key](https://console.groq.com/)

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd path/to/Axiom
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv .venv
   
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

You need to set up your environment variables for the API keys and database connection.

1. Open the existing `.env` file or create a new one in the root of the project directory.
2. Add/verify the following variables in the `.env` file:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   MONGODB_URI=mongodb://localhost:27017/  # Or your MongoDB Atlas connection string
   ```

## How to Run

To start the interactive AI chatbot, run the main application file from your terminal:

```bash
python app.py
```

- **Chatting**: Type your messages after the `You: ` prompt and press Enter. The router will automatically detect if you are asking a math or date/time question and route it to the appropriate agent.
- **Exiting**: Type `exit` and press Enter to stop the chatbot.

## Project Structure
- `app.py`: The main entry point containing the interactive CLI chat loop.
- `agent_router.py`: Routes user messages to the correct specialized agent.
- `agents/`: Directory containing specialized tools (e.g., `calculator.py`, `dateTime_tool.py`).
- `database.py`: Handles the MongoDB connection, saving, and retrieving conversation history.
- `memory.py`, `memory_extractor.py`, `memory_classifier.py`: Handle fact extraction, memory classification, and semantic searching of previous context.
- `embeddings.py`: Manages the sentence embeddings generation.
- `requirements.txt`: Lists all Python dependencies required for the project.
