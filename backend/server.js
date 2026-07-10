require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./src/config/database");
const {
  seedCharityOptions,
  seedDeliveryOptions,
} = require("./src/utils/seedDefaults");
const authRoutes = require("./src/routes/authRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const charityOrderRoutes    = require("./src/routes/charityOrderRoutes");
const charityCampaignRoutes = require("./src/routes/charityCampaignRoutes");
const notificationRoutes    = require("./src/routes/notificationRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const appConfigRoutes = require("./src/routes/appConfigRoutes");
const epointRoutes = require("./src/routes/epointRoutes");
const fileRoutes = require("./src/routes/fileRoutes");
const socketService = require("./src/socket");

const app = express();
const httpServer = createServer(app);

// Render (və digər reverse proxy) arxasında işləyərkən X-Forwarded-For başlığına etibar et
app.set("trust proxy", 1);

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const defaultOrigins = [
  "https://admin.qurbanet.az",
  "https://qurbanet.az",
  "https://admin-tars-dev.qurbanet.az",
  "https://admin-tars-uat.qurbanet.az",
  "https://tars-dev.qurbanet.az",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3100",
  "http://localhost:3101",
  "http://localhost:5173",
];

const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("CORS: icazəsiz origin — " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // iOS Safari enforces CORS even for <video>/<img> cross-origin requests and
  // needs these headers exposed to process 206 Partial Content range responses.
  exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Çox sayda sorğu göndərildi. 15 dəqiqə sonra yenidən cəhd edin.",
  },
});
app.use(globalLimiter);

// Auth/OTP üçün sərt limit (brute-force qarşısı) — qlobaldan aşağı olmalıdır ki, təsirli olsun
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Çox sayda cəhd. Bir az gözləyib yenidən cəhd edin.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── General Middleware ─────────────────────────────────────────────────────
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/files", fileRoutes);
app.use("/api/app-config", appConfigRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/epoint", epointRoutes);
// Epoint merchant panelində result_url kök səviyyədə qeyd olunub:
// https://api.qurbanet.az/callback/result — ona görə bu alias saxlanılır
app.post(
  "/callback/result",
  require("./src/controllers/epointController").handleResult,
);
app.use("/api/charity-orders", charityOrderRoutes);
app.use("/api/campaigns",     charityCampaignRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// ─── Health Check / Up ──────────────────────────────────────────────────────
app.get(["/api/health", "/up"], (req, res) => {
  res.json({
    success: true,
    message: "Server işləyir 🟢",
    timestamp: new Date(),
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tapılmadı." });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server xətası:", err);
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Server xətası baş verdi."
      : err.message;
  res.status(statusCode).json({ success: false, message });
});

// ─── Asinxron Start Mexanizmi ───────────────────────────────────────────────

const startServer = async () => {
  try {
    // 1. İlk öncə bazaya qoşuluruq və toxum (seed) datalarını atırıq
    await connectDB();
    await seedCharityOptions();
    await seedDeliveryOptions();
    // Köhnə qonaq istifadəçiləri DB-dən bir dəfəlik sil
    try {
      const User = require("./src/models/User");
      const { deletedCount } = await User.deleteMany({ isGuest: true });
      if (deletedCount > 0) console.log(`🧹 ${deletedCount} köhnə qonaq istifadəçi silindi.`);
    } catch (e) { console.error("Qonaq silmə xətası:", e.message); }

    const PORT = process.env.PORT;
    socketService.init(httpServer);

    // 2. Yalnız baza tam hazır olduqdan sonra portu açırıq
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Qurbanet API serveri işləyir: http://localhost:${PORT}`);
      console.log(`📋 Admin Panel API: http://localhost:${PORT}/api/admin`);
      console.log(`💳 Epoint Callback: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}/api/epoint/result`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || "*"}`);
      console.log(`🔑 Test Mode: ${process.env.TEST_MODE === "true" ? "AÇIQ (OTP: 123456)" : "BAĞLI"}\n`);

      // ─── PM2 READY SİQNALI ───
      if (process.send) {
        process.send("ready");
        console.log("📢 PM2 prosesinə 'ready' siqnalı uğurla ötürüldü.");
      }

      // Render üçün ping mexanizmi (Yalnız dev mühitində deyilsə işləyir)
      if (process.env.BACKEND_URL && process.env.NODE_ENV !== "development") {
        const https = require("https");
        setInterval(() => {
          https.get(`${process.env.BACKEND_URL}/api/health`, () => {}).on("error", () => {});
        }, 10 * 60 * 1000);
      }
    });

  } catch (error) {
    console.error("\n❌ Server başladılarkən kritik xəta baş verdi:", error.message);
    console.error("⚠️  Baza bağlantısını və ya mühit dəyişənlərini yoxlayın!\n");
    process.exit(1); // Kritik xətada prosesi tam dayandırırıq ki, PM2 çökməni görsün
  }
};

// Serveri başladırıq
startServer();

module.exports = app;