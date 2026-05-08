const { Server } = require("socket.io");

let io = null;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket qoşuldu:", socket.id);
    socket.on("disconnect", () => {
      console.log("🔌 Socket ayrıldı:", socket.id);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    // Socket not initialized yet — return a no-op emitter so controllers
    // don't crash during startup before the HTTP server is ready.
    return { emit: () => {} };
  }
  return io;
};

module.exports = { init, getIo };
