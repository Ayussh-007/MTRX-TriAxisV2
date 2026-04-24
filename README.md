<div align="center">
  <h1>🎓 MTRX-TriAxis</h1>
  <p><strong>AI-Powered, Context-Aware Classroom Assistant</strong></p>
  <p><i>Smarter teaching, personalized learning.</i></p>
</div>

---

## 📌 Overview
MTRX-TriAxis transforms the traditional classroom by integrating large language models (LLMs) and Retrieval-Augmented Generation (RAG). Built primarily with Python and Streamlit, it bridges the gap between static curricula and dynamic, personalized learning. 

It empowers teachers with automated assessments, deep class analytics, and context-aware lesson planning (integrating real-time weather and holiday calendars). For students, it provides tailored learning paths and curriculum-grounded automated doubt resolution.

## ✨ Core Features
*   **📚 RAG Curriculum Pipeline:** Upload textbooks/PDFs. The AI intelligently processes and indexes the content offline.
*   **🧠 Intelligent Quiz Engine:** Dynamically generates multiple-choice questions from the uploaded syllabus. It evaluates students and instantly records their performance.
*   **👩‍🏫 Teacher Dashboard:** Visualises class averages and attendance rates. Automatically aggregates class-wide weaknesses into targeted "Doubt Resolution Sheets".
*   **🌤️ Context-Aware Intelligence:** Integrates with OpenWeatherMap and calendars. If there's a heavy storm or an upcoming major holiday, the AI intelligently suggests lighter interactive or revision-focused sessions.
*   **🎒 Student Portal:** Secure login providing students with performance trendlines, personalized study paths to fix their weak areas, and a dedicated AI chat terminal for resolving doubts natively grounded in their syllabus.
*   **🤖 Multi-Step AI Agent:** A specialized Chain-of-Thought agent capable of deep data analysis (e.g., cross-referencing low math scores with absence streaks to diagnose root causes).

## ⚙️ Tech Stack
*   **Frontend:** Streamlit with custom CSS (Dark-mode, Glassmorphism UI)
*   **Backend:** Python 3.9+
*   **Local LLM Runtime:** Ollama (`mistral` for generation, `nomic-embed-text` for embeddings)
*   **RAG Engine:** LangChain + FAISS (Facebook AI Similarity Search)
*   **Database:** SQLite
*   **APIs:** OpenWeatherMap API

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have Python 3.9+ installed on your machine.
You must also have [Ollama](https://ollama.com/) installed and running locally.

### 2. Setup Ollama
Install Ollama, start the server, and pull the required models:

**Mac / Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull mistral
ollama pull nomic-embed-text
ollama serve
```

**Windows:**
```powershell
# Download and run the installer from https://ollama.com/download/windows
# Then open a terminal (cmd or PowerShell) and run:
ollama pull mistral
ollama pull nomic-embed-text
ollama serve
```

### 3. Clone and Setup Project
```bash
# Clone the repository
git clone https://github.com/Ayussh-007/MTRX-TriAxis.git
cd MTRX-TriAxis

# Install Python dependencies
pip install -r requirements.txt

# Setup your environment variables
cp .env.example .env
```
Open the `.env` file and add your OpenWeatherMap API key:
`OPENWEATHERMAP_API_KEY=your_api_key_here`

### 4. Run the Application
Start the Streamlit server:

**Mac / Linux:**
```bash
python3 -m streamlit run app.py
```

**Windows (cmd / PowerShell):**
```powershell
python -m streamlit run app.py
```
*The app will automatically launch in your browser at `http://localhost:8501`*

---

## 📖 Usage Flow
1. **Teacher Setup:** Enter Teacher Mode. Go to **Upload Curriculum** and upload a textbook PDF. Next, navigate to the **Student Manager** and register a few students. 
2. **Assignments:** Go to **Quiz Generator** to generate and assign MCQ tasks based on the uploaded syllabus.
3. **Student Learning:** Log out and log in via the **Student Login**. Students can attempt the assigned quizzes, track their progress, and ask questions to the embedded RAG AI.
4. **Insights:** Re-enter Teacher Mode and utilize the **Teacher Dashboard** or the **AI Agent** for deep analytics based on the newly recorded student data.

## 🔒 Privacy First
MTRX-TriAxis utilizes local FAISS vector stores and Ollama LLM rendering. This ensures that proprietary school curriculum and sensitive student data remain completely resident on your own hardware, never being dispatched to third-party cloud LLM providers.
