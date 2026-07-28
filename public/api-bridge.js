/**
 * OpenJuliet Web Client API Adapter
 * Replaces window.api (Electron IPC) with HTTP fetch calls to the server.
 * Inject this script before the React app loads.
 */

(function () {
  const API_BASE = '';

  // ── WebSocket connection ──
  const WS_PROTO = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${WS_PROTO}//${location.host}`;
  let ws = null;
  const listeners = {};

  function connectWebSocket() {
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const { event: evt, data } = JSON.parse(event.data);
          if (listeners[evt]) {
            listeners[evt].forEach((fn) => fn(data));
          }
        } catch {}
      };
      ws.onclose = () => setTimeout(connectWebSocket, 2000);
    } catch {}
  }
  connectWebSocket();

  function onEvent(channel, callback) {
    if (!listeners[channel]) listeners[channel] = [];
    listeners[channel].push(callback);
    return () => {
      listeners[channel] = listeners[channel].filter((fn) => fn !== callback);
    };
  }

  // ── HTTP helpers ──
  async function api(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const err = new Error(`API error: ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function apiGet(path) {
    return api(path);
  }

  function apiPost(path, body) {
    return api(path, { method: 'POST', body: JSON.stringify(body) });
  }

  // ── Build window.api ──
  window.api = {
    minimize: () => {},
    maximize: () => {},
    close: () => {},
    isMaximized: () => Promise.resolve(false),
    getAppVersion: () => apiGet('/api/app/version').then((r) => r.version),
    platform: 'web',

    // GitHub
    github: {
      listRepos: () => apiGet('/api/github/repos'),
      getRepo: (owner, repo) => apiGet(`/api/github/repos/${owner}/${repo}`),
      listIssues: (owner, repo) => apiGet(`/api/github/issues?owner=${owner}&repo=${repo}`),
      getIssue: (owner, repo, number) => apiGet(`/api/github/issues/${owner}/${repo}/${number}`),
      createPR: (params) => apiPost('/api/github/create-pr', params),
      listPRs: (owner, repo) => apiGet(`/api/github/prs?owner=${owner}&repo=${repo}`),
      authenticate: (token) => apiPost('/api/github/authenticate', { token }),
    },

    // Git
    git: {
      clone: (url, path, options) => apiPost('/api/git/clone', { url, path, options }),
      status: (repoPath) => apiGet(`/api/git/status?path=${encodeURIComponent(repoPath)}`),
      branch: (repoPath) => apiGet(`/api/git/branches?path=${encodeURIComponent(repoPath)}`),
      commit: (repoPath, message, options) => apiPost('/api/git/commit', { repoPath, message, options }),
      push: (repoPath, options) => apiPost('/api/git/push', { repoPath, options }),
      pull: (repoPath, options) => apiPost('/api/git/pull', { repoPath, options }),
      diff: (repoPath, options) => apiGet(`/api/git/diff?path=${encodeURIComponent(repoPath)}`),
      log: (repoPath, options) => apiGet(`/api/git/log?path=${encodeURIComponent(repoPath)}`),
    },

    // Execution
    execution: {
      run: (task) => apiPost('/api/execution/run', task),
      cancel: (taskId) => apiPost('/api/execution/cancel', { taskId }),
      getStatus: (taskId) => apiGet(`/api/execution/status?id=${taskId}`),
      getHistory: () => apiGet('/api/execution/history'),
      onProgress: (callback) => onEvent('execution:progress', callback),
      onLog: (callback) => onEvent('execution:log', callback),
      onComplete: (callback) => onEvent('execution:complete', callback),
    },

    // Provider
    provider: {
      list: () => apiGet('/api/providers/list'),
      setActive: (id) => apiPost('/api/providers/set-active', { id }),
      test: (id) => apiPost('/api/providers/test', { id }),
    },

    // Workspace
    workspace: {
      select: (path) => apiPost('/api/workspace/select', { path }),
      getState: () => apiGet('/api/workspace/state'),
      getProjects: () => apiGet('/api/workspace/projects'),
    },

    // App
    app: {
      getVersion: () => apiGet('/api/app/version').then((r) => r.version),
      getPlatform: () => Promise.resolve('web'),
      openExternal: (url) => window.open(url, '_blank'),
    },

    // Shell
    shell: {
      exec: (command, options) => apiPost('/api/shell/exec', { command, ...options }),
    },

    // Settings
    settings: {
      get: (key) => apiGet('/api/settings').then((s) => s[key]),
      set: (key, value) => apiPost('/api/settings', { [key]: value }),
      getAll: () => apiGet('/api/settings'),
    },

    // Database
    db: {
      query: (sql, params) => apiPost('/api/db/query', { sql, params }),
    },

    // Events
    events: {
      on: (channel, callback) => onEvent(channel, callback),
    },
  };

  // ── Mark as ready ──
  document.dispatchEvent(new Event('api-ready'));
  console.log('[OpenJuliet Web] API adapter ready');
})();
