const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const Message = require("./models/Message");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/chatdb")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Home Route
app.get("/", (req, res) => {
  res.send("Real-Time Chat Backend Running");
});

// Test Route to Save Data in MongoDB
app.get("/test", async (req, res) => {
  try {
    const msg = new Message({
      room: "general",
      username: "Mahalingam",
      message: "Hello Everyone",
    });

    await msg.save();

    res.send("Message Saved Successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("joinRoom", async ({ room, username }) => {
    socket.join(room);

    const history = await Message.find({ room });

    socket.emit("chatHistory", history);

    io.to(room).emit("message", {
      username: "System",
      message: `${username} joined the room`,
    });
  });

  socket.on("sendMessage", async (data) => {
    try {
      const msg = new Message(data);

      await msg.save();

      io.to(data.room).emit("message", data);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });

  socket.on("error", (error) => {
    console.log("Socket Error:", error);
  });
});

// Server Start
server.listen(3000, () => {
  console.log("Server running on port 3000");
});