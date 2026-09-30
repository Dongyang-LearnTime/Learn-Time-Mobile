const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const axios = require('axios');

const root = path.resolve(__dirname, '..');
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise(setImmediate);
function token(userId = 42, overrides = {}) {
  const payload = { userId, sub: `user${userId}@example.test`, name: '테스트', role: 'ROLE_USER', exp: Math.floor(Date.now() / 1000) + 3600, ...overrides };
  return `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.test-signature`;
}
function runtime({ development = false, url = 'https://api.example.test', demo = 'false', adapter } = {}) {
  const values = new Map();
  const native = {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0,
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => { values.set(key, value); },
    deleteItemAsync: async (key) => { values.delete(key); },
  };
  const cache = new Map();
  const axiosMock = {
    create: (options) => axios.create({ ...options, adapter: adapter ?? (() => { throw new Error('Unexpected network request'); }) }),
    isAxiosError: axios.isAxiosError,
  };
  function load(file) {
    file = path.resolve(root, file);
    if (!path.extname(file)) file += '.ts';
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const localRequire = (id) => {
      if (id === 'expo-secure-store') return native;
      if (id === 'axios') return { __esModule: true, default: axiosMock };
      if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id));
      return require(id);
    };
    new Function('require', 'module', 'exports', '__DEV__', 'process', code)(localRequire, module, module.exports, development, { env: { EXPO_PUBLIC_API_BASE_URL: url, EXPO_PUBLIC_DEMO_MODE: demo } });
    return module.exports;
  }
  return { load, values, native };
}
function ok(config, data = {}) { return { status: 200, statusText: 'OK', headers: {}, config, data }; }
function unauthorized(config) {
  const response = { status: 401, statusText: 'Unauthorized', headers: {}, config, data: {} };
  throw new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
}

test('release blocks HTTP/demo auth and rejects URL credentials, queries and fragments', () => {
  for (const url of ['http://192.168.1.2:8080', 'https://user:pass@example.test', 'https://api.example.test?secret=x', 'https://api.example.test#token']) {
    assert.equal(runtime({ url }).load('src/constants/config').config.apiBaseUrl, '');
  }
  assert.equal(runtime({ demo: 'true' }).load('src/constants/config').config.demoMode, false);
});

test('development HTTP only permits valid private IPv4 hosts and localhost', () => {
  for (const url of ['http://10.evil.test', 'http://192.168.evil.test', 'http://172.16.evil.test', 'http://172.32.0.1', 'http://8.8.8.8']) {
    assert.equal(runtime({ development: true, url }).load('src/constants/config').config.apiBaseUrl, '');
  }
  for (const url of ['http://localhost:8080', 'http://127.0.0.1', 'http://10.0.2.2', 'http://192.168.1.2', 'http://172.31.1.2']) {
    assert.equal(runtime({ development: true, url }).load('src/constants/config').config.apiBaseUrl, url);
  }
});

test('malformed, expired and nonnumeric account claims cannot authenticate', async () => {
  const auth = runtime().load('src/stores/authStore').useAuthStore;
  for (const value of ['not-a-jwt', token(42, { exp: 0 }), token('42'), token(42, { sub: {} }), token(42, { name: {} })]) {
    await assert.rejects(auth.getState().setAccessToken(value));
    assert.equal(auth.getState().isAuthenticated, false);
  }
});

test('refresh response after logout and a new login cannot restore the previous account', async () => {
  const refresh = deferred(); let refreshCalls = 0;
  const env = runtime({ adapter: async (config) => {
    if (config.url === '/api/auth/refresh') { refreshCalls++; return ok(config, await refresh.promise); }
    return unauthorized(config);
  } });
  const auth = env.load('src/stores/authStore').useAuthStore;
  env.load('src/stores/timerStore');
  await auth.getState().setAccessToken(token());
  const api = env.load('src/api/client').apiClient;
  const pending = api.get('/api/user/summary');
  const rejection = assert.rejects(pending);
  while (!refreshCalls) await tick();
  await auth.getState().clearAuth();
  await auth.getState().setAccessToken(token(43));
  refresh.resolve({ accessToken: token(42, { exp: Math.floor(Date.now() / 1000) + 7200 }) });
  await rejection;
  assert.equal(auth.getState().userId, 43);
  assert.equal(env.values.get('learntime.accessToken'), token(43));
});

test('a late 401 from a previous session does not log out the current account', async () => {
  const response = deferred(); let sent = false;
  const env = runtime({ adapter: async (config) => { sent = true; await response.promise; return unauthorized(config); } });
  const auth = env.load('src/stores/authStore').useAuthStore;
  await auth.getState().setAccessToken(token());
  const pending = env.load('src/api/client').apiClient.get('/api/user/summary');
  const rejection = assert.rejects(pending);
  while (!sent) await tick();
  await auth.getState().clearAuth(); await auth.getState().setAccessToken(token(43));
  response.resolve(); await rejection;
  assert.equal(auth.getState().userId, 43);
});

test('parallel unauthorized requests share one refresh and retry with the new token', async () => {
  const refresh = deferred(); let refreshCalls = 0;
  const renewed = token(42, { exp: Math.floor(Date.now() / 1000) + 7200 });
  const env = runtime({ adapter: async (config) => {
    if (config.url === '/api/auth/refresh') { refreshCalls++; return ok(config, await refresh.promise); }
    if (!config._retry) return unauthorized(config);
    assert.equal(config.headers.Authorization, `Bearer ${renewed}`);
    return ok(config, { accepted: true });
  } });
  const auth = env.load('src/stores/authStore').useAuthStore;
  await auth.getState().setAccessToken(token());
  const api = env.load('src/api/client').apiClient;
  const pending = Promise.all([api.get('/api/user/summary'), api.get('/api/study/progress')]);
  while (!refreshCalls) await tick(); await tick();
  assert.equal(refreshCalls, 1); refresh.resolve({ accessToken: renewed });
  assert.equal((await pending).length, 2); assert.equal(refreshCalls, 1);
});

test('foreign URLs/baseURL cannot receive the bearer token', async () => {
  let calls = 0;
  const env = runtime({ adapter: async (config) => { calls++; return ok(config); } });
  await env.load('src/stores/authStore').useAuthStore.getState().setAccessToken(token());
  const api = env.load('src/api/client').apiClient;
  await assert.rejects(api.get('https://evil.example.test/api/user/summary'));
  await assert.rejects(api.get('/api/user/summary', { baseURL: 'https://evil.example.test' }));
  assert.equal(calls, 0);
});

test('logout invalidates memory even if native credential removal fails', async () => {
  const env = runtime(); const auth = env.load('src/stores/authStore').useAuthStore;
  const timer = env.load('src/stores/timerStore').useTimerStore;
  await auth.getState().setAccessToken(token());
  await timer.getState().selectPlan({ studyDailyPlanId: 7, studyTitle: '계획', planContent: '내용', progressStatus: 'IN_PROGRESS' });
  env.native.deleteItemAsync = async () => { throw new Error('storage unavailable'); };
  await assert.rejects(auth.getState().clearAuth());
  assert.equal(auth.getState().isAuthenticated, false);
  assert.equal(timer.getState().studyDailyPlanId, null);
});

test('timer restore refuses other accounts and records without an owner', async () => {
  for (const ownerId of [43, undefined]) {
    const env = runtime(); const auth = env.load('src/stores/authStore').useAuthStore;
    const timer = env.load('src/stores/timerStore').useTimerStore;
    await auth.getState().setAccessToken(token());
    env.values.set('learntime.timer', JSON.stringify({ ownerId, studyDailyPlanId: 7, studyTitle: '다른 계정', planContent: '내용', progressStatus: 'IN_PROGRESS', isRunning: false, startedAt: null, accumulatedSeconds: 123 }));
    await timer.getState().hydrate();
    assert.equal(timer.getState().studyDailyPlanId, null);
    assert.equal(env.values.has('learntime.timer'), false);
  }
});

test('reselecting the same plan preserves time; failed persistence does not erase it', async () => {
  const env = runtime(); const auth = env.load('src/stores/authStore').useAuthStore;
  const timer = env.load('src/stores/timerStore').useTimerStore;
  await auth.getState().setAccessToken(token());
  const plan = { studyDailyPlanId: 7, studyTitle: '계획', planContent: '내용', progressStatus: 'IN_PROGRESS' };
  await timer.getState().selectPlan(plan);
  const stored = { ...JSON.parse(env.values.get('learntime.timer')), accumulatedSeconds: 123 };
  env.values.set('learntime.timer', JSON.stringify(stored)); await timer.getState().hydrate();
  await timer.getState().selectPlan(plan); assert.equal(timer.getState().elapsedSeconds(), 123);
  env.native.setItemAsync = async () => { throw new Error('storage unavailable'); };
  await assert.rejects(timer.getState().reset()); assert.equal(timer.getState().elapsedSeconds(), 123);
});

test('logout deletion runs after an in-flight token write; token is not restored', async () => {
  const env = runtime(); const auth = env.load('src/stores/authStore').useAuthStore;
  await auth.getState().setAccessToken(token());
  const writing = deferred(); const resume = deferred();
  env.native.setItemAsync = async (key, value) => { writing.resolve(); await resume.promise; env.values.set(key, value); };
  const version = auth.getState().sessionVersion;
  const renewing = auth.getState().setAccessToken(token(42, { exp: Math.floor(Date.now() / 1000) + 7200 }), version);
  const rejection = assert.rejects(renewing);
  await writing.promise;
  const logout = auth.getState().clearAuth(); resume.resolve();
  await Promise.all([rejection, logout]);
  assert.equal(env.values.has('learntime.accessToken'), false);
  assert.equal(auth.getState().isAuthenticated, false);
});

test('auth hydration cannot restore credentials after logout', async () => {
  const env = runtime(); const auth = env.load('src/stores/authStore').useAuthStore;
  const reading = deferred(); const resume = deferred();
  env.native.getItemAsync = async () => { reading.resolve(); await resume.promise; return token(); };
  const hydrate = auth.getState().hydrate(); await reading.promise;
  const logout = auth.getState().clearAuth(); resume.resolve();
  await Promise.all([hydrate, logout]);
  assert.equal(auth.getState().isAuthenticated, false);
  assert.equal(auth.getState().isHydrating, false);
});

test('timer work started during an account switch cannot restore the previous timer', async () => {
  const env = runtime(); const auth = env.load('src/stores/authStore').useAuthStore;
  const timer = env.load('src/stores/timerStore').useTimerStore;
  await auth.getState().setAccessToken(token());
  await timer.getState().selectPlan({ studyDailyPlanId: 7, studyTitle: '이전 계정', planContent: '내용', progressStatus: 'IN_PROGRESS' });
  const writing = deferred(); const resume = deferred();
  const accountToken = token(43);
  env.native.setItemAsync = async (key, value) => {
    if (value === accountToken) { writing.resolve(); await resume.promise; }
    env.values.set(key, value);
  };
  const switchAccount = auth.getState().setAccessToken(accountToken); await writing.promise;
  const staleStart = timer.getState().start(); const rejection = assert.rejects(staleStart);
  resume.resolve(); await Promise.all([switchAccount, rejection]); await tick();
  assert.equal(auth.getState().userId, 43);
  assert.equal(timer.getState().studyDailyPlanId, null);
});
