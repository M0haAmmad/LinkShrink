const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'urls.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]), 'utf8');
    return [];
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function generateCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.post('/api/shorten', (req, res) => {
  let { url, customCode } = req.req ? req.req.body : req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'http://' + targetUrl;
  }

  const db = readDb();

  let code = '';
  if (customCode && customCode.trim() !== '') {
    code = customCode.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    if (code.length < 3) {
      return res.status(400).json({ error: 'Custom code must be at least 3 characters' });
    }
    const exists = db.some(item => item.code.toLowerCase() === code.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Custom code is already in use' });
    }
  } else {
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
    } while (db.some(item => item.code === code) && attempts < 100);
  }

  const newLink = {
    code: code,
    originalUrl: targetUrl,
    clicks: 0,
    createdAt: new Date().toISOString()
  };

  db.push(newLink);
  writeDb(db);

  res.status(201).json(newLink);
});

app.get('/api/urls', (req, res) => {
  const db = readDb();
  res.json(db);
});

app.delete('/api/urls/:code', (req, res) => {
  const code = req.params.code;
  let db = readDb();
  const index = db.findIndex(item => item.code === code);
  if (index === -1) {
    return res.status(404).json({ error: 'Link not found' });
  }
  db.splice(index, 1);
  writeDb(db);
  res.json({ success: true });
});

app.get('/:code', (req, res) => {
  const code = req.params.code;
  const db = readDb();
  const link = db.find(item => item.code === code);
  if (link) {
    link.clicks += 1;
    writeDb(db);
    return res.redirect(link.originalUrl);
  }
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Link Not Found</title>
      <style>
        body { font-family: sans-serif; background-color: #09090b; color: #f5f5f4; text-align: center; padding: 50px; }
        h1 { color: #ef4444; }
        a { color: #3b82f6; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Link Not Found</h1>
      <p>The shortened link code <strong>${code}</strong> does not exist in our system.</p>
      <p><a href="/">Go back to Dashboard</a></p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
