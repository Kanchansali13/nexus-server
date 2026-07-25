import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import prisma from "../lib/prisma";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Save the user's message
    const userMessage = await prisma.message.create({
      data: { conversationId, role: "user", content: message },
    });

    // Fetch full history for context
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const contents = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents,
    });

    const assistantText = response.text ?? "";

    const assistantMessage = await prisma.message.create({
      data: { conversationId, role: "assistant", content: assistantText },
    });

    res.json({ userMessage, assistantMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;