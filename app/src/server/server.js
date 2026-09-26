/**
 * Минимальный HTTP-сервер (встроенный node:http, без Express — чтобы не тянуть
 * npm-зависимости). Отдаёт статику (public/) и JSON API (routes.js).
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RespondentRepository } from '../storage/respondentRepository.js';
import { getPublicQuestions, getPublicProfileTitles, handleSubmit, handleContact } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(PUBLIC_DIR, decodeURIComponent(filePath.split('?')[0]));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

export function createServer({ dataFilePath } = {}) {
  const repository = new RespondentRepository(dataFilePath);
  return http.createServer(async (req, res) => {
    try {
      if (req.url === '/api/questions' && req.method === 'GET') {
        return sendJson(res, 200, { questions: getPublicQuestions() });
      }

      if (req.url === '/api/profile-titles' && req.method === 'GET') {
        return sendJson(res, 200, { titles: getPublicProfileTitles() });
      }

      if (req.url === '/api/submit' && req.method === 'POST') {
        const body = await readBody(req);
        const { status, body: respBody } = handleSubmit(body, repository);
        return sendJson(res, status, respBody);
      }

      if (req.url === '/api/contact' && req.method === 'POST') {
        const body = await readBody(req);
                const { status, body: respBody } = await handleContact(body, repository);
        return sendJson(res, status, respBody);
      }

      if (req.url?.startsWith('/api/')) {
        return sendJson(res, 404, { error: 'Not found' });
      }

      return serveStatic(req, res);
    } catch (e) {
      console.error(e);
      return sendJson(res, 500, { error: 'Internal server error' });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Diagnostic MVP running on http://localhost:${PORT}`);
  });
}
