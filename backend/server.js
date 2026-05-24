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
const charityOrderRoutes = require("./src/routes/charityOrderRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const appConfigRoutes = require("./src/routes/appConfigRoutes");
const epointRoutes = require("./src/routes/epointRoutes");
const fileRoutes = require("./src/routes/fileRoutes");
const socketService = require("./src/socket");

const app = express();
const httpServer = createServer(app);

// Render (və digər reverse proxy) arxasında işləyərkən X-Forwarded-For başlığına etibar et
app.set("trust proxy", 1);

// ─── Database ──────────────────────────────────────────────────────────────
connectDB()
  .then(() => {
    seedCharityOptions();
    seedDeliveryOptions();
  })
  .catch((err) => {
    console.error("\n❌ MongoDB bağlantı xətası:", err.message);
    console.error("⚠️  .env faylında MONGODB_URI-ni yoxlayın!");
    if (process.pkg) {
      console.error("📂 .env faylı backend.exe ilə eyni qovluqda olmalıdır");
    }
    console.error("💡 API serveri işləməyə davam edir, lakin DB olmadan.\n");
  });

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//       "http://localhost:3001",
//       "http://localhost:5173",
//       "http://localhost:19006",
//       "exp://localhost:8081",
//       "https://sacrifice-api-az.loca.lt",
//     ],
//     credentials: true,
//   }),
// );

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

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

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Çox sayda giriş cəhdi. 10 dəqiqə sonra yenidən cəhd edin.",
  },
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
app.use("/api/charity-orders", charityOrderRoutes);
app.use("/api/admin", adminRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
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

// ─── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
socketService.init(httpServer);
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Qurban API serveri işləyir: http://localhost:${PORT}`);
  console.log(`📋 Admin Panel API: http://localhost:${PORT}/api/admin`);
  console.log(
    `🔑 Test Mode: ${process.env.TEST_MODE === "true" ? "AÇIQ (OTP: 123456)" : "BAĞLI"}\n`,
  );

  // Render free tier-da server 15 dəqiqəyə yatır — hər 10 dəqiqədən bir özünü ping et
  if (process.env.BACKEND_URL && process.env.NODE_ENV !== "development") {
    const https = require("https");
    setInterval(() => {
      https.get(`${process.env.BACKEND_URL}/api/health`, () => {}).on("error", () => {});
    }, 10 * 60 * 1000);
  }
});

module.exports = app;
