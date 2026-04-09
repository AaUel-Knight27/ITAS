# ITAS Tax & Education Support System

**A modern microservices-based platform for taxpayer education and tax compliance management**

![Project Banner](https://via.placeholder.com/1200x300/0A2540/FFFFFF?text=ITAS+Tax+%26+Education+Support+System)  
*(Replace with actual banner once available)*

The **ITAS Tax & Education Support System** is a complete web application developed for the Inland Tax Authority Services (ITAS). It enables efficient management of taxpayer information, delivery of educational resources, tracking of learning programs, and monitoring of compliance awareness.

Built strictly following the **Software Development Life Cycle (SDLC)** as part of an individual technical assignment, the system implements all core use cases defined in the requirements document, including authentication, content management, learning management, taxpayer portal features, and administrative tools.

### Tech Stack
- **Backend**: Spring Boot 3.x (Microservices Architecture with Spring Cloud)
- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Database**: PostgreSQL 16
- **Authentication**: Spring Security + JWT (SSO simulation for demo)
- **Other**: Spring Data JPA, Flyway migrations, RESTful APIs, React Query (frontend), Docker support

---

## ✨ Features

### Authentication
- Single Sign-On (SSO) login simulation using ITAS credentials
- Role-based access control (Taxpayer, Content Admin, Training Admin, Comm Officer, Manager, System Admin)

### Content Management
- Upload and manage educational resources (PDF, MP4, PNG, JPG — max 100MB)
- Version control for resources
- Advanced search with filters (type, category, difficulty)

### Learning Management System (LMS)
- Browse and enroll in training courses
- Complete modules with built-in assessments (≥70% passing score)
- Real-time progress tracking
- Automatic PDF certificate generation upon course completion

### Taxpayer Portal
- Context-sensitive help for tax forms (tooltips + detailed panels)
- Watch video tutorials with progress tracking
- Download resource guides

### Administration & Analytics
- Schedule live webinars
- Send targeted notifications (email/SMS simulation)
- Comprehensive analytics dashboard (completion rates, popular resources, trends)
- User role management

### Additional Capabilities
- Training record synchronization
- Automated archiving of old content
- Responsive design for desktop & mobile

