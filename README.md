# RemindAI

> L'IA qui pense à ta place.

RemindAI is an AI-powered proactive reminder app that detects what you should do and suggests it — so you never lose track of a follow-up, deadline, or appointment again.

## Features

- **Proactive AI detection** — Mistral 7B (via Ollama) analyzes your context and surfaces reminders you didn't know you needed
- **Smart scheduling** — geo-reminders, recurring tasks, and time-based nudges
- **Freemium model** — 20 reminders free, unlimited with Pro (4.99€/month)
- **Cross-platform** — React Native mobile app with offline-first SQLite sync
- **Secure backend** — Node/Express REST API with JWT auth, PostgreSQL, Redis caching

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Ollama (for local AI inference)

### Installation

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

### Configuration

```bash
# Backend — copy and fill in your values
cp remindai-backend/.env.example remindai-backend/.env
```

### Running

```bash
# Start the backend
cd remindai-backend
npm start

# Start the mobile app (in another terminal)
cd remindai-mobile
npm start
```

## Project Structure

```
remindai-workspace/
├── remindai-backend/      # Node/Express REST API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Prisma DB models
│   │   └── middleware/    # Auth, rate limiting
│   └── package.json
├── remindai-mobile/       # React Native app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable UI
│   │   ├── store/         # Zustand state
│   │   └── services/      # API calls, SQLite
│   └── package.json
└── docs/                  # Architecture & specs
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, Zustand, SQLite |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL, Redis |
| AI | Ollama, Mistral 7B |
| Auth | JWT |

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT
