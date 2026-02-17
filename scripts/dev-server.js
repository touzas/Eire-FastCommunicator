const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const JSON_FILE_PATH = path.join(__dirname, '../assets/data/phrases.json');

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/save-phrases') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const phrases = JSON.parse(body);
                fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(phrases, null, 4));
                console.log('[DevServer] Successfully updated phrases.json');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('[DevServer] Error saving phrases:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`[DevServer] JSON sync server running at http://localhost:${PORT}`);
    console.log(`[DevServer] Target file: ${JSON_FILE_PATH}`);
});
