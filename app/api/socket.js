// pages/api/socket.js
import { Server } from "socket.io";

const socketHandler = (req, res) => {
  if (req.method === "GET") {
    const io = new Server(res.socket.server);
    if (!res.socket.server.io) {
      console.log("Initializing Socket.IO...");
      res.socket.server.io = io;

      io.on("connection", (socket) => {
        console.log("A user connected");

        socket.on("disconnect", () => {
          console.log("A user disconnected");
        });
      });
    }
    res.end();
  }
};

export default socketHandler;
