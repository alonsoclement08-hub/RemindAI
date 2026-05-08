# SEMAINE 4 — BACKEND CORE IMPLEMENTATION
**RemindAI • Mois 1**

---

## OBJECTIFS SEMAINE 4

1. ✅ Setup Node.js + Express project
2. ✅ Implémenter l'authentification JWT
3. ✅ Créer les endpoints CRUD (reminders)
4. ✅ Setup PostgreSQL + migrations
5. ✅ Écrire les tests unitaires
6. ✅ Backend fonctionne localement (Docker)

---

## TÂCHES SEMAINE 4

### Task 1: Setup projet (Jour 1)

```bash
# Initialize Node project
npm init -y

# Install dependencies
npm install express dotenv bcryptjs jsonwebtoken cors pg prisma axios redis winston

# Install dev dependencies
npm install -D nodemon jest supertest @testing-library/jest-dom

# Create structure
mkdir -p src/{routes,middleware,controllers,services,models}
mkdir -p tests/{unit,integration}
mkdir -p prisma

# Create env file
touch .env
```

### Task 2: Database Setup (Jour 1-2)

```bash
# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Seed database (optional, for testing)
npx prisma db seed
```

### Task 3: Auth Middleware (Jour 2)

**File: `src/middleware/auth.js`**
```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
```

### Task 4: Auth Routes (Jour 2-3)

**File: `src/routes/auth.js`**
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name: name || email.split('@')[0],
      },
    });
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REFRESH TOKEN
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;
```

### Task 5: Reminders CRUD Routes (Jour 3-4)

**File: `src/routes/reminders.js`**
```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET all reminders
router.get('/', async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { user_id: req.userId },
      orderBy: { scheduled_at: 'asc' },
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE reminder
router.post('/', async (req, res) => {
  try {
    const { title, description, category, scheduled_at, priority } = req.body;
    
    // Check user tier limit (20 for free tier)
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.tier === 'free') {
      const count = await prisma.reminder.count({
        where: { user_id: req.userId, completed_at: null },
      });
      if (count >= 20) {
        return res.status(429).json({ 
          error: 'Reminder limit reached. Upgrade to Pro.',
          limit: 20,
        });
      }
    }
    
    const reminder = await prisma.reminder.create({
      data: {
        user_id: req.userId,
        title,
        description,
        category: category || 'personal',
        scheduled_at: new Date(scheduled_at),
        priority: priority || 2,
      },
    });
    
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single reminder
router.get('/:id', async (req, res) => {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    
    if (!reminder || reminder.user_id !== req.userId) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE reminder
router.put('/:id', async (req, res) => {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    
    if (!reminder || reminder.user_id !== req.userId) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    const updated = await prisma.reminder.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    
    if (!reminder || reminder.user_id !== req.userId) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    await prisma.reminder.delete({
      where: { id: parseInt(req.params.id) },
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MARK as complete
router.patch('/:id/complete', async (req, res) => {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    
    if (!reminder || reminder.user_id !== req.userId) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    const updated = await prisma.reminder.update({
      where: { id: parseInt(req.params.id) },
      data: { completed_at: new Date() },
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Task 6: Main App Setup (Jour 4)

**File: `src/index.js`**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const remindersRoutes = require('./routes/reminders');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reminders', remindersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Task 7: Tests (Jour 4-5)

**File: `tests/reminders.test.js`**
```javascript
const request = require('supertest');
const app = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Reminders API', () => {
  let token;
  let userId;
  
  beforeAll(async () => {
    // Create test user
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    
    token = res.body.accessToken;
    userId = res.body.user.id;
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.reminder.deleteMany({ where: { user_id: userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });
  
  test('CREATE reminder', async () => {
    const res = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Call John',
        category: 'work',
        scheduled_at: new Date(),
      });
    
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Call John');
  });
  
  test('GET reminders', async () => {
    const res = await request(app)
      .get('/api/reminders')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  
  test('UPDATE reminder', async () => {
    const create = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old title', category: 'work', scheduled_at: new Date() });
    
    const id = create.body.id;
    
    const res = await request(app)
      .put(`/api/reminders/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New title' });
    
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New title');
  });
  
  test('DELETE reminder', async () => {
    const create = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete me', category: 'work', scheduled_at: new Date() });
    
    const id = create.body.id;
    
    const res = await request(app)
      .delete(`/api/reminders/${id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
  });
});
```

### Task 8: Docker Setup (Jour 5)

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: remindai
      POSTGRES_PASSWORD: localdev123
      POSTGRES_DB: remindai_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  backend:
    build: .
    environment:
      DATABASE_URL: postgresql://remindai:localdev123@postgres:5432/remindai_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key-change-this
      JWT_REFRESH_SECRET: your-refresh-secret-change-this
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - ollama
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
  ollama_data:
```

**File: `Dockerfile`**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Task 9: .env Configuration

**File: `.env`**
```
DATABASE_URL=postgresql://remindai:localdev123@localhost:5432/remindai_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key
NODE_ENV=development
PORT=3000
OLLAMA_URL=http://localhost:11434
```

### Task 10: package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "migrate": "prisma migrate dev",
    "migrate:reset": "prisma migrate reset"
  }
}
```

---

## RUN LOCALLY (Semaine 4 End)

```bash
# Start Docker containers
docker-compose up -d

# Wait for postgres to be ready (30 seconds)
sleep 30

# Run migrations
npm run migrate

# Install Ollama models (optional, takes time)
docker exec $(docker ps -q -f "ancestor=ollama/ollama:latest") ollama pull mistral:7b

# Start development server
npm run dev

# Run tests
npm test
```

### Test the API:
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test"}'

# Get token from response, then:

# Create reminder
curl -X POST http://localhost:3000/api/reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Call John","category":"work","scheduled_at":"2026-05-10T10:00:00Z"}'

# Get reminders
curl -X GET http://localhost:3000/api/reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## WHAT'S WORKING AT END OF SEMAINE 4:

✅ Auth (signup, login, refresh token)
✅ Reminders CRUD (create, read, update, delete)
✅ Complete action (mark reminder as done)
✅ User tier limits (20 reminders for free)
✅ JWT authentication on all protected routes
✅ Database with PostgreSQL
✅ Tests passing
✅ Docker setup for local dev
✅ Redis ready for caching

## WHAT'S MISSING (For Next Weeks):

❌ Ollama integration (AI context generation) — Semaine 7
❌ Push notifications — Semaine 6
❌ Sync engine (offline-first) — Semaine 6
❌ Suggestions API — Semaine 5
❌ Email/Slack integration — Semaine 6+

---

## DELIVERABLES SEMAINE 4

✅ Complete backend project (Node + Express)
✅ Auth routes + middleware
✅ Reminders CRUD routes
✅ Database migrations + schema
✅ Unit tests (Jest)
✅ Docker setup
✅ Backend running locally on http://localhost:3000
✅ All endpoints tested and working

---

**FIN SEMAINE 4 ✅**

Prêt pour **Semaine 5**: Frontend MVP (React Native)
