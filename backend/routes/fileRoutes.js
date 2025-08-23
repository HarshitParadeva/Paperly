const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');

const ClassroomContent = require('../models/ClassroomContent');
const auth = require('../middleware/auth');

// --- helpers ---
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// --- DB / Storage config ---
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  throw new Error('❌ MONGO_URI not set. Please set it in .env to use file routes.');
}

// Memory storage (multer just handles the file buffer in memory)
const upload = multer({ storage: multer.memoryStorage() });

// --- Initialize OpenAI client ---
// Safety check for missing API key
if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing in .env");
} else {
  console.log("✅ OPENAI_API_KEY loaded (length:", process.env.OPENROUTER_API_KEY.length, ")");
}

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",   // ✅ Added for OpenRouter
});

// ========== Upload with Classroom ==========
router.post('/upload/:classroomId', auth, upload.single('file'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    if (!isValidId(classroomId)) {
      return res.status(400).json({ message: 'Invalid classroomId' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        uploadedBy: req.user?.id || 'unknown',
        classroomId,
        mimeType: req.file.mimetype,
      },
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      const fileId = uploadStream.id.toString();
      const fileUrl = `/api/files/${fileId}`;

      const content = new ClassroomContent({
        classroom: classroomId,
        type: 'resource',
        title: req.file.originalname,
        fileId,
        fileName: req.file.originalname,
        fileUrl,
        createdBy: req.user.id,
      });

      await content.save();
      return res.status(201).json({ message: 'File uploaded successfully', content });
    });

    uploadStream.on('error', (err) => {
      console.error('❌ Upload error:', err);
      return res.status(500).json({ message: 'Error uploading file' });
    });

  } catch (err) {
    console.error('❌ Upload error (outer):', err);
    return res.status(500).json({ message: 'Server error during file upload' });
  }
});

// ========== Upload without Classroom ==========
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        uploadedBy: req.user?.id || 'unknown',
        mimeType: req.file.mimetype,
      },
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', () => {
      const fileId = uploadStream.id.toString();
      const fileUrl = `/api/files/${fileId}`;

      return res.status(201).json({
        message: 'File uploaded successfully',
        content: {
          fileId,
          fileUrl,
          title: req.file.originalname,
          fileName: req.file.originalname,
        },
      });
    });

    uploadStream.on('error', (err) => {
      console.error('❌ Loose upload error:', err);
      return res.status(500).json({ message: 'Error uploading file' });
    });

  } catch (err) {
    console.error('❌ Loose upload error (outer):', err);
    return res.status(500).json({ message: 'Server error during file upload' });
  }
});

// ========== Get Classroom Resources ==========
router.get('/resources/:classroomId', auth, async (req, res) => {
  try {
    const { classroomId } = req.params;
    if (!isValidId(classroomId)) {
      return res.status(400).json({ message: 'Invalid classroomId' });
    }

    const resources = await ClassroomContent.find({
      classroom: classroomId,
      type: 'resource',
    })
      .sort({ createdAt: -1 })
      .select('fileUrl title createdAt');

    const response = resources.map((r) => ({
      fileUrl: r.fileUrl,
      originalName: r.title,
      createdAt: r.createdAt,
    }));

    return res.json(response);
  } catch (err) {
    console.error('❌ Fetch resources error:', err);
    return res.status(500).json({ message: 'Server error fetching resources' });
  }
});

// ========== Download File ==========
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'Invalid file id' });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const _id = new mongoose.Types.ObjectId(id);
    const downloadStream = bucket.openDownloadStream(_id);

    downloadStream.on('file', (file) => {
      if (file?.metadata?.mimeType) {
        res.set('Content-Type', file.metadata.mimeType);
      }
    });

    downloadStream.on('error', (e) => {
      console.error('❌ Download error:', e);
      return res.status(404).json({ message: 'File not found' });
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error('❌ File download error (outer):', err);
    return res.status(500).json({ message: 'Server error downloading file' });
  }
});

// ========== Analyze PDF ==========
router.post('/analyze-pdf/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'Invalid file id' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ message: 'Server misconfigured: Missing OpenAI API key' });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const _id = new mongoose.Types.ObjectId(id);
    const downloadStream = bucket.openDownloadStream(_id);

    let chunks = [];
    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const data = await pdfParse(buffer);

        const MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o-mini';
        const MAX_CHARS = parseInt(process.env.SUMMARY_MAX_CHARS || '16000', 10);

        const pdfText = (data.text || '').trim();
        if (!pdfText) return res.status(400).json({ message: 'No text extracted from PDF' });
        const textToSend = pdfText.length > MAX_CHARS ? pdfText.slice(0, MAX_CHARS) : pdfText;

        console.log("📄 PDF extracted chars:", pdfText.length);
        console.log("🤖 Sending to OpenAI, model:", MODEL);

        const completion = await client.chat.completions.create({
          model: MODEL,
          messages: [
            { role: 'system', content: 'You summarize PDFs into overview, key points, and highlights.' },
            { role: 'user', content: `Summarize this PDF:\n\n${textToSend}` },
          ],
        });

        const summary = completion.choices[0].message.content;

        return res.json({
          document: id,
          length: pdfText.length,
          overview: summary,
        });
      } catch (err) {
        console.error('❌ Error analyzing PDF with OpenAI:', err);
        return res.status(500).json({ message: 'Error analyzing PDF with OpenAI' });
      }
    });

    downloadStream.on('error', (e) => {
      console.error('❌ Download error:', e);
      return res.status(404).json({ message: 'File not found' });
    });
  } catch (err) {
    console.error('❌ Analyze error (outer):', err);
    return res.status(500).json({ message: 'Server error analyzing PDF' });
  }
});

module.exports = router;
