<div align="center">

# ITAS Taxpayer Education Portal

**A full-stack Learning Management System built for the Ministry of Revenue, Ethiopia**

Built with Spring Boot 3 · Next.js 14 · PostgreSQL · OpenRouter AI

[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.4.3-6DB33F?style=flat&logo=spring)](https://spring.io/projects/spring-boot)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=flat&logo=next.js)](https://nextjs.org)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2018-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org)
[![AI](https://img.shields.io/badge/AI-OpenRouter%20Free-FF6B35?style=flat)](https://openrouter.ai)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Keys Setup](#api-keys-setup)
- [Demo Credentials](#demo-credentials)
- [User Roles](#user-roles)
- [API Reference](#api-reference)
- [AI Features](#ai-features)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

The ITAS Taxpayer Education Portal is a government-grade Learning Management System
that enables the Ministry of Revenue to educate taxpayers, tax agents, and internal
staff about Ethiopian tax law, VAT, income tax, and compliance procedures.

The system supports **8 distinct user roles**, each with a tailored dashboard and
access level. Learners complete structured courses, watch video lessons, read PDF
documents, pass quizzes, and earn verifiable certificates. Administrators manage
content, schedule webinars, send notifications, and view analytics.

### Key Highlights

- **Secure by design** — JWT authentication, role-based edge routing, per-endpoint authorization
- **AI-powered** — Free lesson summaries and semantic course search via OpenRouter
- **Professional certificates** — UUID-based QR verification, iText 7 PDF generation
- **Full learning flow** — Section unlock gates, progress tracking, recommended next lesson
- **Production-ready** — Flyway migrations, email notifications, content versioning

---

## Features

### For Learners (Taxpayer / Tax Agent / MoR Staff)
- 🎬 **Video player** — resume from last position, keyboard shortcuts, autoplay next
- 📄 **PDF viewer** — PDF.js rendering, clickable table of contents, highlight and save
- 📝 **Interactive quizzes** — instant feedback per question, explanations, retry wrong only
- 📊 **Progress tracking** — per-section progress bars, overall completion percentage
- 🔒 **Section gates** — next section unlocks only after completing the previous one and passing its quiz
- 🏆 **Certificates** — downloadable PDF with QR code, publicly verifiable
- ✨ **AI lesson summary** — one-click summary of any lesson (free via OpenRouter)
- 🔍 **AI course search** — semantic search across all lessons (free via OpenRouter)
- 📅 **Webinars** — register for live sessions, receive email confirmations

### For Administrators
- 🛠 **Course builder** — drag-and-drop sections and lectures, rich text editor
- 📋 **Quiz builder** — MCQ and True/False with explanations, configurable pass score
- 🗂 **Content versioning** — full version history, rollback support
- 📣 **Notifications** — campaign-based email delivery to all users or by role
- 📢 **Announcements** — portal-wide announcements
- ❓ **FAQ management** — categorized FAQ system
- 📚 **Help articles** — contextual help tied to specific pages and fields
- 📊 **Analytics** — enrollment stats, quiz scores, certificate counts, activity logs
- 👥 **User management** — create, edit, and manage all user accounts
- 🔄 **Integration sync** — sync logs with external HR and tax record systems
- 📅 **Webinar scheduler** — create and manage webinar sessions with attendees

### For Managers
- 📈 **Analytics dashboard** — KPI cards, activity charts, completion trends
- 📚 **Personal learning** — managers can also enroll in courses and earn certificates

---

## Tech Stack

### Backend (`itas_backend/`)

| Layer | Technology |
|-------|-----------|
| Language | Java 25 |
| Framework | Spring Boot 3.4.3 |
| Security | Spring Security 6.4.3 + JWT (jjwt 0.12.7) |
| Database | PostgreSQL 18 |
| ORM | Hibernate 6.6.8 / Spring Data JPA |
| Migrations | Flyway 10.20.1 |
| PDF | iText 7.2.5 |
| QR Codes | ZXing 3.5.2 |
| Email | Spring Boot Starter Mail (Gmail SMTP) |
| Utilities | Lombok 1.18.38 |
| Build | Maven 3.x |

### Frontend (`frontend/`)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Auth | NextAuth.js 4 |
| HTTP | Axios |
| State | Zustand |
| PDF Rendering | PDF.js (pdfjs-dist) |
| Animations | canvas-confetti |
| Build | npm |

### AI Integration

| Service | Model | Cost |
|---------|-------|------|
| OpenRouter | `meta-llama/llama-3.3-70b-instruct:free` | **Free** |
| OpenRouter | `deepseek/deepseek-r1:free` (fallback) | **Free** |
| OpenRouter | `google/gemma-3-27b-it:free` (fallback) | **Free** |

---

## Repository Structure

```
itas/
├── itas_backend/                    # Spring Boot backend
│   ├── src/main/java/com/aauelknight/itas_backend/
│   │   ├── shared/
│   │   │   ├── config/              # SecurityConfig, CorsConfig, FileStorageConfig
│   │   │   ├── security/            # JwtUtil, JwtAuthFilter, TokenBlacklistService
│   │   │   ├── exception/           # GlobalExceptionHandler
│   │   │   └── storage/             # FileStorageService
│   │   └── modules/
│   │       ├── auth/                # AuthController, User, Role, UserRepository
│   │       ├── courses/             # CourseController, CourseService, SearchService
│   │       ├── learning/            # LmsController, AssessmentService, CertificateService
│   │       ├── notifications/       # NotificationService, EmailService, AnnouncementController
│   │       ├── webinars/            # WebinarController, WebinarService
│   │       └── admin/               # AnalyticsController, UserManagementController
│   ├── src/main/resources/
│   │   ├── db/migration/            # Flyway SQL migrations (V1 - V24)
│   │   └── application.yml          # Application configuration
│   ├── uploads/                     # Uploaded files (videos, PDFs, thumbnails, certificates)
│   └── pom.xml
│
├── frontend/                        # Next.js 14 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (learner)/           # Learner-facing pages
│   │   │   │   ├── dashboard/       # Learner dashboard
│   │   │   │   ├── courses/         # Course catalog + learn pages
│   │   │   │   ├── certificates/    # Certificate list
│   │   │   │   └── webinars/        # Webinar schedule
│   │   │   ├── (admin)/             # Admin pages
│   │   │   │   ├── admin/           # User management, logs, integrations
│   │   │   │   └── dashboard/       # Role-specific admin dashboards
│   │   │   ├── (manager)/           # Manager analytics
│   │   │   ├── api/
│   │   │   │   ├── auth/            # NextAuth routes
│   │   │   │   └── ai/              # OpenRouter proxy routes (summarize, search)
│   │   │   ├── verify/              # Public certificate verification
│   │   │   └── login/               # Login page
│   │   ├── components/
│   │   │   ├── ai/                  # AiSummaryPanel, CourseSearch
│   │   │   ├── admin/               # CourseBuilder, CourseSettingsForm
│   │   │   ├── dashboard/           # Role-specific dashboard components
│   │   │   ├── player/              # VideoPlayer, PdfViewer, QuizPlayer, ArticleReader
│   │   │   ├── quiz/                # QuizPlayer, QuizResult
│   │   │   └── ui/                  # Navbar, Sidebar, Toast, Button, EmptyState
│   │   ├── lib/
│   │   │   ├── api.ts               # All API calls
│   │   │   ├── auth.ts              # NextAuth config
│   │   │   ├── courseCache.ts       # In-memory course cache
│   │   │   ├── openrouter.ts        # OpenRouter client (server-side)
│   │   │   ├── roles.ts             # Role helpers and permission checks
│   │   │   └── types.ts             # TypeScript types
│   │   ├── hooks/                   # usePersistedTab, useScrollMemory
│   │   └── middleware.ts            # Edge-level route guards
│   ├── .env.local                   # Environment variables (not committed)
│   ├── next.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Java 21+** — [Download](https://adoptium.net)
- **Node.js 18+** — [Download](https://nodejs.org)
- **PostgreSQL 15+** — [Download](https://www.postgresql.org/download)
- **Maven 3.8+** — [Download](https://maven.apache.org/download.cgi)
- **Git** — [Download](https://git-scm.com)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/itas-portal.git
cd itas-portal
```

### 2. Set up PostgreSQL

```sql
-- Run in psql or pgAdmin
CREATE DATABASE portal_db;
```

### 3. Configure and start the backend

```bash
cd itas_backend
```

Copy the example config and fill in your values:

```bash
# Edit src/main/resources/application.yml
# Set your PostgreSQL password, Gmail credentials, JWT secret
```

Run the backend:

```bash
./mvnw spring-boot:run
```

Flyway automatically creates all 24 database tables on first startup.
The seeder creates all 8 demo user accounts.

Backend starts at: **http://localhost:8080/api/v1**

### 4. Configure and start the frontend

```bash
cd ../frontend
npm install
```

Create your environment file:

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

Run the frontend:

```bash
npm run dev
```

Frontend starts at: **http://localhost:3000**

### 5. Open the portal

Navigate to **http://localhost:3000** and log in with any demo account.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

```bash
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# NextAuth — must match JWT secret in backend
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-minimum-32-character-secret-key

# OpenRouter AI (free — get key at openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Optional: shown on OpenRouter leaderboard
NEXT_PUBLIC_APP_NAME=ITAS Taxpayer Portal
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (`src/main/resources/application.yml`)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/portal_db
    username: postgres
    password: YOUR_POSTGRES_PASSWORD

  mail:
    username: YOUR_GMAIL@gmail.com
    password: YOUR_GMAIL_APP_PASSWORD  # 16-char app password

app:
  jwt:
    secret: YOUR_JWT_SECRET_MINIMUM_32_CHARS
  frontend-url: http://localhost:3000
```

---

## API Keys Setup

### OpenRouter (AI Features) — Free

The AI features use OpenRouter, which provides access to powerful free LLMs
including Meta Llama 3.3 70B, DeepSeek R1, and Google Gemma 3.

**Steps:**
1. Create a free account at https://openrouter.ai (no credit card needed)
2. Go to https://openrouter.ai/keys → Create Key
3. Copy the key (format: `sk-or-v1-...`)
4. Add to `frontend/.env.local` as `OPENROUTER_API_KEY`

**Rate limits:** 20 requests/minute, 200 requests/day per model.
The app automatically rotates across 3 free models if one is rate-limited.

### Gmail SMTP (Email Notifications)

**Steps:**
1. Enable 2-Step Verification on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for "Mail" → "Other" → name it "ITAS Portal"
4. Copy the 16-character password
5. Add to `application.yml` as the mail password

### JWT Secret

Generate a secure random secret:

```bash
# PowerShell (Windows)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Linux/Mac
openssl rand -base64 32
```

Use the same value for `NEXTAUTH_SECRET` (frontend) and `app.jwt.secret` (backend).

---

## Demo Credentials

**Password for all accounts:** `Password@123`

| Role | Username | Capabilities |
|------|----------|-------------|
| TAXPAYER | `Taxpayer` | Courses, videos only |
| TAX_AGENT | `Taxagent` | Courses, certificates |
| MOR_STAFF | `MoR Staff` | Courses, certificates |
| MANAGER | `Manager` | Analytics, personal learning |
| CONTENT_ADMIN | `Content Admin` | Course builder, quizzes |
| TRAINING_ADMIN | `Training Admin` | Webinar management |
| COMMUNICATION | `Communication Officer` | Notifications, FAQs, announcements |
| WEB_ADMIN | `Web Admin` | Full system administration |

---

## User Roles

```
TAXPAYER
  └── Browse courses, watch videos
  └── No certificates (ineligible by policy)

TAX_AGENT / MOR_STAFF
  └── Full course access
  └── Earn and download certificates
  └── QR-verified PDF certificates

MANAGER
  └── Analytics dashboard
  └── Personal course enrollment
  └── Personal certificates

CONTENT_ADMIN
  └── Create and edit courses
  └── Build quizzes with explanations
  └── Upload videos, PDFs, articles
  └── Content version history

TRAINING_ADMIN
  └── Schedule webinars
  └── Manage attendees
  └── View course enrollments

COMMUNICATION
  └── Send notification campaigns (email)
  └── Post announcements
  └── Manage FAQs
  └── Manage help articles

WEB_ADMIN
  └── Everything above
  └── User management (CRUD)
  └── System activity logs
  └── Integration sync management
  └── Full analytics
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|--------------|-------------|
| POST | `/auth/login` | No | Login, returns JWT |
| POST | `/auth/logout` | Yes | Invalidates token |

### Courses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/courses` | Yes | List all published courses |
| GET | `/courses/{slug}` | Yes | Get course detail |
| GET | `/courses/categories` | Yes | List categories |
| POST | `/courses` | CONTENT_ADMIN | Create course |
| PUT | `/courses/{id}` | CONTENT_ADMIN | Update course |
| PUT | `/courses/{id}/publish` | CONTENT_ADMIN | Publish course |

### Learning (LMS)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/lms/my-courses` | Learner | My enrollments |
| POST | `/lms/enroll/{courseId}` | Learner | Enroll in course |
| POST | `/lms/video/{id}/progress` | Learner | Save video progress |
| GET | `/lms/course/{id}/progress` | Learner | Get full course progress |
| POST | `/lms/lesson/{id}/complete` | Learner | Mark lecture complete |
| POST | `/lms/assessment/submit` | Learner | Submit quiz attempt |
| GET | `/lms/certificate/my` | Learner | My certificates |
| POST | `/lms/certificate/generate` | Learner | Generate certificate |
| GET | `/lms/certificate/{id}/download` | Learner | Download PDF |

### Public

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/verify/{uuid}` | No | Verify certificate by UUID |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/dashboard` | MANAGER+ | Analytics data |
| GET | `/admin/users` | WEB_ADMIN | List all users |
| GET | `/admin/logs` | WEB_ADMIN | Activity logs |
| POST | `/notifications/send` | COMMUNICATION | Send email campaign |
| GET | `/webinars/upcoming` | Yes | Upcoming webinars |

---

## AI Features

### How it works

Both AI features call Next.js API routes (server-side), which call OpenRouter.
The API key **never reaches the browser**.

```
Browser
  │ POST /api/ai/summarize
  ▼
Next.js API Route (server-side)
  │ OPENROUTER_API_KEY (hidden from browser)
  ▼
OpenRouter API
  │ Routes to free LLM
  ▼
Llama 3.3 70B / DeepSeek R1 / Gemma 3
  │ Generated text
  ▼
Next.js API Route
  │ JSON response
  ▼
Browser (renders result)
```

### Model rotation

If the primary model (Llama 3.3 70B) hits its rate limit, the app
automatically tries DeepSeek R1, then Gemma 3, then the OpenRouter
auto-router. This ensures the AI features stay available throughout
a demo session.

### Lesson Summary

- **Trigger:** Click "✨ Generate AI Summary" in the Notes tab
- **Input:** Lesson title, type, description, content preview (2000 chars max)
- **Output:** Structured summary with overview, key points, practical takeaway
- **Latency:** 3-6 seconds on free tier
- **Cost:** $0

### Course Search

- **Trigger:** Click search bar in learn page sidebar, or press Ctrl+K
- **Input:** User query + all lesson titles and descriptions (up to 30 lessons)
- **Output:** Ranked results with relevance level and reason
- **Debounce:** 650ms after last keystroke
- **Cost:** $0

---

## Database Schema

The database uses Flyway migrations (V1 through V24).

Key tables:

```
users           — All user accounts with roles
roles           — Role definitions
courses         — Course metadata
course_sections — Sections within courses
lectures        — Individual lessons
assessments     — Quiz definitions
assessment_questions — Quiz questions with explanations
assessment_attempts  — User quiz attempts and scores
course_enrollments   — User-course enrollment records
video_progress       — Video watch position per user
lecture_completions  — Completed lesson tracking
certificates         — Issued certificates with UUID
notification_campaigns — Sent notification campaigns
announcements        — Portal announcements
faqs                 — FAQ entries
help_articles        — Contextual help content
webinars             — Webinar sessions
webinar_registrations — User webinar signups
user_activity_logs   — System audit trail
integration_sync_logs — External system sync records
content_versions     — Course content version history
```

To view the full schema, see `itas_backend/src/main/resources/db/migration/`.

---

## Screenshots

> Add screenshots of your running application here.

```
docs/screenshots/
├── login.png
├── learner-dashboard.png
├── course-catalog.png
├── video-player.png
├── pdf-viewer.png
├── quiz-player.png
├── quiz-result.png
├── certificate.png
├── verify-page.png
├── ai-summary.png
├── ai-search.png
├── course-builder.png
├── admin-dashboard.png
└── analytics.png
```

---

## Deployment

### Backend (production)

```bash
cd itas_backend
./mvnw clean package -DskipTests
java -jar target/itas_backend-0.0.1-SNAPSHOT.jar
```

Set production environment variables:
```bash
DATABASE_URL=jdbc:postgresql://your-db-host:5432/portal_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=strong-password
JWT_SECRET=strong-32-char-secret
GMAIL_USERNAME=notifications@yourdomain.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
FRONTEND_URL=https://your-frontend-domain.com
EMAIL_ENABLED=true
```

### Frontend (production)

```bash
cd frontend
npm run build
npm start
```

Set production environment variables:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=same-as-backend-jwt-secret
OPENROUTER_API_KEY=sk-or-v1-your-key
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

### Recommended hosting

| Service | Tier | Cost |
|---------|------|------|
| **Railway** | Starter | ~$5/month (backend + DB) |
| **Vercel** | Hobby | Free (frontend) |
| **Render** | Free | Free (backend, sleeps after 15min) |
| **Supabase** | Free | Free (PostgreSQL) |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit: `git commit -m 'Add your feature'`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

### Code style

- Backend: follow Spring Boot conventions, use Lombok
- Frontend: use TypeScript strictly, follow existing component patterns
- Database: all schema changes must be Flyway migrations
- AI: all AI calls must go through server-side API routes (never expose key to browser)

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built for the Ministry of Revenue, Federal Democratic Republic of Ethiopia

**ITAS Taxpayer Education Portal** · Spring Boot + Next.js + OpenRouter AI

</div>
