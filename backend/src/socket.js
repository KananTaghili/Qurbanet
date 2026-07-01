const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket qoşuldu:", socket.id);

    // Authenticated users join their own room so admin can target them
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        if (userId) {
          socket.join(`user:${userId}`);
        }
      } catch (_) {} // anonymous socket — stays in public rooms only
    }

    socket.on("disconnect", () => {
      console.log("🔌 Socket ayrıldı:", socket.id);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    // Not initialized yet — return no-op so controllers don't crash at startup
    return { emit: () => {}, to: () => ({ emit: () => {} }) };
  }
  return io;
};

module.exports = { init, getIo };
