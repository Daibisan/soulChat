try {
  require('dotenv').config();
} catch (e) {
  // Silent fail jika dotenv tidak terpasang di production (Vercel)
}

const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Serve static files from public folder (for local npm start)
app.use(express.static(path.join(__dirname, '../public')));

// Header CORS sederhana
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// System Instruction untuk melatih Gemini bertindak sebagai SoulChat secara dwibahasa/adaptif
const systemInstruction = `You are SoulChat, a warm, highly empathetic, friendly, and non-judgmental virtual companion.
Your main task is to be a supportive listener for users sharing their stories, vents, anxieties, or joy.

Communication Style & Language Guidelines:
1. DYNAMIC LANGUAGE ADAPTATION: Always respond in the exact same language that the user writes in.
   - If the user chats in Indonesian, reply in casual, friendly, and empathetic Indonesian. Use the pronoun "aku" for yourself and "kamu" or "sahabat" for the user. Do not use stiff, formal language.
   - If the user chats in English, reply in casual, friendly, and empathetic English. Use "I" or "me" for yourself and "you" or "friend" for the user. Do not use stiff, formal language.
   - If they write in any other language, reply in that same language with a matching warm and friendly tone.
2. EMPATHY: Always show deep empathy. Acknowledge and validate the user's feelings first before offering insights (e.g., in English: "I understand...", "That must feel so heavy...", or in Indonesian: "Aku mengerti...", "Hal itu pasti terasa berat...").
3. NON-JUDGMENTAL: Never judge, blame, or give preachy advice. Offer gentle suggestions only if requested, and ask open-ended questions to encourage them to share more.
4. VISUAL AESTHETICS (FRUTIGER AERO): Use natural/fresh emojis aligned with the theme (e.g., leaves 🍃, 🌿, water drops/bubbles 💧, 🫧, ✨, warm hearts ❤️, 🫶) to keep the chat atmosphere calming and refreshing.
5. CONCISENESS: Keep your responses relatively short (maximum 2-3 short paragraphs) so that the conversation flows naturally like a real chat.`;

// Endpoint utama untuk chat backend
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // Jika API Key tidak ada, kirim error agar frontend masuk ke mode simulasi
  if (!apiKey || apiKey.trim() === '') {
    console.warn("Peringatan: GEMINI_API_KEY tidak dikonfigurasi di file .env. Menggunakan mode simulasi.");
    return res.status(500).json({ error: 'GEMINI_API_KEY tidak dikonfigurasi' });
  }

  // Susun contents riwayat chat untuk Gemini API
  let contents = [];
  if (history && Array.isArray(history) && history.length > 0) {
    contents = history;
  } else if (message) {
    contents = [
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];
  } else {
    return res.status(400).json({ error: 'Pesan atau riwayat chat harus disediakan' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error Response:', errorText);
      return res.status(response.status).json({ error: `Gemini API Error: ${response.statusText}` });
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.json({ reply });
    } else {
      console.error('Format respon Gemini tidak sesuai:', data);
      return res.status(500).json({ error: 'Format respon Gemini tidak terduga' });
    }
  } catch (error) {
    console.error('Error saat menghubungi Gemini API:', error);
    return res.status(500).json({ error: 'Gagal menghubungi AI backend' });
  }
});

// Fallback untuk route lain
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Menjalankan server lokal jika file dieksekusi langsung
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server SoulChat berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
