import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket.js";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

dotenv.config();

const PORT = process.env.PORT || 3001;

// Получаем путь к текущей папке (src) в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
  // Путь к собранному фронтенду (относительно текущего файла)
  const frontendDistPath = path.join(__dirname, "../../chat-frontend/dist");

  // Раздача статических файлов
  app.use(express.static(frontendDistPath));

  // Все остальные GET-запросы отдают index.html (для SPA)
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Сервер работает на порту ${PORT}`);
  connectDB();
});