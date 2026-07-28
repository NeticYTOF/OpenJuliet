/**
 * OpenJuliet Web Server
 * Standalone HTTP server that replaces the Electron main process.
 * Serves the React UI and provides REST API + WebSocket for all backend operations.
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

const PORT = 2324;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ── Static files ──
const rendererDir = path.join(__dirname, 'out', 'renderer');
app.use(express.static(rendererDir));
app.use(express.json());

// ── WebSocket ──
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function broadcast(event, data) {
  const msg = JSON.stringify({ event, data });
  for (const ws of clients) {
    try { ws.send(msg); } catch {}
  }
}

// ── API Routes ──

// App info
app.get('/api/app/version', (req, res) => {
  res.json({ version: '1.1.0', platform: 'web' });
});

// GitHub endpoints
app.post('/api/github/authenticate', (req, res) => {
  const { token } = req.body;
  // In a real app, this would validate with Octokit
  res.json({ success: true, login: 'demo-user' });
});

app.get('/api/github/repos', (req, res) => {
  res.json([
    { id: 1, name: 'demo-project', owner: 'demo', language: 'TypeScript', private: false, updatedAt: new Date().toISOString() },
    { id: 2, name: 'sample-app', owner: 'demo', language: 'JavaScript', private: true, updatedAt: new Date().toISOString() }
  ]);
});

app.get('/api/github/issues', (req, res) => {
  res.json([
    { id: 1, number: 1, title: 'Fix missing import', state: 'open', labels: ['bug'], createdAt: new Date().toISOString() },
    { id: 2, number: 2, title: 'Add new feature', state: 'open', labels: ['enhancement'], createdAt: new Date().toISOString() }
  ]);
});

app.get('/api/github/prs', (req, res) => {
  res.json([
    { id: 1, number: 1, title: 'Fix: add missing import', state: 'open', draft: false, createdAt: new Date().toISOString() }
  ]);
});

app.post('/api/github/create-pr', (req, res) => {
  res.json({ id: 2, number: 2, title: req.body.title || 'New PR', state: 'open', html_url: '#' });
});

// Git endpoints
app.post('/api/git/clone', (req, res) => {
  res.json({ success: true, path: req.body.path || '/tmp/repo' });
});

app.get('/api/git/status', (req, res) => {
  res.json({ branch: 'main', behind: 0, ahead: 0, staged: [], unstaged: [], untracked: [], conflicts: [] });
});

app.get('/api/git/branches', (req, res) => {
  res.json({ current: 'main', branches: ['main', 'develop'], all: ['main', 'develop'] });
});

app.post('/api/git/commit', (req, res) => {
  res.json({ success: true, hash: 'abc1234' });
});

// Provider endpoints
app.get('/api/providers/list', (req, res) => {
  res.json([
    { id: 'openai', name: 'OpenAI', type: 'openai', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini'], isActive: false },
    { id: 'anthropic', name: 'Anthropic', type: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-sonnet-4'], isActive: false },
    { id: 'ollama', name: 'Ollama', type: 'ollama', baseUrl: 'http://localhost:11434', models: ['llama3'], isActive: false }
  ]);
});

app.post('/api/providers/test', async (req, res) => {
  const { id } = req.body;
  // Simulate testing
  setTimeout(() => res.json({ success: true, latency: 150 }), 500);
});

// Execution endpoints
let currentTask = null;
let taskHistory = [];

app.post('/api/execution/run', (req, res) => {
  const task = { id: Date.now().toString(), ...req.body, status: 'running', progress: 0, startedAt: new Date().toISOString() };
  currentTask = task;
  taskHistory.unshift(task);
  broadcast('execution:started', task);

  // Simulate progress
  const stages = ['analyze', 'plan', 'implement', 'test', 'review', 'commit', 'pr'];
  let i = 0;
  const interval = setInterval(() => {
    if (i >= stages.length) {
      clearInterval(interval);
      task.status = 'completed';
      task.progress = 100;
      broadcast('execution:complete', { taskId: task.id, exitCode: 0, duration: 3500 });
      return;
    }
    const progress = Math.round(((i + 1) / stages.length) * 100);
    task.progress = progress;
    broadcast('execution:progress', { taskId: task.id, progress, stage: stages[i], message: `Running ${stages[i]}...` });
    broadcast('execution:log', { taskId: task.id, line: `[${stages[i]}] Processing...`, stream: 'stdout' });
    i++;
  }, 800);

  res.json(task);
});

app.post('/api/execution/cancel', (req, res) => {
  if (currentTask) currentTask.status = 'cancelled';
  res.json({ success: true });
});

app.get('/api/execution/status', (req, res) => {
  res.json(currentTask || { status: 'idle' });
});

app.get('/api/execution/history', (req, res) => {
  res.json(taskHistory);
});

// Workspace
app.post('/api/workspace/select', (req, res) => {
  res.json({ path: req.body.path || '/home/user/workspace' });
});

app.get('/api/workspace/state', (req, res) => {
  res.json({ path: '/home/user/workspace' });
});

// Shell execution
app.post('/api/shell/exec', (req, res) => {
  const { command } = req.body;
  try {
    const output = execSync(command, { encoding: 'utf-8', timeout: 10000, cwd: req.body.cwd });
    res.json({ stdout: output, stderr: '', exitCode: 0 });
  } catch (err) {
    res.json({ stdout: err.stdout || '', stderr: err.stderr || err.message, exitCode: err.status || 1 });
  }
});

// Settings
const settings = {
  theme: 'dark',
  workspaceDir: '',
  fontSize: 14,
  animationsEnabled: true,
  concurrency: 2,
  sandboxEnabled: true,
  executionTimeout: 300000,
  notificationsEnabled: true
};

app.get('/api/settings', (req, res) => res.json(settings));
app.post('/api/settings', (req, res) => {
  Object.assign(settings, req.body);
  res.json({ success: true });
});

// Demo
app.post('/api/demo/start', (req, res) => {
  res.json({ success: true, message: 'Demo started' });
  // Trigger the full workflow simulation
  const stages = ['analyze', 'plan', 'implement', 'test', 'review', 'commit', 'pr'];
  stages.forEach((stage, i) => {
    setTimeout(() => {
      broadcast('execution:progress', { taskId: 'demo', progress: Math.round(((i+1)/stages.length)*100), stage, message: `Demo: ${stage}...` });
      broadcast('execution:log', { taskId: 'demo', line: `[${stage}] Demo workflow running...`, stream: 'stdout' });
      if (i === stages.length - 1) {
        broadcast('execution:complete', { taskId: 'demo', exitCode: 0, duration: 5600 });
      }
    }, (i + 1) * 800);
  });
});

// ── Serve index.html for all other routes (SPA support) ──
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(rendererDir, 'index.html'));
});

// ── Start ──
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🚀 OpenJuliet Web Server`);
  console.log(`  ─────────────────────`);
  console.log(`  🌐 http://localhost:${PORT}`);
  console.log(`  📡 WebSocket ready`);
  console.log(`\n  Press Ctrl+C to stop\n`);
});
