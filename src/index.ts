import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import conversationsRouter from "./routes/conversations";
import messagesRouter from "./routes/messages";
import chatRouter from "./routes/chat";
import documentsRouter from "./routes/documents";
import ragRouter from "./routes/rag";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Nexus server is running" });
});

app.use("/api/conversations", conversationsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/rag", ragRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});