import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Add a message to a conversation
router.post("/", async (req, res) => {
  try {
    const { conversationId, role, content } = req.body;
    const message = await prisma.message.create({
      data: { conversationId, role, content },
    });
    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

export default router;