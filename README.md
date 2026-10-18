<![CDATA[<div align="center">

# ⚖️ Legal Reach

**A full-stack platform connecting clients with legal professionals — powered by a local AI RAG chatbot.**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=nodedotjs)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python)](https://python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-RAG-1C3C3C?logo=langchain)](https://langchain.com/)
[![Ollama](https://img.shields.io/badge/Ollama-llama3.2-000000)](https://ollama.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📜 Overview

**Legal Reach** bridges the gap between individuals seeking legal help and certified legal professionals. The platform provides a centralized hub for searching, booking, and conducting legal consultations — including real-time video/audio calling and an AI-powered legal assistant that answers questions from your own uploaded documents.

The project is organized into **three independent services** that work together:

| Service | Description |
|---|---|
| `frontend/` | React 19 + Vite SPA — the client-facing UI |
| `backend/` | Node.js + Express REST API & Socket.IO server |
| `ragbot/LocalAIAgentWithRAG-main/` | Python RAG chatbot service (runs fully locally via Ollama) |

---

## ✨ Key Features

### 👤 Client Module
- **Secure Auth** — JWT-based login/register with bcrypt password hashing
- **Lawyer Search** — Filter lawyers by specialization, location, fees, and rating
- **Appointment Booking** — Real-time calendar slot selection
- **Document Vault** — Upload legal documents (stored via Cloudinary)
- **AI Legal Assistant (RAG Bot)** — Ask questions against a curated legal knowledge base *or* your own uploaded PDFs
- **Video & Audio Calls** — Peer-to-peer calls powered by WebRTC (PeerJS / Simple-Peer)
- **Live Chat** — Real-time messaging via Socket.IO

### 🧑‍⚖️ Lawyer Module
- Professional profile management (bar council ID, fees, availability)
- Calendar scheduling for appointments
- Case & appointment dashboard
- Client document access

### 🤖 RAG Bot (`ragbot/`)
- Fully **offline** — no OpenAI API key needed; runs on your local machine using **Ollama**
- Two query modes:
  - **Knowledge Base mode** — queries against pre-loaded legal documents (Constitution of India, etc.)
  - **Session mode** — upload any PDF and query it on the fly (in-memory per session)
- Embeddings: **`mxbai-embed-large`** (via Ollama)
- LLM: **`llama3.2`** (via Ollama)
- Custom in-memory vector store with cosine similarity (NumPy)
- Served as an HTTP API (`worker_server.py`) consumed by the frontend

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool & dev server |
| React Router DOM | 7 | Client-side routing |
| React Redux | 9 | State management |
| Axios | 1 | HTTP client |
| Socket.IO Client | 4 | Real-time communication |
| PeerJS / Simple-Peer | latest | WebRTC video/audio |
| Lucide React | 0.5 | Icon library |
| Tailwind CSS | 4 | Utility-first styling |

### Backend
| Library | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5 | REST API framework |
| Mongoose | 9 | MongoDB ODM |
| Socket.IO | 4 | WebSockets (chat + signaling) |
| JWT | 9 | Authentication tokens |
| bcryptjs | 3 | Password hashing |
| Cloudinary | 2 | File/document storage |
| Multer | 2 | File upload middleware |
| Nodemailer | 7 | Email notifications |
| selfsigned | 5 | HTTPS in development |

### RAG Bot (Python)
| Library | Version | Purpose |
|---|---|---|
| Python | 3.9+ | Runtime |
| LangChain | ≥0.0.350 | RAG pipeline orchestration |
| langchain-ollama | latest | Ollama integration |
| langchain-core | latest | Core abstractions |
| langchain-text-splitters | latest | Document chunking |
| Ollama (`llama3.2`) | — | Local LLM inference |
| Ollama (`mxbai-embed-large`) | — | Local embeddings |
| pypdf | ≥4 | PDF text extraction |
| python-docx | ≥1 | DOCX text extraction |
| NumPy | ≥1.21 | Vector math (cosine similarity) |
| python-dotenv | ≥1 | Environment config |

### Infrastructure
| Tool | Purpose |
|---|---|
| MongoDB | NoSQL database |
| Cloudinary | Document/image storage |
| Ollama | Local LLM & embedding server |

---

## 📂 Project Structure

```
Legal-Reach-main/
├── backend/                        # Node.js API server
│   ├── config/                     # DB connection, etc.
│   ├── middleware/                  # Auth, socket auth
│   ├── models/                     # Mongoose schemas
│   ├── routes/                     # Express route handlers
│   │   ├── ragRoutes.js            # Proxy routes to RAG bot
│   │   ├── callRoutes.js           # Video/audio call signaling
│   │   └── chatRoutes.js           # Chat messages
│   ├── uploads/                    # Temp upload folder
│   ├── utils/                      # Helper utilities
│   ├── index.js                    # Entry point
│   ├── seedData.js                 # DB seed script
│   └── package.json
│
├── frontend/                       # React + Vite SPA
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── RagbotWidget.jsx    # AI chat widget
│   │   │   ├── AudioVideoCall.jsx  # WebRTC call UI
│   │   │   └── ...
│   │   ├── pages/                  # Route-level pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LawyerDashboard.jsx
│   │   │   ├── LawyerDetails.jsx
│   │   │   ├── VideoCall.jsx
│   │   │   ├── VoiceCall.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   └── ...
│   │   ├── utils/                  # socket.js, config.js
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js
│
└── ragbot/
    └── LocalAIAgentWithRAG-main/   # Python RAG service
        ├── legal_documents/        # Pre-loaded legal PDFs/TXT
        │   ├── pdfs/               # e.g. Constitution of India.pdf
        │   ├── docx/
        │   └── txt/
        ├── vectorstore/            # Auto-generated (gitignored)
        ├── logs/                   # Runtime logs (gitignored)
        ├── main.py                 # Core RAG pipeline & CLI
        ├── worker_server.py        # HTTP API server (port 8008)
        ├── vector.py               # Custom vector store
        ├── document_processor.py   # PDF/DOCX/TXT ingestion
        ├── config.py               # All configuration dataclasses
        ├── api_query.py            # Quick query script
        ├── requirements.txt        # Python dependencies
        └── .env.example            # Config template
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| Python | 3.9+ | [python.org](https://python.org) |
| MongoDB | any | [mongodb.com](https://mongodb.com) or Atlas cloud |
| Ollama | latest | [ollama.com](https://ollama.com) |
| Git | any | [git-scm.com](https://git-scm.com) |

### 1. Clone the Repository

```bash
git clone https://github.com/KhuneKushal/Legal-Reach-main.git
cd Legal-Reach-main
```

---

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

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

Start the backend:
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```
> The backend runs on **`https://localhost:5000`** (self-signed SSL in dev).

---

### 3. Setup the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_BACKEND_URL=https://localhost:5000
VITE_RAG_URL=http://localhost:8008
```

Start the frontend:
```bash
npm run dev
```
> The frontend runs on **`https://localhost:5173`** (Vite dev server with SSL).

---

### 4. Setup the RAG Bot (AI Legal Assistant)

#### 4.1 Install & Pull Ollama Models

First, [download and install Ollama](https://ollama.com/download). Then pull the required models:

```bash
# LLM for answering questions
ollama pull llama3.2

# Embedding model for semantic search
ollama pull mxbai-embed-large
```

Verify Ollama is running:
```bash
ollama list
# Should show llama3.2 and mxbai-embed-large
```

#### 4.2 Create a Python Virtual Environment

```bash
cd ../ragbot/LocalAIAgentWithRAG-main

# Create venv
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
# Copy the example file and edit it
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux
```

The default settings work out of the box for most setups (Ollama on localhost, CPU mode). Edit `.env` only if you need to change the Ollama URL, model names, or GPU settings.

#### 4.5 Add Your Legal Documents

Place your PDF, DOCX, or TXT legal documents into the corresponding folders:

```
ragbot/LocalAIAgentWithRAG-main/legal_documents/
├── pdfs/     ← Drop PDF files here
├── docx/     ← Drop DOCX files here
└── txt/      ← Drop TXT files here
```

> The vectorstore is **automatically rebuilt** when new or updated documents are detected. No manual indexing step required.

#### 4.6 Start the RAG Worker Server

```bash
# Make sure Ollama is running first!
python worker_server.py
```
> The RAG API runs on **`http://localhost:8008`**

#### 4.7 (Optional) Test via CLI

```bash
python main.py
```
This launches an interactive command-line Q&A session using the loaded legal documents.

---

### 5. Running All Services Together

Open **three separate terminals**:

| Terminal | Command | Directory |
|---|---|---|
| 1 — Backend | `npm run dev` | `backend/` |
| 2 — Frontend | `npm run dev` | `frontend/` |
| 3 — RAG Bot | `python worker_server.py` | `ragbot/LocalAIAgentWithRAG-main/` |

Then open your browser at **`https://localhost:5173`**.

---

## 🤖 RAG Bot API Reference

The RAG worker server (`worker_server.py`) exposes a simple JSON API:

### `GET /health`
Check if the service is up.

```json
{ "ok": true }
```

### `POST /ask`
Query the pre-loaded legal knowledge base.

**Request:**
```json
{ "question": "What are the fundamental rights under the Indian Constitution?" }
```

**Response:**
```json
{
  "ok": true,
  "answer": "1) Quick Answer\n...\n2) Easy Explanation\n...\n3) Sources\n..."
}
```

### `POST /session/upload`
Upload a PDF for per-session querying (in-memory, no persistence).

**Request:**
```json
{
  "sessionId": "unique-session-id",
  "fileName": "contract.pdf",
  "fileDataBase64": "<base64-encoded-PDF>"
}
```

### `POST /session/ask`
Ask a question against a previously uploaded session document.

**Request:**
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

## 🗄️ Database Schemas

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for the complete MongoDB schema definitions, including:
- **User** (clients & lawyers)
- **Appointment**
- **Document**
- **Review & Rating**

---

## 🔒 Security

- Passwords hashed with **bcrypt** (never stored in plain text)
- Authentication via **stateless JWTs** stored in HttpOnly cookies
- File access via **presigned Cloudinary URLs** (time-limited, private)
- **CORS** strictly configured per environment
- All secrets managed through `.env` files (gitignored)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'feat: Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<div align="center">

Made with ❤️ by **Kushal**

</div>
]]>