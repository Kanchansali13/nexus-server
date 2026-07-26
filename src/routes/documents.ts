import { Router } from "express";
import multer from "multer";
import * as pdfParseModule from "pdf-parse";
import prisma from "../lib/prisma";
import { chunkText } from "../lib/chunking";
import { getEmbedding } from "../lib/embeddings";
import { PDFParse } from "pdf-parse";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Extract text from the PDF
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    const text = result.text;
    
await parser.destroy();

    // Save the document record
    const document = await prisma.document.create({
      data: { userId, filename: file.originalname },
    });

    // Chunk the text and create embeddings for each chunk
    const chunks = chunkText(text);

    for (const chunkContent of chunks) {
      const embedding = await getEmbedding(chunkContent);
      await prisma.chunk.create({
        data: {
          documentId: document.id,
          content: chunkContent,
          embedding: JSON.stringify(embedding),
        },
      });
    }

    res.status(201).json({ document, chunkCount: chunks.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process document" });
  }
});

export default router;