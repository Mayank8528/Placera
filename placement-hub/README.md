# PlacementHub — College Placement Management Platform (V1)

PlacementHub is a clean, modular full-stack MERN (MongoDB, Express.js, React, Node.js) web application designed for colleges and universities to manage on-campus placement drives, job applications, student profiles, and recruiter workflows.

---

## 📁 Project Architecture & Structure

```text
placement-hub/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── server.js                  # Express application entry point
│   ├── config/
│   │   └── db.js                  # Mongoose MongoDB connection
│   ├── models/
│   │   ├── User.js                # Auth & Roles (student, recruiter, admin)
│   │   ├── StudentProfile.js      # Student academic details & skills
│   │   ├── Job.js                 # Campus drives / Job listings
│   │   └── Application.js         # Student job applications (unique compound index)
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, Me endpoints
│   │   ├── studentController.js   # Student profile view/update
│   │   ├── jobController.js       # Job CRUD & recruiter ownership
│   │   ├── applicationController.js# Job applications & status management
│   │   └── adminController.js     # User audits & content moderation
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification & role authorization
│   │   └── errorMiddleware.js     # Centralized error & Mongoose handler
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── applicationRoutes.js
│   │   └── adminRoutes.js
│   └── scripts/
│       └── seedAdmin.js           # Safe, controlled dev-only admin bootstrapper
└── frontend/
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx               # React entry point
        ├── App.jsx                # Router & role-protected route tree
        ├── index.css              # Custom CSS design system
        ├── context/
        │   └── AuthContext.jsx    # Authentication state & JWT handling
        ├── services/
        │   └── api.js             # Axios instance with Bearer interceptor
        ├── components/
        │   ├── Navbar.jsx         # Responsive navigation bar
        │   ├── ProtectedRoute.jsx # Role-based route guard
        │   ├── JobCard.jsx        # Reusable job card
        │   └── StatusBadge.jsx    # Application status pill
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── JobList.jsx        # Public/student browse with keyword search
            ├── JobDetails.jsx     # Position details & single-click apply
            ├── StudentDashboard.jsx
            ├── StudentApplications.jsx
            ├── StudentProfile.jsx # Edit academic profile & skills
            ├── RecruiterDashboard.jsx
            ├── RecruiterJobs.jsx  # Recruiter job management (edit/delete)
            ├── CreateEditJob.jsx  # Post or update job drive
            ├── JobApplicants.jsx  # Review applicants & update status
            └── AdminDashboard.jsx # Admin user list & moderation
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (JavaScript), Vite, React Router v7, Axios, Plain CSS Design System, React Context API.
- **Backend**: Node.js, Express.js, MongoDB with Mongoose, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `dotenv`, `cors`.

---

## 🔐 Authentication, Roles & Security Note

### 1. User Roles
- **student**: Can browse jobs, apply once per job, track their own applications, and maintain their student academic profile.
- **recruiter**: Can create and manage their own job postings, view candidates who applied to their jobs, and update application stages.
- **admin**: Can view all registered users and moderate/remove inappropriate job listings.

> **Security Rule**: The public registration endpoint (`/api/auth/register`) strictly allows registering as `student` or `recruiter`. The `admin` role can NEVER be created through public registration.

### 2. JWT Storage Educational Note
In this Version 1 educational build, the JWT is stored in the browser's `localStorage` and sent with requests via the `Authorization: Bearer <token>` header. 
- **Risk**: Storing JWTs in `localStorage` makes them susceptible to **Cross-Site Scripting (XSS)** attacks if third-party scripts or untrusted HTML are executed.
- **Production Recommendation**: In production systems, authentication tokens should preferably be issued as **`HttpOnly`, `Secure`, `SameSite` cookies** to prevent JavaScript from accessing them directly.

---

## 🚀 Setup & Installation Instructions

### Prerequisites
1. **Node.js** (v18+ recommended)
2. **MongoDB**:
   - **Option A (Local)**: Local MongoDB community server running on `mongodb://localhost:27017`
   - **Option B (Cloud)**: Free MongoDB Atlas cluster URI (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/placementhub?retryWrites=true&w=majority`)

---

### Step 1: Backend Setup

1. Open your terminal in the backend directory:
   ```bash
   cd placement-hub/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and verify/update:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/placementhub?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development

   # Cloudinary configuration (for student PDF resume uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Bootstrap the Admin Account**:
   Run the safe seed script:
   ```bash
   npm run seed:admin
   ```
   *Default dev credentials created:*
   - **Email**: `admin@placementhub.edu`
   - **Password**: `AdminPass123!`

5. Start the backend server:
   ```bash
   npm run dev
   # Server starts at http://localhost:5000
   ```

---

### Step 2: Frontend Setup

1. Open a new terminal in the frontend directory:
   ```bash
   cd placement-hub/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Verify `VITE_API_URL=http://localhost:5000/api`.

4. Start the Vite development server:
   ```bash
   npm run dev
   # App runs at http://localhost:5173
   ```

---

## 📡 REST API Documentation

### Auth Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register as `student` or `recruiter` |
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `GET` | `/api/auth/me` | Private | Retrieve current user profile |

### Student Profile Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/students/profile` | Private (Student) | Get current student profile |
| `PUT` | `/api/students/profile` | Private (Student) | Update academic details & skills |

### Job Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/jobs` | Public | List all active campus job drives |
| `GET` | `/api/jobs/:id` | Public | Get single job details |
| `GET` | `/api/jobs/recruiter/my`| Private (Recruiter) | List jobs posted by logged-in recruiter |
| `POST` | `/api/jobs` | Private (Recruiter) | Create a new job posting |
| `PUT` | `/api/jobs/:id` | Private (Recruiter) | Update own job posting |
| `DELETE` | `/api/jobs/:id` | Private (Recruiter) | Delete own job posting |

### Application Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/applications` | Private (Student) | Apply to a job (enforces duplicate check) |
| `GET` | `/api/applications/my` | Private (Student) | Get applications for logged-in student |
| `GET` | `/api/applications/job/:jobId` | Private (Recruiter) | View applicants for recruiter's job |
| `PUT` | `/api/applications/:id/status` | Private (Recruiter) | Update status (`Applied`, `Shortlisted`, `Selected`, `Rejected`) |

### Admin Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | Private (Admin) | View all registered users |
| `GET` | `/api/admin/jobs` | Private (Admin) | View all job drives |
| `DELETE` | `/api/admin/jobs/:id` | Private (Admin) | Remove inappropriate job drives |

---

## 🧪 Manual Verification & Testing Checklist

Use this checklist to test the application once your MongoDB instance is running:

1. **Authentication**:
   - [ ] Register a student (`alice@college.edu`). Ensure role cannot be forged to `admin`.
   - [ ] Register a recruiter (`hr@techcorp.com`).
   - [ ] Attempt registration with duplicate email `alice@college.edu`; verify 400 error.
   - [ ] Test login with wrong password; verify descriptive error without leaking hash.
   - [ ] Login as `admin@placementhub.edu` (seeded credentials); verify redirection to `/admin/dashboard`.
2. **Student Workflows**:
   - [ ] Navigate to "My Profile" and save College, Branch, Graduation Year, and Skills.
   - [ ] Browse jobs and apply to an active job.
   - [ ] Attempt to apply to the same job a second time; verify backend rejects with 400 "already applied".
   - [ ] View "My Applications" and check status badge ("Applied").
3. **Recruiter Workflows**:
   - [ ] Login as recruiter and post a new job drive.
   - [ ] Edit job description or deadline.
   - [ ] Open "View Applicants" for the job; check that student academic details and skills appear.
   - [ ] Update candidate status to "Shortlisted", then "Selected"; verify status updates in real-time.
   - [ ] Log in as a different recruiter and attempt to edit/delete the first recruiter's job via direct API or URL; verify 403 Forbidden.
4. **Admin Workflows**:
   - [ ] Navigate to `/admin/dashboard`.
   - [ ] Review registered user list.
   - [ ] Moderate and remove a job listing; confirm associated applications are cleaned up.
