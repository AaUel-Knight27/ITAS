"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "en" | "am";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isAmharic: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  "common.loading": { en: "Loading...", am: "በመጫን ላይ..." },
  "common.not_available": { en: "N/A", am: "አይገኝም" },
  "common.all": { en: "All", am: "ሁሉም" },
  "nav.home": { en: "Home", am: "መነሻ" },
  "nav.dashboard": { en: "Dashboard", am: "ዳሽቦርድ" },
  "nav.courses": { en: "Courses", am: "ኮርሶች" },
  "nav.certificates": { en: "Certificates", am: "የምስክር ወረቀቶች" },
  "nav.webinars": { en: "Webinars", am: "ዌቢናሮች" },
  "nav.my_learning": { en: "My Learning", am: "ትምህርቴ" },
  "nav.analytics": { en: "Analytics", am: "ትንታኔዎች" },
  "auth.sign_out": { en: "Sign Out", am: "ውጣ" },
  "auth.username_required": { en: "Username is required.", am: "የተጠቃሚ ስም ያስፈልጋል።" },
  "auth.password_required": { en: "Password is required.", am: "የይለፍ ቃል ያስፈልጋል።" },
  "auth.invalid_credentials": { en: "Invalid username or password.", am: "የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም።" },
  "auth.checking": { en: "Checking authentication...", am: "ማረጋገጫ በመፈተሽ ላይ..." },
  "auth.welcome_back": { en: "Welcome back", am: "እንኳን ደህና መጡ" },
  "auth.sign_in_continue": { en: "Sign in to your account to continue learning", am: "መማርዎን ለመቀጠል ወደ መለያዎ ይግቡ" },
  "auth.username": { en: "Username", am: "የተጠቃሚ ስም" },
  "auth.password": { en: "Password", am: "የይለፍ ቃል" },
  "auth.enter_username": { en: "Enter your username", am: "የተጠቃሚ ስምዎን ያስገቡ" },
  "auth.enter_password": { en: "Enter your password", am: "የይለፍ ቃልዎን ያስገቡ" },
  "auth.hide_password": { en: "Hide password", am: "የይለፍ ቃል ደብቅ" },
  "auth.show_password": { en: "Show password", am: "የይለፍ ቃል አሳይ" },
  "auth.sign_in": { en: "Sign in", am: "ግባ" },
  "auth.signing_in": { en: "Signing in...", am: "በመግባት ላይ..." },
  "auth.need_help": { en: "Need help?", am: "እርዳታ ይፈልጋሉ?" },
  "auth.contact_admin": {
    en: "Contact your administrator if you need assistance with your account.",
    am: "በመለያዎ ላይ እርዳታ ካስፈለገዎ አስተዳዳሪዎን ያግኙ።",
  },
  "auth.hero_title": {
    en: "Empowering taxpayers through education and knowledge.",
    am: "ግብር ከፋዮችን በትምህርትና በእውቀት ማበረታታት።",
  },
  "auth.hero_description": {
    en: "Access courses, webinars, and resources designed to help you understand tax obligations and compliance.",
    am: "የግብር ግዴታዎችን እና ተገዢነትን እንዲገነዘቡ የተዘጋጁ ኮርሶችን፣ ዌቢናሮችን እና ሀብቶችን ይድረሱ።",
  },
  "auth.learning_resources": { en: "Learning Resources", am: "የትምህርት ሀብቶች" },
  "auth.active_learners": { en: "Active Learners", am: "ንቁ ተማሪዎች" },
  "auth.satisfaction_rate": { en: "Satisfaction Rate", am: "የእርካታ መጠን" },
  "auth.ministry_division": { en: "Ministry of Revenue - Education Division", am: "የገቢዎች ሚኒስቴር - የትምህርት ክፍል" },
  "menu.my_learning": { en: "My Learning", am: "ትምህርቴ" },
  "menu.certificates": { en: "Certificates", am: "የምስክር ወረቀቶች" },
  "menu.preferences": { en: "Preferences", am: "ምርጫዎች" },
  "menu.language": { en: "Language", am: "ቋንቋ" },
  "menu.theme": { en: "Theme", am: "ገጽታ" },
  "dashboard.title": { en: "Learning Dashboard", am: "የትምህርት ዳሽቦርድ" },
  "dashboard.subtitle": {
    en: "Track your progress and continue your learning journey.",
    am: "እድገትዎን ይከታተሉ እና የትምህርት ጉዞዎን ይቀጥሉ።",
  },
  "dashboard.total_enrollments": { en: "Total Enrollments", am: "ጠቅላላ ምዝገባዎች" },
  "dashboard.in_progress": { en: "In Progress", am: "በሂደት ላይ" },
  "dashboard.completed": { en: "Completed", am: "ተጠናቋል" },
  "dashboard.browse_courses": { en: "Browse Courses", am: "ኮርሶችን ይፈልጉ" },
  "dashboard.your_courses": { en: "Your Courses", am: "ኮርሶችዎ" },
  "dashboard.enrolled": { en: "enrolled", am: "ተመዝግቧል" },
  "dashboard.no_enrollments": { en: "No enrollments yet", am: "ምዝገባ የለም" },
  "dashboard.explore_courses": { en: "Explore Courses", am: "ኮርሶችን አስሱ" },
  "dashboard.continue": { en: "Continue", am: "ቀጥል" },
  "dashboard.start": { en: "Start", am: "ጀምር" },
  "dashboard.my_certificates": { en: "My Certificates", am: "የምስክር ወረቀቶቼ" },
  "dashboard.certificates_earned": { en: "certificate", am: "የምስክር ወረቀት" },
  "dashboard.certificates_earned_plural": { en: "certificates", am: "የምስክር ወረቀቶች" },
  "dashboard.view_all": { en: "View All", am: "ሁሉንም ይመልከቱ" },
  "dashboard.certificates_placeholder_title": { en: "Certificates", am: "የምስክር ወረቀቶች" },
  "dashboard.certificates_placeholder_desc": {
    en: "Certificates will appear here once available.",
    am: "አንዴ ሲገኙ የምስክር ወረቀቶች እዚህ ይታያሉ።",
  },
  "certs.title": { en: "My Certificates", am: "የምስክር ወረቀቶቼ" },
  "certs.subtitle": {
    en: "Download or share your earned certificates",
    am: "ያገኙዋቸውን የምስክር ወረቀቶች ያውርዱ ወይም ያጋሩ",
  },
  "certs.none_title": { en: "No certificates yet", am: "ምንም የምስክር ወረቀት የለም" },
  "certs.none_desc": {
    en: "Complete a course and pass the quiz to earn your certificate",
    am: "ኮርስ ጨርሰው ፈተናውን ያልፉ እና የምስክር ወረቀትዎን ያግኙ",
  },
  "certs.issued": { en: "Issued", am: "የተሰጠበት" },
  "certs.download": { en: "Download", am: "አውርድ" },
  "certs.share": { en: "Link", am: "አገናኝ" },
  "certs.verify": { en: "Verify", am: "አረጋግጥ" },
  "theme.dark": { en: "Dark mode", am: "ጨለማ ሁነት" },
  "theme.light": { en: "Light mode", am: "ብሩህ ሁነት" },
  "language.switch_to_english": { en: "Switch to English", am: "ወደ እንግሊዝኛ ቀይር" },
  "language.switch_to_amharic": { en: "Switch to Amharic", am: "ወደ አማርኛ ቀይር" },
  "courses.sign_in_required": { en: "Sign in required", am: "መግባት ያስፈልጋል" },
  "courses.sign_in_prompt": { en: "Please sign in to browse courses.", am: "ኮርሶችን ለማየት እባክዎ ይግቡ።" },
  "courses.catalog_title": { en: "Course Catalog", am: "የኮርስ ዝርዝር" },
  "courses.catalog_subtitle": {
    en: "Browse available learning content and start your educational journey.",
    am: "የሚገኙ የትምህርት ይዘቶችን ይመልከቱ እና የትምህርት ጉዞዎን ይጀምሩ።",
  },
  "courses.search_placeholder": { en: "Search courses...", am: "ኮርሶችን ይፈልጉ..." },
  "courses.all_categories": { en: "All categories", am: "ሁሉም ምድቦች" },
  "courses.no_courses_found": { en: "No courses found", am: "ምንም ኮርስ አልተገኘም" },
  "courses.adjust_filters": { en: "Try adjusting your search or filters.", am: "ፍለጋዎን ወይም ማጣሪያዎን ለማስተካከል ይሞክሩ።" },
  "courses.clear_filters": { en: "Clear Filters", am: "ማጣሪያዎችን አጥፋ" },
  "courses.none_selected_category": { en: "No courses found for the selected category.", am: "ለተመረጠው ምድብ ምንም ኮርስ አልተገኘም።" },
  "courses.check_back_later": { en: "Check back later for new courses.", am: "አዳዲስ ኮርሶችን ለማየት በኋላ ይመለሱ።" },
  "courses.found_count": { en: "courses found", am: "ኮርሶች ተገኝተዋል" },
  "courses.found_count_single": { en: "course found", am: "ኮርስ ተገኝቷል" },
  "courses.uncategorized": { en: "Uncategorized", am: "ያልተመደበ" },
  "courses.duration_min": { en: "min", am: "ደቂቃ" },
  "courses.beginner": { en: "Beginner", am: "ጀማሪ" },
  "courses.intermediate": { en: "Intermediate", am: "መካከለኛ" },
  "courses.advanced": { en: "Advanced", am: "ከፍተኛ" },
  "sidebar.main": { en: "Main", am: "ዋና" },
  "sidebar.learning": { en: "Learning", am: "ትምህርት" },
  "sidebar.content_management": { en: "Content Management", am: "የይዘት አስተዳደር" },
  "sidebar.training": { en: "Training", am: "ስልጠና" },
  "sidebar.communications": { en: "Communications", am: "ግንኙነቶች" },
  "sidebar.system_admin": { en: "System Admin", am: "የስርዓት አስተዳደር" },
  "sidebar.team_management": { en: "Team Management", am: "የቡድን አስተዳደር" },
  "sidebar.course_catalog": { en: "Course Catalog", am: "የኮርስ ዝርዝር" },
  "sidebar.manage_courses": { en: "Manage Courses", am: "ኮርሶችን አስተዳድር" },
  "sidebar.create_course": { en: "Create Course", am: "ኮርስ ፍጠር" },
  "sidebar.webinar_scheduler": { en: "Webinar Scheduler", am: "የዌቢናር መርሃ ግብር" },
  "sidebar.notifications": { en: "Notifications", am: "ማሳወቂያዎች" },
  "sidebar.faq_management": { en: "FAQ Management", am: "የFAQ አስተዳደር" },
  "sidebar.support_responses": { en: "Support Responses", am: "የድጋፍ ምላሾች" },
  "sidebar.platform_controls": { en: "Platform Controls", am: "የመድረክ መቆጣጠሪያዎች" },
  "sidebar.user_analytics": { en: "User Analytics", am: "የተጠቃሚ ትንታኔ" },
  "sidebar.team_analytics": { en: "Team Analytics", am: "የቡድን ትንታኔ" },
  "sidebar.team_members": { en: "Team Members", am: "የቡድን አባላት" },
  "sidebar.education_portal": { en: "Education Portal", am: "የትምህርት ፖርታል" },
  "sidebar.logout": { en: "Logout", am: "ውጣ" },
  "sidebar.expand": { en: "Expand", am: "አስፋ" },
  "sidebar.collapse": { en: "Collapse", am: "ሰብስብ" },
  "not_found.title": { en: "Page Not Found", am: "ገጹ አልተገኘም" },
  "not_found.description": {
    en: "The page you are looking for does not exist or has been moved.",
    am: "እየፈለጉት ያለው ገጽ የለም ወይም ተንቀሳቅሷል።",
  },
  "not_found.go_dashboard": { en: "Go to Dashboard", am: "ወደ ዳሽቦርድ ሂድ" },
  "verify.title": { en: "Certificate Verification", am: "የምስክር ወረቀት ማረጋገጫ" },
  "verify.portal": { en: "Ministry of Revenue - Taxpayer Education Portal", am: "የገቢዎች ሚኒስቴር - የግብር ከፋይ ትምህርት ፖርታል" },
  "verify.verified": { en: "Verified", am: "ተረጋግጧል" },
  "verify.verified_desc": { en: "This certificate is authentic", am: "ይህ የምስክር ወረቀት እውነተኛ ነው" },
  "verify.not_verified": { en: "Not Verified", am: "አልተረጋገጠም" },
  "verify.not_verified_desc": { en: "This certificate could not be verified", am: "ይህ የምስክር ወረቀት ማረጋገጥ አልተቻለም" },
  "verify.recipient": { en: "Recipient", am: "ተቀባይ" },
  "verify.course": { en: "Course", am: "ኮርስ" },
  "verify.date_issued": { en: "Date Issued", am: "የተሰጠበት ቀን" },
  "verify.certificate_no": { en: "Certificate No.", am: "የምስክር ወረቀት ቁጥር" },
  "verify.issued_by": { en: "Issued by", am: "የተሰጠው በ" },
  "verify.valid": { en: "VALID", am: "ትክክል" },
  "verify.invalid_default": { en: "The certificate code is invalid or does not exist.", am: "የምስክር ወረቀቱ ኮድ ትክክል አይደለም ወይም የለም።" },
  "verify.contact_revenue": {
    en: "If you believe this is an error, please contact the Ministry of Revenue.",
    am: "ይህ ስህተት ነው ብለው ካመኑ እባክዎ የገቢዎች ሚኒስቴርን ያግኙ።",
  },
  "verify.id": { en: "Verification ID", am: "የማረጋገጫ መለያ" },
  "quiz.check_answer": { en: "Check Answer", am: "መልሱን ያረጋግጡ" },
  "quiz.next_question": { en: "Next Question", am: "ቀጣይ ጥያቄ" },
  "quiz.passed": { en: "You Passed!", am: "አለፉ!" },
  "quiz.failed": { en: "Not Yet", am: "ገና አይደለም" },
  "quiz.correct": { en: "Correct!", am: "ትክክል!" },
  "quiz.incorrect": { en: "Incorrect", am: "ትክክል አይደለም" },
  "quiz.retry_all": { en: "Retry All Questions", am: "ሁሉም ጥያቄዎችን እንደገና ይሞክሩ" },
  "quiz.retry_wrong": { en: "Retry Wrong Questions Only", am: "ስህተቶቹን ብቻ እንደገና ይሞክሩ" },
  "quiz.review": { en: "Review Answers", am: "መልሶቹን ይገምግሙ" },
  "quiz.continue_learning": { en: "Continue Learning", am: "መማርን ቀጥሉ" },
  "quiz.passing_score": { en: "Passing score", am: "የማለፊያ ውጤት" },
  "quiz.attempts_remaining": { en: "attempts remaining", am: "የቀሩ ሙከራዎች" },
  "quiz.question": { en: "Question", am: "ጥያቄ" },
  "quiz.of": { en: "of", am: "ከ" },
  "quiz.answered": { en: "answered", am: "ተመልሷል" },
  "admin.step": { en: "Step", am: "ደረጃ" },
  "admin.create_course": { en: "Create New Course", am: "አዲስ ኮርስ ፍጠር" },
  "admin.course_title": { en: "Course Title", am: "የኮርስ ርዕስ" },
  "admin.slug": { en: "Slug", am: "ስላግ" },
  "admin.title": { en: "Title", am: "ርዕስ" },
  "admin.title_required": { en: "Title *", am: "ርዕስ *" },
  "admin.slug_required": { en: "Slug *", am: "ስላግ *" },
  "admin.description": { en: "Description", am: "መግለጫ" },
  "admin.category": { en: "Category", am: "ምድብ" },
  "admin.difficulty": { en: "Difficulty", am: "ደረጃ" },
  "admin.target_audience": { en: "Target Audience", am: "የታለመ ተመልካች" },
  "admin.thumbnail": { en: "Thumbnail", am: "አነስተኛ ምስል" },
  "admin.regenerate_slug": { en: "Regenerate Slug", am: "ስላግን እንደገና ፍጠር" },
  "admin.try_slug": { en: "Try", am: "ሞክር" },
  "admin.required_fields": { en: "Please complete required fields.", am: "እባክዎ የሚያስፈልጉ መስኮችን ይሙሉ።" },
  "admin.required_fields_course": {
    en: "Please complete required fields (Title, Slug, Category).",
    am: "እባክዎ የሚያስፈልጉ መስኮችን (ርዕስ፣ ስላግ፣ ምድብ) ይሙሉ።",
  },
  "admin.target_audience_required": {
    en: "Please select at least one target audience.",
    am: "እባክዎ ቢያንስ አንድ የታለመ ተመልካች ይምረጡ።",
  },
  "admin.slug_taken": {
    en: "This slug is already taken. Please choose a different one.",
    am: "ይህ ስላግ አስቀድሞ ተይዟል። እባክዎ ሌላ ይምረጡ።",
  },
  "admin.publish_failed": {
    en: "Could not publish course. Please try again.",
    am: "ኮርሱን ማተም አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
  },
  "admin.thumbnail_limit": {
    en: "Thumbnail must be under 5MB",
    am: "አነስተኛ ምስሉ ከ5MB በታች መሆን አለበት",
  },
  "admin.select_course_visibility": {
    en: "Select who can see this course",
    am: "ይህን ኮርስ ማን ሊያይ እንደሚችል ይምረጡ",
  },
  "admin.audience.taxpayer": { en: "Taxpayers", am: "ግብር ከፋዮች" },
  "admin.audience.tax_agent": { en: "Tax Agents", am: "የግብር ወኪሎች" },
  "admin.audience.mor_staff": { en: "MoR Staff", am: "የገቢዎች ሚኒስቴር ሰራተኞች" },
  "admin.audience.manager": { en: "Managers", am: "አስተዳዳሪዎች" },
  "admin.upload_thumbnail": { en: "Click to upload thumbnail", am: "አነስተኛ ምስል ለመጫን ይጫኑ" },
  "admin.thumbnail_formats": { en: "JPG, PNG, WEBP up to 5MB", am: "JPG፣ PNG፣ WEBP እስከ 5MB" },
  "admin.thumbnail_preview": { en: "Thumbnail preview", am: "የአነስተኛ ምስል ቅድመ እይታ" },
  "admin.saving": { en: "Saving...", am: "በማስቀመጥ ላይ..." },
  "admin.save_continue": { en: "Save & Continue", am: "አስቀምጥ እና ቀጥል" },
  "admin.back": { en: "Back", am: "ተመለስ" },
  "admin.continue_review": { en: "Continue to Review", am: "ወደ ግምገማ ቀጥል" },
  "admin.review_publish": { en: "Review & Publish", am: "ገምግም እና አትም" },
  "admin.publish_checklist": { en: "Publishing Checklist", am: "የህትመት ማረጋገጫ ዝርዝር" },
  "admin.check.section": { en: "At least 1 section", am: "ቢያንስ 1 ክፍል" },
  "admin.check.lecture_per_section": {
    en: "At least 1 lecture in every section",
    am: "በእያንዳንዱ ክፍል ቢያንስ 1 ትምህርት",
  },
  "admin.check.video_uploaded": {
    en: "All video lectures have uploaded files",
    am: "ሁሉም የቪዲዮ ትምህርቶች የተጫኑ ፋይሎች አሏቸው",
  },
  "admin.check.quiz_questions": {
    en: "All quiz lectures have at least 1 question",
    am: "ሁሉም የፈተና ትምህርቶች ቢያንስ 1 ጥያቄ አላቸው",
  },
  "admin.check.ok": { en: "[OK]", am: "[እሺ]" },
  "admin.check.missing": { en: "[MISSING]", am: "[የጎደለ]" },
  "admin.publishing": { en: "Publishing...", am: "በማተም ላይ..." },
  "admin.publish_course": { en: "Publish Course", am: "ኮርሱን አትም" },
  "admin.save_draft": { en: "Save as Draft", am: "እንደ ረቂቅ አስቀምጥ" },
  "admin.back_builder": { en: "Back to Builder", am: "ወደ ግንባታ ተመለስ" },
  "admin.summary.course": { en: "Course", am: "ኮርስ" },
  "admin.summary.category": { en: "Category", am: "ምድብ" },
  "admin.summary.difficulty": { en: "Difficulty", am: "ደረጃ" },
  "admin.summary.total_sections": { en: "Total sections", am: "ጠቅላላ ክፍሎች" },
  "admin.summary.total_lectures": { en: "Total lectures", am: "ጠቅላላ ትምህርቶች" },
  "admin.summary.total_video_lectures": { en: "Total video lectures", am: "ጠቅላላ የቪዲዮ ትምህርቶች" },
  "admin.summary.total_quiz_lectures": { en: "Total quiz lectures", am: "ጠቅላላ የፈተና ትምህርቶች" },
  "admin.course_settings": { en: "Course Settings", am: "የኮርስ ቅንብሮች" },
  "admin.save_course_details": { en: "Save Course Details", am: "የኮርስ ዝርዝሮችን አስቀምጥ" },
  "admin.course_settings_saved": {
    en: "Course settings updated successfully.",
    am: "የኮርስ ቅንብሮች በትክክል ተዘምነዋል።",
  },
  "admin.sections_lectures": { en: "Sections & Lectures", am: "ክፍሎች እና ትምህርቶች" },
  "admin.delete": { en: "Delete", am: "ሰርዝ" },
  "admin.delete_section_confirm": {
    en: "Delete this section and all lectures?",
    am: "ይህን ክፍል እና ሁሉንም ትምህርቶች ሰርዝ?",
  },
  "admin.delete_lecture_confirm": { en: "Delete this lecture?", am: "ይህን ትምህርት ሰርዝ?" },
  "admin.section_default": { en: "Section", am: "ክፍል" },
  "admin.lecture_default": { en: "Lecture", am: "ትምህርት" },
  "admin.lecture_title_placeholder": { en: "Lecture title", am: "የትምህርት ርዕስ" },
  "admin.lecture_description_placeholder": { en: "Lecture description", am: "የትምህርት መግለጫ" },
  "admin.type": { en: "Type", am: "አይነት" },
  "admin.type.video": { en: "VIDEO", am: "ቪዲዮ" },
  "admin.type.pdf": { en: "PDF", am: "ፒዲኤፍ" },
  "admin.type.text": { en: "TEXT", am: "ጽሑፍ" },
  "admin.type.quiz": { en: "QUIZ", am: "ፈተና" },
  "admin.free_preview": { en: "Free Preview", am: "ነጻ ቅድመ እይታ" },
  "admin.free_preview_help": {
    en: "Free preview lectures are visible without enrollment.",
    am: "ነጻ ቅድመ እይታ ትምህርቶች ምዝገባ ሳይኖር ይታያሉ።",
  },
  "admin.adding": { en: "Adding...", am: "በመጨመር ላይ..." },
  "admin.add_lecture": { en: "Add Lecture", am: "ትምህርት ጨምር" },
  "admin.select_file": { en: "Select File", am: "ፋይል ይምረጡ" },
  "admin.no_file_needed": { en: "No file needed for this type", am: "ለዚህ አይነት ፋይል አያስፈልግም" },
  "admin.cancel": { en: "Cancel", am: "ሰርዝ" },
  "admin.uploading_file": { en: "Uploading", am: "በመጫን ላይ" },
  "admin.file_label": { en: "FILE", am: "ፋይል" },
  "admin.add_section": { en: "Add Section", am: "ክፍል ጨምር" },
  "admin.lecture_editor": { en: "Lecture Editor", am: "የትምህርት አርታዒ" },
  "admin.select_lecture_prompt": {
    en: "Select a lecture from the left panel to edit.",
    am: "ለማስተካከል ከግራ ፓነሉ አንድ ትምህርት ይምረጡ።",
  },
  "admin.upload_file": { en: "Upload {ext} file", am: "{ext} ፋይል ይጫኑ" },
  "admin.uploaded": { en: "Uploaded", am: "ተጭኗል" },
  "admin.enter_article": { en: "Enter the Article", am: "ጽሑፉን ያስገቡ" },
  "admin.article_placeholder": { en: "Write the lesson content here...", am: "የትምህርቱን ይዘት እዚህ ይጻፉ..." },
  "admin.quiz_builder": { en: "Quiz Builder", am: "የፈተና ግንባታ" },
  "admin.quiz_section_settings": { en: "Section A - Quiz Settings", am: "ክፍል A - የፈተና ቅንብሮች" },
  "admin.passing_score_percent": { en: "Passing Score (%)", am: "የማለፊያ ውጤት (%)" },
  "admin.maximum_attempts": { en: "Maximum Attempts", am: "ከፍተኛ የሙከራ ብዛት" },
  "admin.save_settings": { en: "Save Settings", am: "ቅንብሮችን አስቀምጥ" },
  "admin.quiz_section_add_question": { en: "Section B - Add Question", am: "ክፍል B - ጥያቄ ጨምር" },
  "admin.question_text": { en: "Question Text", am: "የጥያቄ ጽሑፍ" },
  "admin.question_placeholder": { en: "Enter your question here...", am: "ጥያቄዎን እዚህ ያስገቡ..." },
  "admin.true_false": { en: "TRUE / FALSE", am: "እውነት / ሐሰት" },
  "admin.option_label": { en: "Option {label}", am: "አማራጭ {label}" },
  "admin.true": { en: "True", am: "እውነት" },
  "admin.false": { en: "False", am: "ሐሰት" },
  "admin.points": { en: "Points", am: "ነጥቦች" },
  "admin.explanation_optional": { en: "Explanation (optional)", am: "ማብራሪያ (አማራጭ)" },
  "admin.explanation_placeholder": {
    en: "Explain why this is the correct answer...",
    am: "ይህ ለምን ትክክለኛ መልስ እንደሆነ ያብራሩ...",
  },
  "admin.add_question": { en: "Add Question", am: "ጥያቄ ጨምር" },
  "admin.questions_list": { en: "Section C - Questions List", am: "ክፍል C - የጥያቄዎች ዝርዝር" },
  "admin.questions_added": { en: "{count} questions added", am: "{count} ጥያቄዎች ተጨምረዋል" },
  "admin.question_required_before_publish": {
    en: "Add at least 1 question before publishing",
    am: "ከማተም በፊት ቢያንስ 1 ጥያቄ ያክሉ",
  },
  "admin.correct": { en: "Correct", am: "ትክክል" },
  "admin.options": { en: "Options", am: "አማራጮች" },
  "admin.explanation": { en: "Explanation", am: "ማብራሪያ" },
  "admin.save_lecture": { en: "Save Lecture", am: "ትምህርቱን አስቀምጥ" },
  "admin.quiz_load_failed": { en: "Failed to load quiz questions.", am: "የፈተና ጥያቄዎችን መጫን አልተቻለም።" },
  "admin.quiz_save_failed": { en: "Failed to save quiz settings.", am: "የፈተና ቅንብሮችን ማስቀመጥ አልተቻለም።" },
  "admin.question_text_required": { en: "Question text is required.", am: "የጥያቄ ጽሑፍ ያስፈልጋል።" },
  "admin.correct_answer_required": { en: "Please select the correct answer.", am: "እባክዎ ትክክለኛውን መልስ ይምረጡ።" },
  "admin.mcq_options_required": { en: "All MCQ options are required.", am: "ሁሉም የMCQ አማራጮች ያስፈልጋሉ።" },
  "admin.file_too_large": {
    en: "File is too large ({sizeMB}MB). Maximum allowed size is 100MB.",
    am: "ፋይሉ በጣም ትልቅ ነው ({sizeMB}MB)። የሚፈቀደው ከፍተኛ መጠን 100MB ነው።",
  },
  "admin.invalid_type_for": { en: "Invalid file type for {type}.", am: "ለ {type} የማይሰራ የፋይል አይነት ነው።" },
  "admin.invalid_type_expected": { en: "Invalid file type. Expected {ext}", am: "የማይሰራ የፋይል አይነት ነው። የሚጠበቀው {ext} ነው" },
  "admin.upload_failed": {
    en: "File upload failed: {message}. The lecture \"{title}\" was created but has no video. You can re-upload the file from the version history panel.",
    am: "የፋይል መጫን አልተሳካም: {message}። \"{title}\" የተባለው ትምህርት ተፈጥሯል ነገር ግን ቪዲዮ የለውም። ፋይሉን ከስሪት ታሪክ ፓነል እንደገና መጫን ይችላሉ።",
  },
  "admin.unexpected_error": { en: "An unexpected error occurred.", am: "ያልተጠበቀ ስህተት ተፈጥሯል።" },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function syncDocumentLanguage(lang: Language) {
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("data-lang", lang);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("itas-language");
      const nextLanguage = saved === "am" || saved === "en" ? saved : "en";
      setLanguageState(nextLanguage);
      syncDocumentLanguage(nextLanguage);
    } catch {
      syncDocumentLanguage("en");
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("itas-language", lang);
    } catch {
      // Ignore storage failures.
    }
    syncDocumentLanguage(lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) {
        return key;
      }
      return entry[language] || entry.en;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isAmharic: language === "am",
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
