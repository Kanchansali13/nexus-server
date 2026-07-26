import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import prisma from "../lib/prisma";
import { getEmbedding, cosineSimilarity } from "../lib/embeddings";

const router = Router();

router.post("/ask", async (req, res) => {
  try {
    const { userId, question } = req.body;

    // Get all chunks belonging to this user's documents
    const chunks = await prisma.chunk.findMany({
      where: { document: { userId } },
      include: { document: true },
    });

    if (chunks.length === 0) {
      return res.status(404).json({ error: "No documents found for this user" });
    }

    // Embed the question
    const questionEmbedding = await getEmbedding(question);

    // Score every chunk by similarity to the question
    const scored = chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(questionEmbedding, JSON.parse(chunk.embedding)),
    }));

    // Take the top 3 most relevant chunks
    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, 3).map((s) => s.chunk);

    // Build context from the top chunks
    const context = topChunks
      .map((c) => `From "${c.document.filename}":\n${c.content}`)
      .join("\n\n---\n\n");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Answer the question using ONLY the context below. If the answer isn't in the context, say you don't know.

Context:
${context}

Question: ${question}`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    res.json({
      answer: response.text ?? "",
      sources: topChunks.map((c) => c.document.filename),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

export default router;