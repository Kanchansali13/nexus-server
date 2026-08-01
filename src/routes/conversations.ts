import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Create a new conversation
router.post("/", async (req, res) => {
  try {
    const { userId, title, email } = req.body;

    // Ensure the user exists in our database, create if not
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: email || `${userId}@placeholder.com` },
    });

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || "New Conversation",
      },
    });
    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Get all conversations for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get a single conversation with its messages
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Update a conversation's title
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const conversation = await prisma.conversation.update({
      where: { id },
      data: { title },
    });
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

export default router;