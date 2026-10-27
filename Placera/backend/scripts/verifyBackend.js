require('dotenv').config();
const http = require('http');
const app = require('../app');

async function runTests() {
  console.log('--- Starting Placera V2 Automated Backend Verification ---');
  
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`[Test Server] Temporary runner listening on port ${port}`);

  let passed = 0;
  let failed = 0;

  const request = (method, path, headers = {}, body = null) => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            let json = null;
            try {
              json = JSON.parse(data);
            } catch (e) {
              json = data;
            }
            resolve({ statusCode: res.statusCode, body: json });
          });
        }
      );
      req.on('error', reject);
      if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
      req.end();
    });
  };

  const testCase = async (name, fn) => {
    try {
      await fn();
      console.log(` PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(` FAIL: ${name} ->`, err.message);
      failed++;
    }
  };

  // 1. Health check
  await testCase('1. Health check responds with 200 and success: true', async () => {
    const res = await request('GET', '/api/health');
    if (res.statusCode !== 200 || res.body.status !== 'ok') {
      throw new Error(`Expected 200, got ${res.statusCode}`);
    }
  });

  // 2. Missing token
  await testCase('2. Protected route with missing token returns 401', async () => {
    const res = await request('GET', '/api/auth/me');
    if (res.statusCode !== 401 || res.body.success !== false) {
      throw new Error(`Expected 401, got ${res.statusCode}`);
    }
  });

  // 3. Malformed token
  await testCase('3. Protected route with invalid bearer token returns 401', async () => {
    const res = await request('GET', '/api/auth/me', { Authorization: 'Bearer invalid.token.signature' });
    if (res.statusCode !== 401 || !res.body.message.includes('token is invalid')) {
      throw new Error(`Expected 401 invalid token, got ${res.statusCode}`);
    }
  });

  // 4. Admin role registration rejection
  await testCase('4. Public registration rejects admin role with 400', async () => {
    const res = await request('POST', '/api/auth/register', {}, {
      name: 'Admin Attempt',
      email: 'hacker@admin.com',
      password: 'Password123!',
      role: 'admin',
    });
    if (res.statusCode !== 400 || res.body.success !== false) {
      throw new Error(`Expected 400 rejection, got ${res.statusCode}`);
    }
  });

  // 5. Short password validation
  await testCase('5. Public registration rejects passwords < 6 chars with 400', async () => {
    const res = await request('POST', '/api/auth/register', {}, {
      name: 'Test Student',
      email: 'student@college.edu',
      password: '123',
      role: 'student',
    });
    if (res.statusCode !== 400 || !res.body.errors.some((e) => e.includes('6 characters'))) {
      throw new Error(`Expected 400 password length error, got ${res.statusCode}`);
    }
  });

  // 6. Invalid email validation
  await testCase('6. Public registration rejects invalid email format with 400', async () => {
    const res = await request('POST', '/api/auth/register', {}, {
      name: 'Test Student',
      email: 'invalid-email-address',
      password: 'Password123!',
      role: 'student',
    });
    if (res.statusCode !== 400 || !res.body.errors.some((e) => e.includes('valid email'))) {
      throw new Error(`Expected 400 email format error, got ${res.statusCode}`);
    }
  });

  // 7. Invalid ObjectId parameter validation
  await testCase('7. Invalid ObjectId format on routes returns 400 bad request', async () => {
    const res = await request('GET', '/api/jobs/invalid_123_id');
    if (res.statusCode !== 400 || !res.body.message.includes('Invalid ID parameter format')) {
      throw new Error(`Expected 400 ObjectId format error, got ${res.statusCode}`);
    }
  });

  // 8. Unauthenticated job creation rejection
  await testCase('8. Unauthenticated job creation returns 401', async () => {
    const res = await request('POST', '/api/jobs', {}, {
      title: 'Senior Dev',
      companyName: 'Acme',
      description: 'Engineering systems',
      location: 'Remote',
      salary: '20 LPA',
      deadline: '2026-12-31',
    });
    if (res.statusCode !== 401) {
      throw new Error(`Expected 401 unauthenticated, got ${res.statusCode}`);
    }
  });

  // 9. Clean 404 for undefined routes
  await testCase('9. Undefined API endpoint returns clean 404 JSON', async () => {
    const res = await request('GET', '/api/undefined/endpoint');
    if (res.statusCode !== 404 || res.body.success !== false) {
      throw new Error(`Expected 404, got ${res.statusCode}`);
    }
  });

  console.log(`\n--- Verification Summary: ${passed} passed, ${failed} failed ---`);
  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('[Runner Fatal Error]', err);
  process.exit(1);
});
