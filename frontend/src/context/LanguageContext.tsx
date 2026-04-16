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
  "nav.home": { en: "Home", am: "መነሻ" },
  "nav.dashboard": { en: "Dashboard", am: "ዳሽቦርድ" },
  "nav.courses": { en: "Courses", am: "ኮርሶች" },
  "nav.certificates": { en: "Certificates", am: "የምስክር ወረቀቶች" },
  "nav.webinars": { en: "Webinars", am: "ዌቢናሮች" },
  "nav.my_learning": { en: "My Learning", am: "ትምህርቴ" },
  "nav.analytics": { en: "Analytics", am: "ትንታኔዎች" },
  "auth.sign_out": { en: "Sign Out", am: "ውጣ" },
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
  "certs.issued": { en: "Issued", am: "የወጣበት" },
  "certs.download": { en: "Download", am: "አውርድ" },
  "certs.share": { en: "Link", am: "አገናኝ" },
  "certs.verify": { en: "Verify", am: "አረጋግጥ" },
  "theme.dark": { en: "Dark mode", am: "ጨለማ ሁነት" },
  "theme.light": { en: "Light mode", am: "ብሩህ ሁነት" },
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
