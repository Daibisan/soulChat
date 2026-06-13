require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

async function test() {
  const contents1 = [
    { role: 'model', parts: [{ text: 'Halo! Aku SoulChat.' }] },
    { role: 'user', parts: [{ text: 'Halo juga' }] }
  ];

  console.log('--- TEST 1 ---');
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: contents1 })
  });
  console.log('Status 1:', res.status);
  console.log(await res.text());

  const contents2 = [
    { role: 'model', parts: [{ text: 'Halo! Aku SoulChat.' }] },
    { role: 'user', parts: [{ text: 'Halo juga' }] },
    { role: 'model', parts: [{ text: 'Ada yang bisa dibantu?' }] },
    { role: 'user', parts: [{ text: 'Saya sedih' }] }
  ];

  console.log('--- TEST 2 ---');
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: contents2 })
  });
  console.log('Status 2:', res.status);
  console.log(await res.text());
}

test();
