const express = require('express');
const path    = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Proxy ke Anthropic API (API key aman di server) ──
app.post('/api/chat', async (req, res) => {
  const { system, message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',   // lebih hemat untuk demo
        max_tokens: 400,
        system: system || 'Kamu adalah asisten kesehatan DiabeCare untuk pasien diabetes.',
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(502).json({ error: 'AI tidak tersedia saat ini.' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Maaf, tidak ada respons.';
    res.json({ reply: text });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Fallback: serve index.html untuk semua route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DiabeCare server running on port ${PORT}`));
