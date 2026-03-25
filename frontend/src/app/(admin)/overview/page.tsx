"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Wrench, 
  CircleDashed,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowDown
} from "lucide-react";

type RoleCardProps = {
  role: string;
  access: string;
  type: "learner" | "admin";
};

function RoleCard({ role, access, type }: RoleCardProps) {
  return (
    <div className={`p-4 rounded-lg bg-white shadow-sm border-l-4 ${type === "learner" ? "border-l-[#1e40af]" : "border-l-purple-600"}`}>
      <h4 className="font-bold text-slate-800">{role}</h4>
      <p className="text-sm text-slate-600 mt-1">{access}</p>
    </div>
  );
}

type FlowBoxProps = {
  text: string;
  isLast?: boolean;
};

function FlowBox({ text, isLast }: FlowBoxProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="border border-slate-300 bg-white rounded shadow-sm px-4 py-3 text-sm font-medium text-slate-800 text-center w-64">
        {text}
      </div>
      {!isLast && (
        <ArrowDown className="text-slate-400 my-2 h-5 w-5" />
      )}
    </div>
  );
}

type StepProp = {
  num: string;
  title: string;
  status: "COMPLETE" | "IN_PROGRESS" | "TODO";
  bullets: string[];
};

function StepToggle({ step }: { step: StepProp }) {
  const [isOpen, setIsOpen] = useState(false);

  let BadgeIcon = CircleDashed;
  let badgeColor = "bg-slate-100 text-[#64748b] border-slate-200";
  let label = "TODO";

  if (step.status === "COMPLETE") {
    BadgeIcon = CheckCircle2;
    badgeColor = "bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20";
    label = "COMPLETE";
  } else if (step.status === "IN_PROGRESS") {
    BadgeIcon = Wrench;
    badgeColor = "bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20";
    label = "IN PROGRESS";
  }

  return (
    <div className="relative pl-8 pb-8">
      {/* Vertical line */ }
      <div className="absolute top-0 left-3 bottom-0 w-px bg-slate-200" />
      
      {/* Dot */ }
      <div className={`absolute top-1 left-[7px] w-[11px] h-[11px] rounded-full ring-4 ring-white ${step.status === "COMPLETE" ? "bg-[#16a34a]" : step.status === "IN_PROGRESS" ? "bg-[#d97706]" : "bg-slate-300"}`} />
      
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all hover:border-slate-300">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="font-semibold text-slate-900">STEP {step.num} — {step.title}</span>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor} w-max`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {label}
            </div>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        
        {isOpen && (
          <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50 pt-3">
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
              {step.bullets.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectOverviewPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "flows" | "steps" | "bugs">("steps");

  const stepsData: StepProp[] = [
    {
      num: "1",
      title: "Authentication",
      status: "COMPLETE",
      bullets: [
        "JWT login/logout",
        "NextAuth session management",
        "Protected routes by role",
        "Role-based navbar",
        "Demo users seeded in DB for all 8 roles"
      ]
    },
    {
      num: "2",
      title: "Course Catalog",
      status: "COMPLETE",
      bullets: [
        "Browse all published courses",
        "Filter by category",
        "CourseCard component",
        "Course detail page with sections preview"
      ]
    },
    {
      num: "3",
      title: "Enrollment + Video Player",
      status: "COMPLETE",
      bullets: [
        "Enroll in course button",
        "My Courses dashboard",
        "Video.js HLS/MP4 player",
        "15-second heartbeat progress tracking",
        "Resume playback from last position",
        "Auto-complete lecture at 90% watched"
      ]
    },
    {
      num: "4",
      title: "Quiz + Certificates",
      status: "COMPLETE",
      bullets: [
        "Quiz modal with MCQ and True/False",
        "Auto-grading (pass ≥ 70%)",
        "Certificate PDF generation (iText7)",
        "QR code on certificate (ZXing)",
        "Public verification page at /verify/[code]",
        "Certificate code format: MOR-2026-XXXXXX"
      ]
    },
    {
      num: "4.5",
      title: "Course Builder (Admin)",
      status: "COMPLETE",
      bullets: [
        "3-step wizard:",
        "  Step 1: Basic Info (title, category, description, difficulty, target audience)",
        "  Step 2: Builder (sections + lectures tree, lecture editor, file upload)",
        "  Step 3: Review & Publish",
        "Video and PDF upload per lecture",
        "Save as Draft or Publish"
      ]
    },
    {
      num: "5",
      title: "Webinars + Notifications",
      status: "TODO",
      bullets: [
        "Webinar scheduling by Training Admin",
        "Webinar registration by learners",
        "Attendee list view",
        "Notification campaigns (Communication Officer)",
        "Send notifications by role or individual",
        "In-app notification bell with unread count",
        "Email notification support (optional)"
      ]
    },
    {
      num: "6",
      title: "Manager Analytics Dashboard",
      status: "TODO",
      bullets: [
        "KPI cards: Total Registered Users, Active Learners, Courses Completed, Certificates Issued",
        "Course metrics: Total Enrollments, Completion Rate, Avg Score, Popular Courses (bar chart)",
        "Content metrics: Video Views, Resource Downloads, Avg Watch Time",
        "Charts using Recharts",
        "Export data to CSV and XLSX"
      ]
    },
    {
      num: "7",
      title: "Admin Panel",
      status: "TODO",
      bullets: [
        "User management: view all users, assign/change roles",
        "Archive or unpublish courses",
        "Content versioning: upload new version of an existing video or PDF",
        "View all certificates issued",
        "Audit log of admin actions"
      ]
    },
    {
      num: "8",
      title: "Search + Content Library",
      status: "TODO",
      bullets: [
        "Full-text search across courses and resources",
        "Filter by: category, type (video/PDF/article), difficulty level, target audience",
        "Resource download tracking",
        "Content library page for standalone PDFs and articles (not inside a course)"
      ]
    },
    {
      num: "9",
      title: "Help System",
      status: "TODO",
      bullets: [
        "Contextual help tooltips per form field",
        "Help articles linked to specific pages",
        "Help sidebar panel",
        "Admin can create/edit help articles"
      ]
    },
    {
      num: "10",
      title: "Integration + Final Polish",
      status: "TODO",
      bullets: [
        "Integration sync logs (external system sync)",
        "Mobile responsiveness polish",
        "SSO integration (if required)",
        "Performance: lazy loading, pagination",
        "Accessibility improvements (ARIA labels)",
        "Final QA and bug fixes"
      ]
    }
  ];

  const userFlow = [
    "Login",
    "Browse Course Catalog",
    "Enroll in a Course",
    "Watch Video Lectures (progress tracked every 15s)",
    "Complete All Lectures (auto-complete at 90% watched)",
    "Take End-of-Course Quiz (pass ≥ 70%)",
    "Course Marked as Completed",
    "Certificate Generated (PDF + QR Code)",
    "Manager Analytics Dashboard Updated"
  ];

  const adminFlow = [
    "Login as Content Admin",
    "Create Course (Basic Info: title, category, description, difficulty, target audience)",
    "Add Sections (chapters)",
    "Add Lectures to each Section (Video / PDF / Text / Quiz types)",
    "Upload Video or PDF file per lecture",
    "Add Quiz questions (MCQ / True-False)",
    "Review & Publish Course",
    "Course appears in Catalog for enrolled roles"
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Header */ }
      <div className="bg-[#1e40af] text-white py-12 px-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800 text-blue-100 text-xs font-semibold mb-4 border border-blue-700">
            Internal Wiki
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Taxpayer Education Portal LMS</h1>
          <p className="mt-3 text-blue-100 text-lg max-w-2xl font-medium">
            Project Overview, Development Progress, and Architecture Reference (v1.0-alpha)
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Navigation Tabs */ }
        <div className="flex overflow-x-auto border-b border-slate-200 mb-8 hide-scrollbar">
          {(["steps", "flows", "roles", "bugs"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab 
                  ? "border-[#1e40af] text-[#1e40af]" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab === "steps" && "Development Timeline"}
              {tab === "flows" && "System Flows"}
              {tab === "roles" && "Roles & Access"}
              {tab === "bugs" && "Known Bugs"}
            </button>
          ))}
        </div>

        {/* Tab Content */ }
        <div className="pb-24">
          
          {/* TIMELINE TAB */ }
          {activeTab === "steps" && (
            <div className="max-w-3xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Development Steps</h2>
                <p className="text-slate-600">Track exactly what is done, what is being built, and what remains.</p>
              </div>
              
              <div className="mt-6">
                {stepsData.map((step, idx) => (
                  <StepToggle key={idx} step={step} />
                ))}
              </div>
            </div>
          )}

          {/* FLOWS TAB */ }
          {activeTab === "flows" && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Platform Workflows</h2>
                <p className="text-slate-600">Visual pathways for core user journeys.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-[#1e40af] mb-8 text-center uppercase tracking-wider">User Learning Flow</h3>
                  <div className="flex flex-col items-center">
                    {userFlow.map((text, idx) => (
                      <FlowBox key={idx} text={text} isLast={idx === userFlow.length - 1} />
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-purple-700 mb-8 text-center uppercase tracking-wider">Admin Content Flow</h3>
                  <div className="flex flex-col items-center">
                    {adminFlow.map((text, idx) => (
                      <FlowBox key={idx} text={text} isLast={idx === adminFlow.length - 1} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROLES TAB */ }
          {activeTab === "roles" && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Roles & Capabilities</h2>
                <p className="text-slate-600">The platform distinguishes between learner experiences, content administration, and system management.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#1e40af] mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#1e40af]" /> Learner Roles
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <RoleCard role="TAXPAYER" access="Browse courses, watch videos. No certificate." type="learner" />
                  <RoleCard role="TAX_AGENT" access="Browse, watch, earn certificates." type="learner" />
                  <RoleCard role="MOR_STAFF" access="Same as Tax Agent." type="learner" />
                  <RoleCard role="MANAGER" access="All learner access + Analytics Dashboard." type="learner" />
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600" /> Admin Roles
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <RoleCard role="CONTENT_ADMIN" access="Upload courses, videos, PDFs. No course access." type="admin" />
                  <RoleCard role="TRAINING_ADMIN" access="Manage courses and users. No course access." type="admin" />
                  <RoleCard role="COMMUNICATION" access="Send notifications and campaigns." type="admin" />
                  <RoleCard role="WEB_ADMIN" access="Full platform administration." type="admin" />
                </div>
              </div>
            </div>
          )}

          {/* BUGS TAB */ }
          {activeTab === "bugs" && (
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                  Current Bugs in Fix
                  <span className="bg-red-100 text-[#dc2626] text-sm px-2.5 py-0.5 rounded-full border border-red-200 font-semibold">
                    6 Active
                  </span>
                </h2>
                <p className="text-slate-600">Prioritized list of known issues being worked on by the development team.</p>
              </div>

              <div className="grid gap-4">
                {[
                  "LazyInitializationException on CourseSection in VideoProgressService — fix in progress",
                  "Video MIME type mismatch — MP4 files being treated as HLS (m3u8) by VideoJS — fix in progress",
                  "Upload URL incorrectly prefixed with /api/v1/ — static files should not go through API path",
                  "403 on /courses/categories and video upload endpoint — SecurityConfig needs updating",
                  "Target audience checkboxes not responding to click in Course Builder Step 1",
                  "course-progress endpoint 500 error — missing courseId parameter"
                ].map((bug, idx) => (
                  <div key={idx} className="flex gap-4 p-5 rounded-xl bg-[#fffbeb] border border-[#fde68a] shadow-sm">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-6 h-6 text-[#d97706]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900">Issue #{idx + 1}</h4>
                      <p className="text-amber-800 mt-1 leading-snug">{bug}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
