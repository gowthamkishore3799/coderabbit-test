import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod'; // <-- Added

import { analyzeTrack } from './realtime.js';

const app = express();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Create uploads directory
try {
  await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
} catch (error) {
  console.error('Failed to create uploads directory:', error);
  process.exit(1);
}

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Zod schema for validation
const analyzeRequestSchema = z.object({
  task: z.string().default('analysis'),
  lyricContext: z.string().optional().default(''),
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze', upload.single('track'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing track upload' });
  }

  // ✅ Validate input with Zod
  const parseResult = analyzeRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: parseResult.error.flatten(),
    });
  }

  const { task, lyricContext } = parseResult.data;
  const filePath = path.resolve(req.file.path);

  try {
    const audioBuffer = await fs.readFile(filePath);

    const result = await analyzeTrack({
      task,
      audioBuffer,
      lyricContext,
    });

    res.json(result);
  } catch (error) {
    console.error('Realtime analysis failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to process track with OpenAI Realtime API',
      details: message,
    });
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
