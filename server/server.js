import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load .env from the server folder
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GEMINI_API_KEY;

// Check if frontend build exists, otherwise fallback to client
const distPath = path.resolve(__dirname, '../frontend/dist');
const localDistPath = path.resolve(__dirname, 'frontend/dist');
const clientPath = path.resolve(__dirname, '../client');

let staticDir = clientPath;
if (fs.existsSync(distPath)) {
  staticDir = distPath;
} else if (fs.existsSync(localDistPath)) {
  staticDir = localDistPath;
}

app.use(cors());
app.use(express.json());
app.use(express.static(staticDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(API_KEY),
  });
});

// Candidate models in priority order for resilience
const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-3.8-flash',
];

// Helper to call Gemini API with a timeout
async function callGeminiApi(model, contents, apiKey, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || data.error) {
      const errMessage = data.error?.message || `HTTP ${response.status}`;
      return { success: false, error: errMessage, status: response.status };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) {
      return { success: true, reply };
    }

    return { success: false, error: 'Empty candidate text returned by Gemini.' };
  } catch (err) {
    clearTimeout(timeoutId);
    return { success: false, error: err.name === 'AbortError' ? 'Request timed out' : err.message };
  }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, input, message, history = [], model = 'gemini-flash-lite-latest' } = req.body;
    const userPrompt = (prompt || input || message || '').trim();

    if (!userPrompt) {
      return res.status(400).json({ success: false, error: 'Please provide a prompt.' });
    }

    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not defined in server/.env',
      });
    }

    // Build clean alternating contents array
    const rawItems = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        const text = (msg.content || msg.text || '').trim();
        if (text) {
          rawItems.push({
            role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
            text: text,
          });
        }
      }
    }
    rawItems.push({ role: 'user', text: userPrompt });

    // Consolidate consecutive turns with the same role and ensure first is user
    const contents = [];
    for (const item of rawItems) {
      if (contents.length === 0) {
        if (item.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        }
      } else {
        const last = contents[contents.length - 1];
        if (last.role === item.role) {
          // Merge text if same role
          last.parts[0].text += `\n${item.text}`;
        } else {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }],
          });
        }
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: userPrompt }] });
    }

    console.log(`[CHAT] Incoming prompt: "${userPrompt.slice(0, 50)}..." | Requested model: ${model}`);

    // Try primary model first, followed by fallbacks if necessary
    const modelsToTry = [
      model,
      ...FALLBACK_MODELS.filter((m) => m !== model),
    ];

    let finalReply = null;
    let usedModel = model;
    let lastError = null;

    for (const currentModel of modelsToTry) {
      console.log(`[GEMINI] Trying model: ${currentModel}...`);
      const result = await callGeminiApi(currentModel, contents, API_KEY);

      if (result.success && result.reply) {
        finalReply = result.reply;
        usedModel = currentModel;
        console.log(`[GEMINI] Success with ${currentModel}! Response length: ${finalReply.length}`);
        break;
      } else {
        console.warn(`[GEMINI] Model ${currentModel} failed: ${result.error}`);
        lastError = result.error;
      }
    }

    if (finalReply) {
      return res.json({
        success: true,
        reply: finalReply,
        output_text: finalReply,
        model: usedModel,
      });
    }

    return res.status(500).json({
      success: false,
      error: lastError || 'All Gemini models failed to respond. Please check your API key or network.',
    });
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback Route for SPA
app.get('*', (req, res) => {
  const indexHtml = path.join(staticDir, 'index.html');
  res.sendFile(indexHtml);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Connected to Google Gemini API (Key length: ${API_KEY ? API_KEY.length : 0})`);
});
