# RemindAI

> L'IA qui pense à ta place.

RemindAI is an AI-powered proactive reminder app that detects what you should do and suggests it — so you never lose track of a follow-up, deadline, or appointment again.

## Features

- **Proactive AI (Gemma 3 local)** — runs entirely on your machine via Ollama, 100% free, no API key, works offline
- **Intelligent advice** — after creating a reminder, the AI gives contextual suggestions (best time slots, Pomodoro plans, geolocation for shopping, etc.)
- **Smart scheduling** — geo-reminders, recurring tasks, and time-based nudges
- **Freemium model** — 20 reminders free, unlimited with Pro (4.99€/month)
- **Cross-platform** — React Native mobile app with offline-first SQLite sync
- **Secure backend** — Node/Express REST API with JWT auth, PostgreSQL, Redis caching

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- [Ollama](https://ollama.com) — for local AI inference (free)

### 1. Install Ollama & download Gemma

```bash
# Install Ollama (Mac)
brew install ollama

# Download Gemma 3 model (~5GB)
ollama pull gemma3

# Start the local AI server
ollama serve
```

Ollama runs at `http://localhost:11434` by default.

### 2. Install project dependencies

```bash
# Clone the repo
git clone https://github.com/alonsoclement08-hub/RemindAI.git
cd RemindAI

# Install backend dependencies
cd remindai-backend
npm install

# Install mobile dependencies
cd ../remindai-mobile
npm install
```

### 3. Configure environment

```bash
# Backend — copy and fill in your values
cp remindai-backend/.env.example remindai-backend/.env
```

The only required AI setting is already set by default:
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3
```

### 4. Run

```bash
# Terminal 1 — AI server
ollama serve

# Terminal 2 — Backend
cd remindai-backend
npm run dev

# Terminal 3 — Mobile app
cd remindai-mobile
npm start
```

## AI Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/ai/parse` | Extract structured data from natural language |
| `POST /api/ai/advice` | Get intelligent advice after creating a reminder |
| `POST /api/ai/suggest` | Suggest reminders based on user habits |

**Example — advice for a call reminder:**
```json
POST /api/ai/advice
{ "title": "Appeler maman", "reminderType": "call", "scheduledAt": "2026-05-09T12:00:00Z" }

→ {
  "advice": "Midi c'est souvent chargé. Tu veux décaler à 13h après le repas ?",
  "suggestions": ["Notifier 10 min avant", "Ajouter en favori"],
  "confirmationText": "Appeler maman vendredi à 12h. C'est bien ça ?"
}
```

## Project Structure

```
remindai-workspace/
├── remindai-backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # gemma.js — Ollama AI service
│   │   ├── models/        # Prisma DB models
│   │   └── middleware/    # Auth, rate limiting
│   └── .env.example
├── remindai-mobile/
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── store/         # Zustand state
│   │   └── utils/         # ai.js — AI client with advice
│   └── package.json
└── docs/                  # Architecture & specs
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, Zustand, SQLite |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL, Redis |
| AI | Ollama + Gemma 3 (local, free, offline) |
| Auth | JWT |

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT
