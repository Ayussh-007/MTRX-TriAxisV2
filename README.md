# 🎓 MTRX-TriAxis — AI-Powered Classroom Assistant

> Smarter teaching, personalised learning — powered by local LLMs (Ollama), RAG, and real-time analytics.

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Smart PDF Processing** | Upload curriculum PDFs — AI extracts, cleans and chunks content |
| 🧠 **RAG-Powered Q&A** | Curriculum-grounded answers via Retrieval Augmented Generation |
| 📝 **Auto Quiz Generator** | Generate MCQ quizzes, auto-track scores per student |
| 🎯 **Personalised Paths** | AI builds custom study plans based on weak/strong topics |
| 📋 **Attendance Register** | Interactive calendar grid — click to toggle P/A per day |
| 👩‍🏫 **Teacher Dashboard** | Class analytics, risk heatmap, AI teaching suggestions |
| 🖥️ **Slide Maker** | Generate ready-to-present PowerPoint from curriculum topics |
| 🌤️ **Weather-Aware** | Weather integration adjusts lesson recommendations |
| 🤖 **Multi-Step AI Agent** | Chain-of-thought reasoning across your entire curriculum |
| 📅 **Smart Calendar** | Holiday awareness with AI planning suggestions |
| 🔐 **Student Portal** | Individual student login with personal dashboard |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│  React Frontend (Vite)    →  http://localhost:5173 │
│  ├── Sidebar + Router                             │
│  └── 10 pages (Home, Attendance, Quiz, etc.)      │
└────────────────┬─────────────────────────────────┘
                 │  Axios → /api/*
┌────────────────▼─────────────────────────────────┐
│  FastAPI Backend           →  http://localhost:8000 │
│  ├── api/routes/{students, attendance, quiz, ...} │
│  └── backend/{student_model, quiz_engine, ...}    │
├───────────────────────────────────────────────────┤
│  SQLite (data/classroom.db)                        │
│  FAISS Vector Store (data/vectorstore/)             │
│  Ollama (Gemma 4 E4B at localhost:11434)            │
└───────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** (for React frontend)
- **Ollama** (local LLM server)

### 1. Clone & Setup Python

```bash
git clone https://github.com/Ayussh-007/MTRX-TriAxisV2.git
cd MTRX-TriAxisV2

# Create virtual environment
python -m venv .venv
source .venv/bin/activate    # macOS/Linux
# .venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Install Ollama & Pull Models

```bash
# Install Ollama (macOS)
curl -fsSL https://ollama.com/install.sh | sh

# Pull the LLM and embedding models
ollama pull gemma4:e4b
ollama pull nomic-embed-text

# Start Ollama server
ollama serve
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env — key settings:
#   OLLAMA_MODEL=gemma4:e4b
#   OPENWEATHER_API_KEY=your_key_here
```

### 4. Install React Frontend

```bash
cd frontend
npm install
cd ..
```

### 5. Run the Application

Open **two terminals**:

```bash
# Terminal 1 — Backend (FastAPI)
uvicorn api.main:app --reload --port 8000
```

```bash
# Terminal 2 — Frontend (React)
cd frontend
npm run dev
```

📌 Open **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
MTRX-TriAxisV2/
├── api/                    # FastAPI REST backend
│   ├── main.py             # App entry, CORS, router mount
│   └── routes/             # Route modules
│       ├── students.py     # Student CRUD + dashboards
│       ├── attendance.py   # Grid, save, summary
│       ├── quiz.py         # Generate & evaluate quizzes
│       ├── curriculum.py   # PDF upload & topics
│       ├── teacher.py      # Analytics, risk, suggestions
│       ├── slides.py       # PPTX generation
│       ├── agent.py        # AI agent
│       ├── auth.py         # Student login
│       ├── sharing.py      # Content sharing
│       ├── calendar.py     # Holidays & planning
│       └── system.py       # Health check
├── backend/                # Core business logic (no HTTP)
│   ├── student_model.py    # SQLite data layer
│   ├── quiz_engine.py      # Quiz gen & evaluation
│   ├── rag_pipeline.py     # RAG with FAISS
│   ├── slide_generator.py  # PPTX builder
│   ├── ai_agent.py         # Multi-step agent
│   └── ... (12 more modules)
├── frontend/               # React (Vite) frontend
│   ├── src/
│   │   ├── pages/          # 10 page components
│   │   ├── components/     # Sidebar, shared UI
│   │   ├── styles/         # Global CSS design system
│   │   └── api/            # Axios HTTP client
│   ├── package.json
│   └── vite.config.js
├── prompts/                # LLM prompt templates
├── data/                   # SQLite DB, vectorstore, uploads
├── requirements.txt
└── .env
```

---

## 🎮 Usage

### Teacher Workflow
1. **Upload Curriculum** → Upload a PDF textbook → AI processes it
2. **Add Students** → Student Manager → Add with Login ID
3. **Mark Attendance** → Click the calendar grid → Save
4. **Take Quiz** → Select topic → Generate → Students answer → Auto-scored
5. **View Dashboard** → Class analytics, risk levels, AI suggestions
6. **Generate Slides** → Pick topic → Download .pptx

### Student Workflow
1. **Login** → Name + Login ID
2. **View Portal** → Scores, attendance, weak topics
3. **Generate Learning Path** → AI creates a personalised study plan

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router, Recharts |
| **Backend API** | FastAPI, Uvicorn |
| **LLM** | Ollama (Gemma 4 E4B) |
| **Embeddings** | nomic-embed-text via Ollama |
| **Vector Store** | FAISS |
| **Database** | SQLite |
| **PDF Processing** | PyMuPDF |
| **Presentations** | python-pptx |

---

## 📄 API Documentation

FastAPI auto-generates interactive API docs:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 👨‍💻 Built By

**Ayush Mhatre** — [GitHub](https://github.com/Ayussh-007)

---

*MTRX-TriAxis v2.0 — React + FastAPI Edition*
