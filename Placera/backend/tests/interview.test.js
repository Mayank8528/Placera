require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

async function runInterviewTests() {
  console.log('=== Starting Placera Interview Scheduling Test Suite ===');

  // Connect to DB for stateful tests
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`[Test Server] Runner listening on port ${port}`);

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

  const secret = process.env.JWT_SECRET || 'fallback_placera_secret_key';
  const getAuthHeader = (userId) => {
    const token = jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
    return { Authorization: `Bearer ${token}` };
  };

  // Test Entities
  let recruiter1, recruiter2, student1, student2;
  let job1, job2;
  let appShortlisted, appApplied;
  let interview1Id;

  try {
    // Clean up test data from any previous runs
    const testTag = `test_${Date.now()}`;
    recruiter1 = await User.create({
      name: 'Recruiter One',
      email: `recruiter1_${testTag}@example.com`,
      password: 'password123',
      role: 'recruiter',
    });

    recruiter2 = await User.create({
      name: 'Recruiter Two',
      email: `recruiter2_${testTag}@example.com`,
      password: 'password123',
      role: 'recruiter',
    });

    student1 = await User.create({
      name: 'Student One',
      email: `student1_${testTag}@example.com`,
      password: 'password123',
      role: 'student',
    });

    student2 = await User.create({
      name: 'Student Two',
      email: `student2_${testTag}@example.com`,
      password: 'password123',
      role: 'student',
    });

    job1 = await Job.create({
      title: 'Full Stack Engineer',
      companyName: 'TechCorp',
      description: 'Building modern web platforms',
      location: 'Remote',
      salary: '15 LPA',
      deadline: new Date(Date.now() + 86400000 * 30),
      postedBy: recruiter1._id,
    });

    job2 = await Job.create({
      title: 'Backend Engineer',
      companyName: 'DevHub',
      description: 'Go and Node microservices',
      location: 'Bangalore',
      salary: '18 LPA',
      deadline: new Date(Date.now() + 86400000 * 30),
      postedBy: recruiter2._id,
    });

    appShortlisted = await Application.create({
      studentId: student1._id,
      jobId: job1._id,
      status: 'Shortlisted',
    });

    appApplied = await Application.create({
      studentId: student2._id,
      jobId: job1._id,
      status: 'Applied', // Not shortlisted yet
    });

    // --- TEST 1: Recruiter scheduling interview for own shortlisted applicant ---
    const baseStart = new Date(Date.now() + 86400000 * 5); // 5 days in future
    baseStart.setUTCHours(10, 0, 0, 0);
    const baseEnd = new Date(baseStart.getTime() + 60 * 60 * 1000); // 10:00 - 11:00

    await testCase('1. Recruiter schedules interview for own shortlisted applicant', async () => {
      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter1._id),
        {
          applicationId: appShortlisted._id,
          startTime: baseStart.toISOString(),
          endTime: baseEnd.toISOString(),
          mode: 'online',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          instructions: 'Bring your portfolio and prepare for a DSA walkthrough.',
        }
      );

      if (res.statusCode !== 201 || !res.body.success) {
        throw new Error(`Expected 201, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      interview1Id = res.body.interview._id;
      if (res.body.interview.status !== 'proposed') {
        throw new Error(`Expected initial status 'proposed', got ${res.body.interview.status}`);
      }
    });

    // --- TEST 2: Rejection when application is NOT shortlisted ---
    await testCase('2. Rejection when application is not shortlisted', async () => {
      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter1._id),
        {
          applicationId: appApplied._id, // status is 'Applied'
          startTime: new Date(baseStart.getTime() + 7200000).toISOString(),
          endTime: new Date(baseEnd.getTime() + 7200000).toISOString(),
          mode: 'online',
          meetingLink: 'https://meet.google.com/xyz',
        }
      );

      if (res.statusCode !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 for non-shortlisted applicant, got ${res.statusCode}`);
      }
    });

    // --- TEST 3: Rejection when recruiter does not own the job ---
    await testCase('3. Rejection when recruiter does not own the job', async () => {
      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter2._id), // recruiter2 does not own job1
        {
          applicationId: appShortlisted._id,
          startTime: new Date(baseStart.getTime() + 7200000).toISOString(),
          endTime: new Date(baseEnd.getTime() + 7200000).toISOString(),
          mode: 'online',
          meetingLink: 'https://meet.google.com/xyz',
        }
      );

      if (res.statusCode !== 403 || res.body.success !== false) {
        throw new Error(`Expected 403 forbidden, got ${res.statusCode}`);
      }
    });

    // --- TEST 4: Invalid dates: end time before start time ---
    await testCase('4. Rejection when end time is before start time', async () => {
      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter1._id),
        {
          applicationId: appShortlisted._id,
          startTime: baseEnd.toISOString(),
          endTime: baseStart.toISOString(), // Reversed!
          mode: 'online',
        }
      );

      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 for reversed dates, got ${res.statusCode}`);
      }
    });

    // --- TEST 5: Past interview scheduling rejection ---
    await testCase('5. Rejection when scheduling in the past', async () => {
      const pastStart = new Date(Date.now() - 86400000);
      const pastEnd = new Date(Date.now() - 82800000);
      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter1._id),
        {
          applicationId: appShortlisted._id,
          startTime: pastStart.toISOString(),
          endTime: pastEnd.toISOString(),
          mode: 'online',
        }
      );

      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 for past date, got ${res.statusCode}`);
      }
    });

    // Update student2 application to Shortlisted to test overlap
    appApplied.status = 'Shortlisted';
    await appApplied.save();
    const appShortlisted2 = appApplied;

    // --- TEST 6: Overlapping recruiter bookings rejected (Recruiter 1 busy 10:00 - 11:00) ---
    await testCase('6. Overlapping recruiter bookings rejected (same recruiter, different student)', async () => {
      // Trying 10:30 - 11:30 (overlaps 10:00 - 11:00)
      const overlapStart = new Date(baseStart.getTime() + 30 * 60 * 1000);
      const overlapEnd = new Date(baseEnd.getTime() + 30 * 60 * 1000);

      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter1._id),
        {
          applicationId: appShortlisted2._id,
          startTime: overlapStart.toISOString(),
          endTime: overlapEnd.toISOString(),
          mode: 'online',
        }
      );

      if (res.statusCode !== 409 || res.body.conflictingWith !== 'recruiter') {
        throw new Error(`Expected 409 recruiter conflict, got ${res.statusCode}`);
      }
    });

    // Shortlist student1 for job2 owned by recruiter2
    const appShortlistedJob2 = await Application.create({
      studentId: student1._id,
      jobId: job2._id,
      status: 'Shortlisted',
    });

    // --- TEST 7: Overlapping student bookings rejected (Student 1 busy 10:00 - 11:00 with recruiter 1) ---
    await testCase('7. Overlapping student bookings rejected (different recruiter, same student)', async () => {
      // Recruiter 2 tries to schedule Student 1 at 10:15 - 10:45
      const overlapStart = new Date(baseStart.getTime() + 15 * 60 * 1000);
      const overlapEnd = new Date(baseStart.getTime() + 45 * 60 * 1000);

      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter2._id),
        {
          applicationId: appShortlistedJob2._id,
          startTime: overlapStart.toISOString(),
          endTime: overlapEnd.toISOString(),
          mode: 'online',
        }
      );

      if (res.statusCode !== 409 || res.body.conflictingWith !== 'student') {
        throw new Error(`Expected 409 student conflict, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    });

    // --- TEST 8: Back-to-back interviews allowed (Half-open intervals [10:00, 11:00) and [11:00, 12:00)) ---
    await testCase('8. Back-to-back interviews allowed without conflict', async () => {
      const b2bStart = new Date(baseEnd); // Exactly 11:00
      const b2bEnd = new Date(b2bStart.getTime() + 60 * 60 * 1000); // 12:00

      const res = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter1._id),
        {
          applicationId: appShortlisted2._id,
          startTime: b2bStart.toISOString(),
          endTime: b2bEnd.toISOString(),
          mode: 'online',
        }
      );

      if (res.statusCode !== 201 || !res.body.success) {
        throw new Error(`Expected 201 for back-to-back, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    });

    // --- TEST 9: Rescheduling to a conflicting slot is rejected ---
    await testCase('9. Rescheduling to a conflicting slot is rejected', async () => {
      // Interview 1 is 10:00 - 11:00. Interview 2 is 11:00 - 12:00.
      // Trying to reschedule Interview 1 to 11:30 - 12:30 (conflicts with Interview 2)
      const conflictStart = new Date(baseEnd.getTime() + 30 * 60 * 1000); // 11:30
      const conflictEnd = new Date(conflictStart.getTime() + 60 * 60 * 1000); // 12:30

      const res = await request(
        'PUT',
        `/api/interviews/${interview1Id}/reschedule`,
        getAuthHeader(recruiter1._id),
        {
          startTime: conflictStart.toISOString(),
          endTime: conflictEnd.toISOString(),
        }
      );

      if (res.statusCode !== 409) {
        throw new Error(`Expected 409 conflict on reschedule, got ${res.statusCode}`);
      }
    });

    // --- TEST 10: Rescheduling to an available slot succeeds without self-conflict ---
    const newFreeStart = new Date(baseStart.getTime() + 86400000); // next day
    const newFreeEnd = new Date(newFreeStart.getTime() + 60 * 60 * 1000);

    await testCase('10. Rescheduling to an available slot succeeds (no self-conflict)', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interview1Id}/reschedule`,
        getAuthHeader(recruiter1._id),
        {
          startTime: newFreeStart.toISOString(),
          endTime: newFreeEnd.toISOString(),
          mode: 'online',
          instructions: 'Updated instructions for technical interview.',
        }
      );

      if (res.statusCode !== 200 || !res.body.success) {
        throw new Error(`Expected 200 reschedule success, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      if (res.body.interview.status !== 'proposed') {
        throw new Error(`Expected status reset to 'proposed', got ${res.body.interview.status}`);
      }
    });

    // --- TEST 11: Cancelled interviews no longer block time slots ---
    let cancelTestInterviewId;
    const cancelStart = new Date(Date.now() + 86400000 * 7);
    const cancelEnd = new Date(cancelStart.getTime() + 60 * 60 * 1000);

    await testCase('11. Cancelled interview frees up time slot for re-booking', async () => {
      // 1. Create interview
      const createRes = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter1._id),
        {
          applicationId: appShortlisted._id,
          startTime: cancelStart.toISOString(),
          endTime: cancelEnd.toISOString(),
          mode: 'online',
        }
      );
      cancelTestInterviewId = createRes.body.interview._id;

      // 2. Cancel it
      const cancelRes = await request(
        'PUT',
        `/api/interviews/${cancelTestInterviewId}/cancel`,
        getAuthHeader(recruiter1._id),
        { cancellationReason: 'Interviewer emergency' }
      );
      if (cancelRes.statusCode !== 200) {
        throw new Error(`Failed to cancel interview: ${cancelRes.statusCode}`);
      }

      // 3. Schedule another interview for student2 in the EXACT same slot
      const rebookRes = await request(
        'POST',
        '/api/interviews',
        getAuthHeader(recruiter1._id),
        {
          applicationId: appShortlisted2._id,
          startTime: cancelStart.toISOString(),
          endTime: cancelEnd.toISOString(),
          mode: 'online',
        }
      );

      if (rebookRes.statusCode !== 201) {
        throw new Error(`Expected 201 rebooking cancelled slot, got ${rebookRes.statusCode}: ${JSON.stringify(rebookRes.body)}`);
      }
    });

    // --- TEST 12: Student confirmation and decline ---
    await testCase('12. Student confirms proposed interview', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interview1Id}/respond`,
        getAuthHeader(student1._id),
        { response: 'confirm' }
      );

      if (res.statusCode !== 200 || res.body.interview.status !== 'confirmed') {
        throw new Error(`Expected status confirmed, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    });

    await testCase('13. Rejection when student responds to already confirmed interview', async () => {
      const res = await request(
        'PUT',
        `/api/interviews/${interview1Id}/respond`,
        getAuthHeader(student1._id),
        { response: 'decline' }
      );

      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 since status is now confirmed, got ${res.statusCode}`);
      }
    });

    // --- TEST 14: Unauthorized interview access prevented ---
    await testCase('14. Unauthorized interview access prevented', async () => {
      // Student 2 tries to view Interview 1 (between Student 1 and Recruiter 1)
      const res = await request(
        'GET',
        `/api/interviews/${interview1Id}`,
        getAuthHeader(student2._id)
      );

      if (res.statusCode !== 403) {
        throw new Error(`Expected 403 forbidden for unrelated student, got ${res.statusCode}`);
      }
    });

    // --- TEST 15: In-app notifications stored and authorization enforced ---
    await testCase('15. In-app notifications created and recipient authorization verified', async () => {
      // Student 1 should have received notifications (proposed, rescheduled)
      const res = await request('GET', '/api/notifications', getAuthHeader(student1._id));
      if (res.statusCode !== 200 || !res.body.notifications || res.body.notifications.length === 0) {
        throw new Error(`Expected notifications for student1, got ${res.statusCode}`);
      }

      const notifId = res.body.notifications[0]._id;

      // Student 2 cannot mark Student 1's notification as read
      const unauthorizedMark = await request(
        'PUT',
        `/api/notifications/${notifId}/read`,
        getAuthHeader(student2._id)
      );
      if (unauthorizedMark.statusCode !== 403) {
        throw new Error(`Expected 403 when marking another user's notification as read, got ${unauthorizedMark.statusCode}`);
      }

      // Student 1 can mark it as read
      const readRes = await request(
        'PUT',
        `/api/notifications/${notifId}/read`,
        getAuthHeader(student1._id)
      );
      if (readRes.statusCode !== 200 || !readRes.body.notification.isRead) {
        throw new Error(`Expected notification marked as read`);
      }
    });

    // Clean up test data
    await User.deleteMany({ _id: { $in: [recruiter1._id, recruiter2._id, student1._id, student2._id] } });
    await Job.deleteMany({ _id: { $in: [job1._id, job2._id] } });
    await Application.deleteMany({ _id: { $in: [appShortlisted._id, appApplied._id, appShortlisted2._id, appShortlistedJob2._id] } });
    await Interview.deleteMany({ recruiterId: { $in: [recruiter1._id, recruiter2._id] } });
    await Notification.deleteMany({ recipient: { $in: [student1._id, student2._id, recruiter1._id, recruiter2._id] } });

  } catch (err) {
    console.error('[Runner Fatal Error]', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n=== Interview Test Suite Summary: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runInterviewTests();
