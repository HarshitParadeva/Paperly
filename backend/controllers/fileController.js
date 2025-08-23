import fs from "fs";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import File from "../models/File.js";

// ✅ Initialize OpenRouter client
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,  // changed from OPENAI_API_KEY
  baseURL: "https://openrouter.ai/api/v1", // added for OpenRouter
});

// ========== Upload File ==========
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Save file info to DB
    const fileDoc = await File.create({
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      classroomId: req.params.classroomId,
    });

    res.json({
      success: true,
      content: { fileId: fileDoc._id },
    });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: "Error uploading file" });
  }
};

// ========== Get Files ==========
export const getFiles = async (req, res) => {
  try {
    const files = await File.find({ classroomId: req.params.classroomId });
    res.json(files);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Error fetching files" });
  }
};

// ========== Analyze PDF ==========
// ========== Analyze PDF ==========
export const analyzePdf = async (req, res) => {
  try {
    // Lookup file in DB
    const fileDoc = await File.findById(req.params.fileId);
    if (!fileDoc) {
      return res.status(404).json({ error: "File not found" });
    }

    // Read PDF
    const pdfBuffer = fs.readFileSync(fileDoc.path);
    const data = await pdfParse(pdfBuffer);

    const MODEL = process.env.OPENROUTER_MODEL || "gpt-4o-mini";
    const MAX_CHARS = parseInt(process.env.SUMMARY_MAX_CHARS || "16000", 10);

    const pdfText = (data.text || "").trim();
    if (!pdfText) {
      return res.status(400).json({ error: "No text found in PDF" });
    }

    const textToSend = pdfText.length > MAX_CHARS ? pdfText.slice(0, MAX_CHARS) : pdfText;

    // ✅ Summarize with OpenRouter (formatted output)
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes PDF text." },
        { 
          role: "user", 
          content: `Summarize the following PDF text in a **well-structured format** with:
- Clear headings (##, ###)
- Bullet points
- Key highlights
- Case studies
- Proper separation of sections

Text to summarize:\n\n${textToSend}`
        },
      ],
    });

    const summaryText = completion.choices[0].message.content;

    res.json({
      document: fileDoc.originalname,
      length: pdfText.length,
      overview: summaryText,
    });
  } catch (err) {
    console.error("Error analyzing PDF:", err);
    res.status(500).json({ error: "Error analyzing PDF" });
  }
};

   