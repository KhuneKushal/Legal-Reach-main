<div align="center">

# ⚖️ Legal Reach

**A full-stack platform connecting clients with legal professionals — powered by a local AI RAG chatbot.**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)](https://python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-RAG-1C3C3C)](https://langchain.com/)
[![Ollama](https://img.shields.io/badge/Ollama-llama3.2-black)](https://ollama.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📜 Overview

**Legal Reach** bridges the gap between individuals seeking legal help and certified legal professionals. The platform provides a centralized hub for searching, booking, and conducting legal consultations — including real-time video/audio calling and an AI-powered legal assistant that answers questions from your own uploaded documents.

The project is organized into **three independent services** that work together:

| Service | Description |
| :--- | :--- |
| `frontend/` | React 19 + Vite SPA — the client-facing UI |
| `backend/` | Node.js + Express REST API & Socket.IO server |
| `ragbot/LocalAIAgentWithRAG-main/` | Python RAG chatbot (runs fully locally via Ollama) |

---

## ✨ Key Features

### 👤 Client Module

- **Secure Auth** — JWT-based login/register with bcrypt password hashing
- **Lawyer Search** — Filter by specialization, location, fees, and rating
- **Appointment Booking** — Real-time calendar slot selection
- **Document Vault** — Upload legal documents (stored via Cloudinary)
- **AI Legal Assistant (RAG Bot)** — Query a legal knowledge base *or* your own uploaded PDFs
- **Video & Audio Calls** — Peer-to-peer WebRTC calls via PeerJS / Simple-Peer
- **Live Chat** — Real-time messaging via Socket.IO

### 🧑‍⚖️ Lawyer Module

- Professional profile management (bar council ID, fees, availability)
- Calendar scheduling for appointments
- Case & appointment dashboard
- Secure client document access

### 🤖 RAG Bot

- Fully **offline** — no OpenAI key needed; runs locally using **Ollama**
- **Two query modes:**
  - **Knowledge Base mode** — queries pre-loaded legal documents (Constitution of India, etc.)
  - **Session mode** — upload any PDF and query it on the fly (in-memory per session)
- Embeddings: **`mxbai-embed-large`** via Ollama
- LLM: **`llama3.2`** via Ollama
- Custom in-memory vector store with cosine similarity (NumPy)
- Served as a lightweight HTTP API (`worker_server.py`) on port `8008`

---

## 🛠️ Tech Stack

### Frontend

| Library | Version | Purpose |
| :--- | :---: | :--- |
| React | 19 | UI framework |
| Vite | 7 | Build tool & dev server |
| React Router DOM | 7 | Client-side routing |
| React Redux | 9 | Global state management |
| Axios | 1 | HTTP client |
| Socket.IO Client | 4 | Real-time communication |
| PeerJS / Simple-Peer | latest | WebRTC video & audio |
| Lucide React | 0.5 | Icon library |
| Tailwind CSS | 4 | Utility-first styling |

### Backend

| Library | Version | Purpose |
| :--- | :---: | :--- |
| Node.js | 18+ | JavaScript runtime |
| Express | 5 | REST API framework |
| Mongoose | 9 | MongoDB ODM |
| Socket.IO | 4 | WebSockets — chat & signaling |
| jsonwebtoken | 9 | JWT authentication |
| bcryptjs | 3 | Password hashing |
| Cloudinary | 2 | File & document storage |
| Multer | 2 | File upload middleware |
| Nodemailer | 7 | Email notifications |
| selfsigned | 5 | HTTPS in development |

### RAG Bot (Python)

| Library | Version | Purpose |
| :--- | :---: | :--- |
| Python | 3.9+ | Runtime |
| LangChain | ≥ 0.0.350 | RAG pipeline orchestration |
| langchain-ollama | latest | Ollama LLM & embeddings |
| langchain-core | latest | Core abstractions |
| langchain-text-splitters | latest | Document chunking |
| Ollama `llama3.2` | — | Local LLM inference |
| Ollama `mxbai-embed-large` | — | Local embeddings |
| pypdf | ≥ 4 | PDF text extraction |
| python-docx | ≥ 1 | DOCX text extraction |
| NumPy | ≥ 1.21 | Vector math (cosine similarity) |
| python-dotenv | ≥ 1 | Environment configuration |

### Infrastructure

| Tool | Purpose |
| :--- | :--- |
| MongoDB | NoSQL database |
| Cloudinary | Document & image storage |
| Ollama | Local LLM & embedding server |

---

## 📂 Project Structure

```
Legal-Reach-main/
├── backend/                          # Node.js API server
│   ├── config/                       # DB connection config
│   ├── middleware/                   # Auth & socket middleware
│   ├── models/                       # Mongoose schemas
│   ├── routes/
│   │   ├── ragRoutes.js              # Proxy routes to RAG bot
│   │   ├── callRoutes.js             # Video/audio call signaling
│   │   └── chatRoutes.js             # Chat messages
│   ├── utils/                        # Helper utilities
│   ├── index.js                      # Server entry point
│   ├── seedData.js                   # DB seed script
│   └── package.json
│
├── frontend/                         # React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── RagbotWidget.jsx      # AI chat floating widget
│       │   ├── AudioVideoCall.jsx    # WebRTC call UI
│       │   └── FeaturedLawyers.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── LawyerDashboard.jsx
│       │   ├── LawyerDetails.jsx
│       │   ├── VideoCall.jsx
│       │   ├── VoiceCall.jsx
│       │   └── ChatPage.jsx
│       ├── utils/                    # socket.js, config.js
│       └── App.jsx
│
└── ragbot/
    └── LocalAIAgentWithRAG-main/     # Python RAG service
        ├── legal_documents/
        │   ├── pdfs/                 # Drop PDF files here
        │   ├── docx/                 # Drop DOCX files here
        │   └── txt/                  # Drop TXT files here
        ├── vectorstore/              # Auto-generated (gitignored)
        ├── main.py                   # Core RAG pipeline & CLI
        ├── worker_server.py          # HTTP API server (port 8008)
        ├── vector.py                 # Custom vector store
        ├── document_processor.py     # PDF/DOCX/TXT ingestion
        ├── config.py                 # Configuration dataclasses
        ├── requirements.txt          # Python dependencies
        └── .env.example              # Config template
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Link |
| :--- | :---: | :--- |
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| Python | 3.9+ | [python.org](https://python.org) |
| MongoDB | any | [mongodb.com](https://mongodb.com) or Atlas |
| Ollama | latest | [ollama.com](https://ollama.com) |
| Git | any | [git-scm.com](https://git-scm.com) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/KhuneKushal/Legal-Reach-main.git
cd Legal-Reach-main
```

---

### Step 2 — Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/legalreach

JWT_SECRET=your_super_secret_jwt_key_here

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Start the server:

```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

> Runs on **`https://localhost:5000`** (self-signed SSL in dev)

---

### Step 3 — Setup the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_BACKEND_URL=https://localhost:5000
VITE_RAG_URL=http://localhost:8008
```

Start the dev server:

```bash
npm run dev
```

> Runs on **`https://localhost:5173`**

---

### Step 4 — Setup the RAG Bot

#### 4.1 Install Ollama & Pull Models

Download and install [Ollama](https://ollama.com/download), then pull the required models:

```bash
# LLM for answering questions
ollama pull llama3.2

# Embedding model for semantic search
ollama pull mxbai-embed-large
```

Verify both are available:

```bash
ollama list
```

#### 4.2 Create a Python Virtual Environment

```bash
cd ../ragbot/LocalAIAgentWithRAG-main

# Create the virtual environment
python -m venv venv

# Activate — Windows
venv\Scripts\activate

# Activate — macOS / Linux
source venv/bin/activate
```

#### 4.3 Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 4.4 Configure Environment

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

The defaults work out of the box for most setups. Edit `.env` only if you need to change the Ollama URL, model names, or GPU settings.

#### 4.5 Add Legal Documents

Drop your PDF, DOCX, or TXT files into the matching folder:

```
ragbot/LocalAIAgentWithRAG-main/legal_documents/
├── pdfs/     ← PDF files
├── docx/     ← Word documents
└── txt/      ← Plain text files
```

> The vector store is **automatically rebuilt** whenever new documents are detected.

#### 4.6 Start the RAG Worker

```bash
# Ensure Ollama is running first
python worker_server.py
```

> Runs on **`http://localhost:8008`**

#### 4.7 (Optional) CLI Test

```bash
python main.py
```

Launches an interactive Q&A session directly in the terminal.

---

### Step 5 — Run All Services Together

Open **three separate terminals**:

| Terminal | Directory | Command |
| :---: | :--- | :--- |
| 1 | `backend/` | `npm run dev` |
| 2 | `frontend/` | `npm run dev` |
| 3 | `ragbot/LocalAIAgentWithRAG-main/` | `python worker_server.py` |

Then visit **`https://localhost:5173`** in your browser.

---

## 🤖 RAG Bot API Reference

The worker server exposes a lightweight JSON API:

### `GET /health`

Returns service status.

```json
{ "ok": true }
```

### `POST /ask`

Query the pre-loaded legal knowledge base.

```json
// Request
{ "question": "What are the fundamental rights under the Indian Constitution?" }

// Response
{ "ok": true, "answer": "1) Quick Answer\n...\n2) Easy Explanation\n...\n3) Sources\n..." }
```

### `POST /session/upload`

Upload a PDF for per-session in-memory querying.

```json
{
  "sessionId": "unique-session-id",
  "fileName": "contract.pdf",
  "fileDataBase64": "<base64-encoded-PDF>"
}
```

### `POST /session/ask`

Query an uploaded session document.

```json
{
  "sessionId": "unique-session-id",
  "question": "What is the termination clause?"
}
```

### `POST /session/clear`

Clear a session and free its memory.

```json
{ "sessionId": "unique-session-id" }
```

---

## 🗄️ Database

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for full MongoDB schema definitions:

- **User** — clients & lawyers (roles, specializations, bar council ID)
- **Appointment** — booking, status, payment, meeting link
- **Document** — file URLs, access control, uploader reference
- **Review & Rating** — star rating + comment per completed appointment

---

## 🔒 Security

- Passwords hashed with **bcrypt** — never stored in plain text
- Authentication via **stateless JWTs** stored in HttpOnly cookies
- File access via **presigned Cloudinary URLs** — time-limited & private
- **CORS** strictly configured per environment
- All secrets managed through `.env` files (gitignored)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'feat: Add YourFeature'`
4. Push the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ by **Kushal**

</div>