import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { analyzeTrack } from './realtime.js';

const app = express();
const upload = multer({ dest: 'uploads/' });


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze', upload.single('track'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing track upload' });
  }

RGBKnights marked this conversation as resolved.
Outdated
  const task = req.body.task || 'analysis';
  const lyricContext = req.body.lyricContext || '';
RGBKnights marked this conversation as resolved.
Outdated

  const filePath = path.join(__dirname, '..', req.file.path);

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
    res.status(500).json({
      error: 'Failed to process track with OpenAI Realtime API',
      details: error?.message ?? 'Unknown error',
    });
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});