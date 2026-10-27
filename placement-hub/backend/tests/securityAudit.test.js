require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

async function runSecurityAuditTests() {
  console.log('=== Starting Placera Phase 2: Security & Reliability Audit Test Suite ===');

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`[Audit Test Server] Listening on port ${port}`);

  let passed = 0;
  let failed = 0;

  const request = (method, path, headers = {}, body = null, rawData = null) => {
    return new Promise((resolve, reject) => {
      const isBuffer = Buffer.isBuffer(rawData);
      const reqHeaders = isBuffer
        ? { ...headers }
        : { 'Content-Type': 'application/json', ...headers };

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
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
            resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
          });
        }
      );
      req.on('error', reject);
      if (isBuffer) {
        req.write(rawData);
      } else if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
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

  const secret = process.env.JWT_SECRET || 'fallback_placera_secret_key';
  const getAuthHeader = (userId) => {
    const token = jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
    return { Authorization: `Bearer ${token}` };
  };

  let recruiterA, recruiterB, studentA, studentB, adminUser;
  let jobA, jobB;
  let appA, appB;
  let interviewAId;

  try {
    const tag = `audit_${Date.now()}`;

    recruiterA = await User.create({
      name: 'Audit Recruiter A',
      email: `rec_a_${tag}@corp.com`,
      password: 'password123',
      role: 'recruiter',
    });

    recruiterB = await User.create({
      name: 'Audit Recruiter B',
      email: `rec_b_${tag}@corp.com`,
      password: 'password123',
      role: 'recruiter',
    });

    studentA = await User.create({
      name: 'Audit Student A',
      email: `stu_a_${tag}@college.edu`,
      password: 'password123',
      role: 'student',
    });

    studentB = await User.create({
      name: 'Audit Student B',
      email: `stu_b_${tag}@college.edu`,
      password: 'password123',
      role: 'student',
    });

    adminUser = await User.create({
      name: 'Audit Admin',
      email: `admin_${tag}@placera.edu`,
      password: 'password123',
      role: 'admin',
    });

    // Create student profile with resume for studentA
    await StudentProfile.create({
      userId: studentA._id,
      college: 'Tech University',
      branch: 'CS',
      graduationYear: 2026,
      phone: '1234567890',
      resumeUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.pdf',
      resumeFilename: 'studentA_resume.pdf',
    });

    jobA = await Job.create({
      title: 'DevOps Engineer',
      companyName: 'Alpha Tech',
      description: 'Cloud infrastructure management',
      location: 'Hyderabad',
      salary: '16 LPA',
      deadline: new Date(Date.now() + 86400000 * 20),
      postedBy: recruiterA._id,
    });

    jobB = await Job.create({
      title: 'QA Engineer',
      companyName: 'Beta Systems',
      description: 'Testing automation frameworks',
      location: 'Pune',
      salary: '12 LPA',
      deadline: new Date(Date.now() + 86400000 * 20),
      postedBy: recruiterB._id,
    });

    // Student A applies to Job A (owned by recruiter A)
    appA = await Application.create({
      studentId: studentA._id,
      jobId: jobA._id,
      status: 'Shortlisted',
    });

    // Student B applies to Job B (owned by recruiter B)
    appB = await Application.create({
      studentId: studentB._id,
      jobId: jobB._id,
      status: 'Applied',
    });

    // --- TEST 1: Security Headers & X-Powered-By check ---
    await testCase('1. Standard security defense headers are present and X-Powered-By is disabled', async () => {
      const res = await request('GET', '/api/health');
      if (res.headers['x-powered-by']) {
        throw new Error('x-powered-by header was not disabled');
      }
      if (res.headers['x-content-type-options'] !== 'nosniff') {
        throw new Error('x-content-type-options header missing or invalid');
      }
      if (res.headers['x-frame-options'] !== 'DENY') {
        throw new Error('x-frame-options header missing or invalid');
      }
    });

    // --- TEST 2: Recruiter Resume Access Control: Recruiter B cannot access Student A resume ---
    await testCase('2. Recruiter B cannot access Student A resume (student applied to Recruiter A only)', async () => {
      const res = await request(
        'GET',
        `/api/students/${studentA._id}/resume`,
        getAuthHeader(recruiterB._id)
      );
      if (res.statusCode !== 403) {
        throw new Error(`Expected 403 forbidden, got ${res.statusCode}`);
      }
    });

    // --- TEST 3: Recruiter A CAN access Student A resume ---
    await testCase('3. Recruiter A CAN access Student A resume because student applied to Job A', async () => {
      const res = await request(
        'GET',
        `/api/students/${studentA._id}/resume`,
        getAuthHeader(recruiterA._id)
      );
      if (res.statusCode !== 200 || !res.body.success) {
        throw new Error(`Expected 200 success, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    });

    // --- TEST 4: Student B cannot access Student A private resume ---
    await testCase('4. Student B cannot access Student A private resume', async () => {
      const res = await request(
        'GET',
        `/api/students/${studentA._id}/resume`,
        getAuthHeader(studentB._id)
      );
      if (res.statusCode !== 403) {
        throw new Error(`Expected 403 forbidden, got ${res.statusCode}`);
      }
    });

    // --- TEST 5: Recruiter B cannot view applicants of Job A ---
    await testCase('5. Recruiter B cannot view applicants of Job A (owned by Recruiter A)', async () => {
      const res = await request(
        'GET',
        `/api/applications/job/${jobA._id}`,
        getAuthHeader(recruiterB._id)
      );
      if (res.statusCode !== 403) {
        throw new Error(`Expected 403 forbidden, got ${res.statusCode}`);
      }
    });

    // --- TEST 6: Recruiter B cannot update status of Application A ---
    await testCase('6. Recruiter B cannot update status of Application A', async () => {
      const res = await request(
        'PUT',
        `/api/applications/${appA._id}/status`,
        getAuthHeader(recruiterB._id),
        { status: 'Selected' }
      );
      if (res.statusCode !== 403) {
        throw new Error(`Expected 403 forbidden, got ${res.statusCode}`);
      }
    });

    // --- TEST 7: Application status validation rejects invalid status strings ---
    await testCase('7. Application status update rejects invalid status strings', async () => {
      const res = await request(
        'PUT',
        `/api/applications/${appA._id}/status`,
        getAuthHeader(recruiterA._id),
        { status: 'InvalidStatusXYZ' }
      );
      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 bad request, got ${res.statusCode}`);
      }
    });

    // --- TEST 8: Resume upload rejects non-PDF file upload ---
    await testCase('8. Resume upload rejects non-PDF file upload (fake text file)', async () => {
      // Simulate multipart upload with fake text content
      const boundary = '---------------------------974767299852498929531610575';
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="resume"; filename="malicious.txt"',
        'Content-Type: text/plain',
        '',
        'This is not a pdf file.',
        `--${boundary}--`,
      ].join('\r\n');

      const res = await request(
        'POST',
        '/api/students/resume',
        {
          ...getAuthHeader(studentA._id),
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        null,
        Buffer.from(body)
      );

      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 rejection for non-PDF, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    });

    // --- TEST 9: Resume upload rejects fake PDF extension without PDF magic bytes ---
    await testCase('9. Resume upload rejects fake PDF without magic bytes %PDF-', async () => {
      const boundary = '---------------------------974767299852498929531610575';
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="resume"; filename="fake.pdf"',
        'Content-Type: application/pdf',
        '',
        'Plain text pretending to be a pdf file without magic header',
        `--${boundary}--`,
      ].join('\r\n');

      const res = await request(
        'POST',
        '/api/students/resume',
        {
          ...getAuthHeader(studentA._id),
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        null,
        Buffer.from(body)
      );

      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 rejection for fake PDF bytes, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    });

    // --- TEST 10: Schedule interview enforces shortlisted candidate check ---
    const start = new Date(Date.now() + 86400000 * 3);
    start.setUTCHours(14, 0, 0, 0);
    const end = new Date(start.getTime() + 3600000);

    await testCase('10. Schedule interview rejects application that is not shortlisted', async () => {
      // appB is 'Applied', not 'Shortlisted'
      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiterB._id),
        {
          applicationId: appB._id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          mode: 'online',
        }
      );
      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 for non-shortlisted application, got ${res.statusCode}`);
      }
    });

    // --- TEST 11: Schedule interview succeeds for shortlisted applicant ---
    await testCase('11. Schedule interview succeeds for valid shortlisted applicant', async () => {
      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiterA._id),
        {
          applicationId: appA._id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          mode: 'online',
          meetingLink: 'https://meet.google.com/audit-test',
        }
      );
      if (res.statusCode !== 201) {
        throw new Error(`Expected 201 created, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      interviewAId = res.body.interview._id;
    });

    // --- TEST 12: Recruiter B cannot reschedule or cancel Interview A ---
    await testCase('12. Recruiter B cannot reschedule Interview A (owned by Recruiter A)', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interviewAId}/reschedule`,
        getAuthHeader(recruiterB._id),
        {
          startTime: new Date(start.getTime() + 86400000).toISOString(),
          endTime: new Date(end.getTime() + 86400000).toISOString(),
        }
      );
      if (res.statusCode !== 403) {
        throw new Error(`Expected 403 forbidden, got ${res.statusCode}`);
      }
    });

    await testCase('13. Recruiter B cannot cancel Interview A', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interviewAId}/cancel`,
        getAuthHeader(recruiterB._id),
        { cancellationReason: 'Malicious attempt' }
      );
      if (res.statusCode !== 403) {
        throw new Error(`Expected 403 forbidden, got ${res.statusCode}`);
      }
    });

    // --- TEST 14: Student B cannot confirm or decline Interview A ---
    await testCase('14. Student B cannot respond to Interview A (assigned to Student A)', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interviewAId}/respond`,
        getAuthHeader(studentB._id),
        { response: 'confirm' }
      );
      if (res.statusCode !== 403) {
        throw new Error(`Expected 403 forbidden, got ${res.statusCode}`);
      }
    });

    // --- TEST 15: Invalid interview response status rejected ---
    await testCase('15. Invalid interview response status rejected with 400', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interviewAId}/respond`,
        getAuthHeader(studentA._id),
        { response: 'maybe' } // Not 'confirm' or 'decline'
      );
      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 for invalid response string, got ${res.statusCode}`);
      }
    });

    // --- TEST 16: Invalid status transitions: completed interview cannot be cancelled ---
    await testCase('16. Valid student confirmation transitions interview to confirmed', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interviewAId}/respond`,
        getAuthHeader(studentA._id),
        { response: 'confirm' }
      );
      if (res.statusCode !== 200 || res.body.interview.status !== 'confirmed') {
        throw new Error(`Expected status confirmed, got ${res.statusCode}`);
      }
    });

    await testCase('17. Recruiter A marks interview as completed', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interviewAId}/complete`,
        getAuthHeader(recruiterA._id)
      );
      if (res.statusCode !== 200 || res.body.interview.status !== 'completed') {
        throw new Error(`Expected status completed, got ${res.statusCode}`);
      }
    });

    await testCase('18. Completed interview cannot be rescheduled or cancelled', async () => {
      const resCancel = await request(
        'PUT',
        `/api/interviews/${interviewAId}/cancel`,
        getAuthHeader(recruiterA._id),
        { cancellationReason: 'Late cancellation' }
      );
      if (resCancel.statusCode !== 400) {
        throw new Error(`Expected 400 when cancelling completed interview, got ${resCancel.statusCode}`);
      }

      const resReschedule = await request(
        'PUT',
        `/api/interviews/${interviewAId}/reschedule`,
        getAuthHeader(recruiterA._id),
        {
          startTime: new Date(Date.now() + 86400000 * 5).toISOString(),
          endTime: new Date(Date.now() + 86400000 * 5 + 3600000).toISOString(),
        }
      );
      if (resReschedule.statusCode !== 400) {
        throw new Error(`Expected 400 when rescheduling completed interview, got ${resReschedule.statusCode}`);
      }
    });

    // --- TEST 19: Notification pagination validation ---
    await testCase('19. Notification pagination parameter validation rejects negative or non-numeric values', async () => {
      const res = await request(
        'GET',
        '/api/notifications?page=-1&limit=500',
        getAuthHeader(studentA._id)
      );
      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 for invalid page/limit params, got ${res.statusCode}`);
      }
    });

    // --- TEST 20: Clean up test data ---
    await User.deleteMany({ _id: { $in: [recruiterA._id, recruiterB._id, studentA._id, studentB._id, adminUser._id] } });
    await Job.deleteMany({ _id: { $in: [jobA._id, jobB._id] } });
    await Application.deleteMany({ _id: { $in: [appA._id, appB._id] } });
    await StudentProfile.deleteMany({ userId: { $in: [studentA._id, studentB._id] } });
    await Interview.deleteMany({ recruiterId: { $in: [recruiterA._id, recruiterB._id] } });
    await Notification.deleteMany({ recipient: { $in: [studentA._id, studentB._id, recruiterA._id, recruiterB._id] } });

  } catch (err) {
    console.error('[Audit Runner Fatal Error]', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n=== Security Audit Test Suite Summary: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runSecurityAuditTests();
