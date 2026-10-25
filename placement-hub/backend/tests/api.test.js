const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Load environment variables
require('dotenv').config();

const app = require('../app');

// Helper to make local HTTP requests to the express app without opening external ports
const makeRequest = (server, { method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

test.describe('PlacementHub V2 Backend Security & Validation Tests', () => {
  let server;

  test.before(() => {
    return new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
  });

  test.after(() => {
    return new Promise((resolve) => {
      server.close(() => resolve());
    });
  });

  test('1. Health Check Endpoint responds with 200', async () => {
    const res = await makeRequest(server, { method: 'GET', path: '/api/health' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.status, 'ok');
  });

  test('2. Missing Authorization Token returns 401', async () => {
    const res = await makeRequest(server, { method: 'GET', path: '/api/auth/me' });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /no bearer token provided/i);
  });

  test('3. Malformed Authorization Token returns 401', async () => {
    const res = await makeRequest(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: 'Bearer this_is_an_invalid_token' },
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /token is invalid/i);
  });

  test('4. Registration rejects public admin role attempt with 400', async () => {
    const res = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Hacker Admin',
        email: 'hacker@admin.com',
        password: 'Password123!',
        role: 'admin',
      },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.some((e) => e.includes('student') || e.includes('recruiter')));
  });

  test('5. Registration rejects short passwords (< 6 chars) with 400', async () => {
    const res = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'John Doe',
        email: 'john@student.com',
        password: '123',
        role: 'student',
      },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.some((e) => e.includes('6 characters')));
  });

  test('6. Registration rejects invalid email formats with 400', async () => {
    const res = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'John Doe',
        email: 'not-an-email',
        password: 'Password123!',
        role: 'student',
      },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.some((e) => e.includes('valid email')));
  });

  test('7. Login rejects missing credentials with 400', async () => {
    const res = await makeRequest(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {},
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  });

  test('8. Invalid MongoDB ObjectId parameter returns 400 (not 500)', async () => {
    const res = await makeRequest(server, {
      method: 'GET',
      path: '/api/jobs/invalid_mongo_id_123',
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid id parameter format/i);
  });

  test('9. Unauthenticated users cannot post jobs', async () => {
    const res = await makeRequest(server, {
      method: 'POST',
      path: '/api/jobs',
      body: {
        title: 'Backend Engineer',
        companyName: 'Acme Corp',
        description: 'Building microservices and high-throughput systems',
        location: 'Remote',
        salary: '12 LPA',
        deadline: '2026-12-31',
      },
    });
    assert.equal(res.statusCode, 401);
  });

  test('10. Non-existent API route returns clean 404 JSON', async () => {
    const res = await makeRequest(server, {
      method: 'GET',
      path: '/api/non_existent_route',
    });
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /route not found/i);
  });
});
