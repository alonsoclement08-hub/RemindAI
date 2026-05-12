const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { createUserAndLogin, app } = require("./helpers");
const { calculateDistance } = require("../src/services/geolocation");

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });

// Mock price comparison AI so no Ollama needed
jest.mock("../src/services/gemma", () => {
  const actual = jest.requireActual("../src/services/gemma");
  return {
    ...actual,
    callGemma: jest.fn().mockResolvedValue(
      JSON.stringify({
        productName: "Croquettes chat",
        prices: [
          { store: "Amazon",    price: 29.99, available: true },
          { store: "Carrefour", price: 26.50, available: true },
          { store: "Leclerc",   price: 25.00, available: true },
          { store: "Auchan",    price: 27.00, available: true },
          { store: "Lidl",      price: 0,     available: false },
        ],
        unit: "2 kg",
        priceNote: "Leclerc propose le meilleur prix sur les croquettes.",
      })
    ),
    extractJSON: actual.extractJSON,
  };
});

let token;

beforeEach(async () => {
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  const auth = await createUserAndLogin();
  token = auth.token;
});

afterAll(async () => {
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// ─── Haversine unit tests ─────────────────────────────────────────────────────

describe("calculateDistance", () => {
  it("returns ~0 for identical coordinates", () => {
    expect(calculateDistance(48.8566, 2.3522, 48.8566, 2.3522)).toBeCloseTo(0, 0);
  });

  it("Paris → Lyon is ~391 km", () => {
    const d = calculateDistance(48.8566, 2.3522, 45.7640, 4.8357);
    expect(d / 1000).toBeCloseTo(391, -1); // within 10 km tolerance
  });

  it("50 metres apart is < 100m", () => {
    // ~0.0005 degrees latitude ≈ 55m
    const d = calculateDistance(48.8566, 2.3522, 48.8571, 2.3522);
    expect(d).toBeLessThan(100);
  });
});

// ─── Geo-reminder CRUD ────────────────────────────────────────────────────────

describe("POST /api/reminders with geolocation", () => {
  it("creates a geo-enabled reminder", async () => {
    const res = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Acheter du lait",
        useGeolocation: true,
        locationName: "Carrefour Nation",
        locationLat: 48.8480,
        locationLng: 2.3967,
        locationRadius: 300,
      });

    expect(res.status).toBe(201);
    expect(res.body.useGeolocation).toBe(true);
    expect(res.body.locationLat).toBeCloseTo(48.848, 2);
    expect(res.body.locationRadius).toBe(300);
    expect(res.body.geoNotified).toBe(false);
  });
});

// ─── POST /api/location/nearby ────────────────────────────────────────────────

describe("POST /api/location/nearby", () => {
  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/location/nearby")
      .send({ latitude: 48.848, longitude: 2.396 });
    expect(res.status).toBe(401);
  });

  it("returns empty when no geo-reminders exist", async () => {
    const res = await request(app)
      .post("/api/location/nearby")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 48.8566, longitude: 2.3522 });

    expect(res.status).toBe(200);
    expect(res.body.triggered).toHaveLength(0);
    expect(res.body.count).toBe(0);
  });

  it("triggers a reminder when user is within radius", async () => {
    // Carrefour Nation: 48.8480, 2.3967
    await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Acheter du lait",
        useGeolocation: true,
        locationName: "Carrefour Nation",
        locationLat: 48.8480,
        locationLng: 2.3967,
        locationRadius: 500,
      });

    // User is 200m from the store
    const res = await request(app)
      .post("/api/location/nearby")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 48.8478, longitude: 2.3975 }); // ~70m away

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.triggered[0].title).toBe("Acheter du lait");
  });

  it("does NOT trigger when user is outside radius", async () => {
    await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Acheter du lait",
        useGeolocation: true,
        locationLat: 48.8480,
        locationLng: 2.3967,
        locationRadius: 100, // tight radius
      });

    // User is >1 km away (Paris centre)
    const res = await request(app)
      .post("/api/location/nearby")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 48.8566, longitude: 2.3522 });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it("does not re-trigger already-notified reminders", async () => {
    const created = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Double trigger test",
        useGeolocation: true,
        locationLat: 48.8480,
        locationLng: 2.3967,
        locationRadius: 1000,
      });

    // First check — triggers
    await request(app)
      .post("/api/location/nearby")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 48.8480, longitude: 2.3967 });

    // Second check — should not re-trigger
    const res = await request(app)
      .post("/api/location/nearby")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 48.8480, longitude: 2.3967 });

    expect(res.body.count).toBe(0);
  });

  it("rejects invalid coordinates", async () => {
    const res = await request(app)
      .post("/api/location/nearby")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 999, longitude: 2.3522 });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/products/price-comparison ──────────────────────────────────────

describe("GET /api/products/price-comparison", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/products/price-comparison?product=lait");
    expect(res.status).toBe(401);
  });

  it("requires product param", async () => {
    const res = await request(app)
      .get("/api/products/price-comparison")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("returns price comparison with correct structure", async () => {
    const res = await request(app)
      .get("/api/products/price-comparison?product=croquettes+chat")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.productName).toBeTruthy();
    expect(Array.isArray(res.body.prices)).toBe(true);
    expect(res.body.prices.length).toBeGreaterThan(0);
    expect(res.body.cheapest).toBeTruthy();
    expect(typeof res.body.savings).toBe("number");
    expect(res.body.source).toBe("ai_estimated");
  });

  it("prices are sorted cheapest first", async () => {
    const res = await request(app)
      .get("/api/products/price-comparison?product=croquettes+chat")
      .set("Authorization", `Bearer ${token}`);

    const prices = res.body.prices.map((p) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("cheapest matches first item in sorted list", async () => {
    const res = await request(app)
      .get("/api/products/price-comparison?product=croquettes+chat")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.cheapest.price).toBe(res.body.prices[0].price);
    expect(res.body.cheapest.store).toBe(res.body.prices[0].store);
  });
});
