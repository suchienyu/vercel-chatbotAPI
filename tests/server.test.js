// tests/server.test.js
const request = require('supertest');

// Mock PostgreSQL
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn().mockResolvedValue(),
    query: jest.fn().mockResolvedValue({ rows: [] })
  };
  return { Pool: jest.fn(() => mPool) };
});

const app = require('../server');
let server;

beforeAll(() => {
  server = app.listen(0); // 使用隨機端口
});

afterAll((done) => {
  server.close(done);
});

describe('API 測試', () => {
  it('GET /health 應該要回傳 ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});