"use client";

import { FileText, Paperclip, Video, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  addLecture,
  addSection,
  createAssessment,
  getAssessment,
  createAssessmentQuestion,
  deleteAssessmentQuestion,
  deleteLecture,
  deleteSection,
  saveLectureFileUrl,
  updateLecture,
  updateSection,
  uploadLectureFile,
  type QuizQuestionPayload,
} from "@/lib/api/admin-courses";
import { useLanguage } from "@/context/LanguageContext";
import { versionApi } from "@/lib/api";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { CACHE_KEYS, courseCache } from "@/lib/courseCache";
import { getErrorMessage, getUploadErrorMessage } from "@/lib/errors";
import { getFileUrl } from "@/lib/utils";
import VersionHistoryPanel from "@/components/versioning/VersionHistoryPanel";
import type { Course, CourseSection, Lecture } from "@/types";

type CourseBuilderProps = {
  course: Course;
  onCourseChange: (course: Course) => void;
};

type UploadState = {
  progress: number;
  isUploading: boolean;
};

const DEFAULT_QUIZ = {
  passingScore: 70,
  maxAttempts: 3,
};

type QuizQuestion = {
  id: number | string;
  questionText: string;
  questionType: "MCQ" | "TRUE_FALSE";
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
};

type AssessmentQuestionResponse = {
  id: number | string;
  questionText: string;
  questionType: "MCQ" | "TRUE_FALSE";
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
};

const DEFAULT_QUESTION = {
  questionText: "",
  questionType: "MCQ" as "MCQ" | "TRUE_FALSE",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
  explanation: "",
};

function byOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
}

function lectureTypeIcon(type?: string) {
  const normalized = (type ?? "VIDEO").toUpperCase();
  if (normalized === "VIDEO") return "VID";
  if (normalized === "PDF") return "PDF";
  if (normalized === "TEXT") return "TXT";
  if (normalized === "QUIZ") return "QZ";
  return "•";
}

function cloneCourse(course: Course): Course {
  return {
    ...course,
    sections: [...(course.sections ?? [])].map((section) => ({
      ...section,
      lectures: [...(section.lectures ?? [])].filter((lecture): lecture is Lecture => lecture != null),
    })),
  };
}

function hasLectureFile(lecture: Lecture) {
  return Boolean(lecture.videoUrl || lecture.pdfUrl || lecture.contentUrl);
}

function getLectureAssetUrl(lecture: Lecture) {
  return lecture.videoUrl ?? lecture.pdfUrl ?? lecture.contentUrl ?? "";
}

function formatTranslation(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export default function CourseBuilder({ course, onCourseChange }: CourseBuilderProps) {
  const { t } = useLanguage();
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [uploadMap, setUploadMap] = useState<Record<string, UploadState>>({});
  const [lectureUploadMode, setLectureUploadMode] = useState<Record<string, "file" | "url">>({});
  const [lectureUrlInput, setLectureUrlInput] = useState<Record<string, string>>({});
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState(DEFAULT_QUIZ);
  const [assessmentId, setAssessmentId] = useState<number | string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState(DEFAULT_QUESTION);
  const [quizSaving, setQuizSaving] = useState(false);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [savingLecture, setSavingLecture] = useState(false);
  const [addingLectureSectionId, setAddingLectureSectionId] = useState<string | null>(null);
  const [addLectureForm, setAddLectureForm] = useState({
    title: "",
    description: "",
    type: "VIDEO",
    orderIndex: 0,
    isPreview: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sections = useMemo(() => byOrder((course.sections ?? []).filter((section): section is CourseSection => section != null)), [course.sections]);

  function invalidateCourseCaches(nextSlug?: string) {
    courseCache.invalidate(CACHE_KEYS.courses());
    courseCache.invalidate(CACHE_KEYS.course(course.slug));
    if (nextSlug && nextSlug !== course.slug) {
      courseCache.invalidate(CACHE_KEYS.course(nextSlug));
    }
  }

  const activeLecture = useMemo(() => {
    if (!sections || sections.length === 0 || !activeLectureId) return null;
    return sections
      .flatMap((section) => section.lectures ?? [])
      .filter((lecture): lecture is Lecture => lecture != null)
      .find((lecture) => String(lecture.id) === String(activeLectureId)) ?? null;
  }, [sections, activeLectureId]);

  const activeSection = useMemo(() => {
    if (!activeLectureId) return null;
    return sections.find((section) =>
      (section.lectures ?? [])
        .filter((lecture): lecture is Lecture => lecture != null)
        .some((lecture) => String(lecture.id) === String(activeLectureId))
    ) ?? null;
  }, [activeLectureId, sections]);

  useEffect(() => {
    setAssessmentId(activeLecture?.assessmentId ?? null);
    setQuizConfig(DEFAULT_QUIZ);
    setQuestions([]);
    setNewQuestion(DEFAULT_QUESTION);
  }, [activeLecture?.id, activeLecture?.assessmentId]);

  useEffect(() => {
    if (!activeLecture || activeLecture.type !== "QUIZ" || !activeLecture.assessmentId) {
      return;
    }

    const currentAssessmentId = activeLecture.assessmentId;
    let cancelled = false;

    async function loadAssessment() {
      try {
        setBuilderError(null);
        const assessment = await getAssessment(currentAssessmentId as number | string);
        if (cancelled) {
          return;
        }

        setAssessmentId(assessment.id);
        setQuizConfig({
          passingScore: Number(assessment.passingScore ?? DEFAULT_QUIZ.passingScore),
          maxAttempts: Number(assessment.maxAttempts ?? DEFAULT_QUIZ.maxAttempts),
        });
        setQuestions(
          (assessment.questions ?? []).map((question: AssessmentQuestionResponse) => ({
            id: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.questionType === "TRUE_FALSE"
              ? [t("admin.true"), t("admin.false")]
              : Array.isArray(question.options)
                ? question.options
                : ["", "", "", ""],
            correctAnswer: question.correctAnswer,
            points: Number(question.points ?? 1),
            explanation: question.explanation ?? "",
          }))
        );
      } catch (error: any) {
        if (cancelled) {
          return;
        }
        setBuilderError(getErrorMessage(error) || t("admin.quiz_load_failed"));
      }
    }

    void loadAssessment();

    return () => {
      cancelled = true;
    };
  }, [activeLecture]);

  function updateCourse(mutator: (next: Course) => void) {
    const next = cloneCourse(course);
    mutator(next);
    invalidateCourseCaches(next.slug);
    onCourseChange(next);
  }

  async function handleAddSection() {
    try {
      setBuilderError(null);
      const section = await addSection(
        course.id,
        `${t("admin.section_default")} ${sections.length + 1}`,
        sections.length + 1
      );
      updateCourse((next) => {
        next.sections = [...(next.sections ?? []), { ...section, lectures: section.lectures ?? [] }];
      });
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    }
  }

  async function handleDeleteSection(sectionId: number | string) {
    const confirmed = window.confirm(t("admin.delete_section_confirm"));
    if (!confirmed) return;
    try {
      await deleteSection(course.id, sectionId);
      updateCourse((next) => {
        next.sections = (next.sections ?? []).filter((section) => String(section.id) !== String(sectionId));
      });
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    }
  }

  async function handleSaveSectionTitle(sectionId: number | string) {
    if (!editingSectionTitle.trim()) return;
    try {
      const updated = await updateSection(course.id, sectionId, { title: editingSectionTitle.trim() });
      updateCourse((next) => {
        next.sections = (next.sections ?? []).map((section) =>
          String(section.id) === String(sectionId) ? { ...section, title: updated.title } : section
        );
      });
      setEditingSectionId(null);
      setEditingSectionTitle("");
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    }
  }

  function openAddLectureForm(section: CourseSection) {
    const orderIndex = (section.lectures ?? []).length + 1;
    setAddingLectureSectionId(String(section.id));
    setAddLectureForm({
      title: `${t("admin.lecture_default")} ${orderIndex}`,
      description: "",
      type: "VIDEO",
      orderIndex,
      isPreview: false,
    });
    clearSelectedFile();
  }

  function closeAddLectureForm() {
    setAddingLectureSectionId(null);
    clearSelectedFile();
    setAddLectureForm((prev) => ({ ...prev, isPreview: false }));
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
    setUploading(false);
    setUploadSuccess(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSelectFileClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(file: File) {
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / 1048576).toFixed(1);
      setFileError(formatTranslation(t("admin.file_too_large"), { sizeMB }));
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  }

  function handleFileSelected(file: File | null) {
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);

    const isVideo = addLectureForm.type === "VIDEO";
    const isPdf = addLectureForm.type === "PDF";
    const lower = file.name.toLowerCase();
    const valid = (isVideo && lower.endsWith(".mp4")) || (isPdf && lower.endsWith(".pdf"));

    if (!valid) {
      setUploadError(
        formatTranslation(t("admin.invalid_type_for"), {
          type: t(`admin.type.${addLectureForm.type.toLowerCase()}`),
        })
      );
      return;
    }

    handleFileSelect(file);
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function uploadLectureAsset(
    courseId: number | string,
    sectionId: number | string,
    lectureId: number | string,
    file: File,
    type?: string,
    onProgress?: (percent: number) => void
  ) {
    console.log("Starting upload:", {
      courseId,
      sectionId,
      lectureId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const formData = new FormData();
    formData.append("file", file);

    for (const [key, val] of formData.entries()) {
      console.log("FormData entry:", key, val);
    }

    const url = `/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}/upload`;
    console.log("Upload URL:", url);

    const updated = await uploadLectureFile(courseId, sectionId, lectureId, file, type, (percent) => {
      console.log("Upload progress:", percent);
      setUploadProgress(percent);
      onProgress?.(percent);
    });

    console.log("Upload response:", updated);
    console.log("videoUrl from response:", updated?.videoUrl);

    return updated;
  }

  async function handleAddLecture(section: CourseSection) {
    try {
      setLoading(true);
      setBuilderError(null);
      setUploadError(null);
      setUploadSuccess(false);
      setUploading(false);
      setUploadProgress(0);

      const requiresFile = addLectureForm.type === "VIDEO" || addLectureForm.type === "PDF";
      const newLecture = await addLecture(course.id, section.id, {
        title: addLectureForm.title,
        description: addLectureForm.description ?? "",
        type: addLectureForm.type,
        orderIndex: addLectureForm.orderIndex ?? 0,
        isPreview: addLectureForm.isPreview ?? false,
      });
      console.log("Lecture created:", newLecture);
      console.log("Lecture id:", newLecture.id);
      let finalLecture = newLecture;
      if (requiresFile && selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        try {
          const uploadResult = await uploadLectureAsset(
            course.id,
            section.id,
            newLecture.id,
            selectedFile,
            addLectureForm.type,
            (percent) => {
              setUploadProgress(percent);
            }
          );
          if (uploadResult) {
            finalLecture = uploadResult;
          }
          setUploadSuccess(true);
        } catch (uploadError: any) {
          const message = getUploadErrorMessage(uploadError);
          throw new Error(
            formatTranslation(t("admin.upload_failed"), {
              message,
              title: newLecture.title,
            })
          );
        }
      }

      updateCourse((next) => {
        next.sections = (next.sections ?? []).map((item) =>
          String(item.id) === String(section.id) ? { ...item, lectures: [...(item.lectures ?? []), finalLecture] } : item
        );
      });
      setActiveLectureId(String(newLecture.id));
      closeAddLectureForm();
    } catch (error: any) {
      const message = error?.response ? getErrorMessage(error) : error?.message || t("admin.unexpected_error");
      setUploadError(message);
      setBuilderError(message);
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDeleteLecture(sectionId: number | string, lectureId: number | string) {
    const confirmed = window.confirm(t("admin.delete_lecture_confirm"));
    if (!confirmed) return;
    try {
      await deleteLecture(course.id, sectionId, lectureId);
      updateCourse((next) => {
        next.sections = (next.sections ?? []).map((section) => ({
          ...section,
          lectures: (section.lectures ?? [])
            .filter((lecture): lecture is Lecture => lecture != null)
            .filter((lecture) => String(lecture.id) !== String(lectureId)),
        }));
      });
      if (String(lectureId) === activeLectureId) {
        setActiveLectureId(null);
      }
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    }
  }

  async function handleSaveLecture() {
    if (!activeLecture || !activeSection) return;
    try {
      setSavingLecture(true);
      const updated = await updateLecture(course.id, activeSection.id, activeLecture.id, {
        title: activeLecture.title,
        description: activeLecture.description ?? "",
        type: activeLecture.type ?? "VIDEO",
        isPreview: Boolean(activeLecture.preview ?? activeLecture.isPreview),
        orderIndex: activeLecture.orderIndex ?? 0,
        content: activeLecture.contentHtml ?? activeLecture.content ?? activeLecture.contentUrl ?? "",
      });
      updateCourse((next) => {
        next.sections = (next.sections ?? []).map((section) => ({
          ...section,
          lectures: (section.lectures ?? [])
            .filter((lecture): lecture is Lecture => lecture != null)
            .map((lecture) => (String(lecture.id) === String(updated.id) ? { ...lecture, ...updated } : lecture)),
        }));
      });
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    } finally {
      setSavingLecture(false);
    }
  }

  function patchActiveLecture(patch: Partial<Lecture>) {
    if (!activeLecture) return;
    updateCourse((next) => {
      next.sections = (next.sections ?? []).map((section) => ({
        ...section,
        lectures: (section.lectures ?? [])
          .filter((lecture): lecture is Lecture => lecture != null)
          .map((lecture) => (String(lecture.id) === String(activeLecture.id) ? { ...lecture, ...patch } : lecture)),
      }));
    });
  }

  async function handleUpload(sectionId: number | string, lecture: Lecture, file: File, expectedExt: ".mp4" | ".pdf") {
    const name = file.name.toLowerCase();
    if (!name.endsWith(expectedExt)) {
      setBuilderError(formatTranslation(t("admin.invalid_type_expected"), { ext: expectedExt }));
      return;
    }

    try {
      setBuilderError(null);
      setUploadMap((prev) => ({ ...prev, [String(lecture.id)]: { progress: 0, isUploading: true } }));
      const updated = await uploadLectureAsset(course.id, sectionId, lecture.id, file, lecture.type, (progress) => {
        setUploadMap((prev) => ({ ...prev, [String(lecture.id)]: { progress, isUploading: true } }));
      });
      if (updated) {
        updateCourse((next) => {
          next.sections = (next.sections ?? []).map((section) => ({
            ...section,
            lectures: (section.lectures ?? [])
              .filter((item): item is Lecture => item != null)
              .map((item) => (String(item.id) === String(lecture.id) ? { ...item, ...updated } : item)),
          }));
        });
      }
    } catch (error: any) {
      setBuilderError(getUploadErrorMessage(error));
    } finally {
      setUploadMap((prev) => ({ ...prev, [String(lecture.id)]: { progress: 100, isUploading: false } }));
    }
  }

  async function handleSaveLectureUrl(sectionId: number | string, lecture: Lecture, url: string) {
    try {
      setBuilderError(null);
      setUploadMap((prev) => ({ ...prev, [String(lecture.id)]: { progress: 0, isUploading: true } }));
      const updated = await saveLectureFileUrl(course.id, sectionId, lecture.id, url, lecture.type);
      updateCourse((next) => {
        next.sections = (next.sections ?? []).map((section) => ({
          ...section,
          lectures: (section.lectures ?? [])
            .filter((item): item is Lecture => item != null)
            .map((item) => (String(item.id) === String(lecture.id) ? { ...item, ...updated } : item)),
        }));
      });
      setLectureUrlInput((prev) => ({ ...prev, [String(lecture.id)]: "" }));
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    } finally {
      setUploadMap((prev) => ({ ...prev, [String(lecture.id)]: { progress: 100, isUploading: false } }));
    }
  }

  async function handleSaveQuizSettings() {
    if (!activeLecture) return;
    try {
      setQuizSaving(true);
      const created = await createAssessment({
        lectureId: activeLecture.id,
        title: activeLecture.title,
        passingScore: Number(quizConfig.passingScore) || 70,
        maxAttempts: Number(quizConfig.maxAttempts) || 3,
      });
      setAssessmentId(created.id);
      patchActiveLecture({ assessmentId: created.id, type: "QUIZ" });
      setBuilderError(null);
    } catch {
      setBuilderError(t("admin.quiz_save_failed"));
    } finally {
      setQuizSaving(false);
    }
  }

  async function handleAddQuestion() {
    if (!assessmentId) return;
    if (!newQuestion.questionText.trim()) {
      setBuilderError(t("admin.question_text_required"));
      return;
    }

    if (!newQuestion.correctAnswer) {
      setBuilderError(t("admin.correct_answer_required"));
      return;
    }

    if (newQuestion.questionType === "MCQ" && newQuestion.options.some((option) => !option.trim())) {
      setBuilderError(t("admin.mcq_options_required"));
      return;
    }

    const payload: QuizQuestionPayload = {
      questionText: newQuestion.questionText.trim(),
      questionType: newQuestion.questionType,
      optionsJson: JSON.stringify(
        newQuestion.questionType === "MCQ" ? newQuestion.options : [t("admin.true"), t("admin.false")]
      ),
      correctAnswer: newQuestion.correctAnswer,
      points: Number(newQuestion.points) || 1,
      explanation: newQuestion.explanation?.trim() || undefined,
    };

    try {
      setQuestionSaving(true);
      const created = await createAssessmentQuestion(assessmentId, payload);
      const nextQuestion: QuizQuestion = {
        id: created.id,
        questionText: payload.questionText,
        questionType: payload.questionType,
        options: JSON.parse(payload.optionsJson) as string[],
        correctAnswer: payload.correctAnswer,
        points: payload.points,
        explanation: payload.explanation,
      };
      setQuestions((prev) => [...prev, nextQuestion]);
      patchActiveLecture({ quizQuestionCount: (activeLecture?.quizQuestionCount ?? 0) + 1 });
      setNewQuestion(DEFAULT_QUESTION);
      setBuilderError(null);
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    } finally {
      setQuestionSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId: number | string) {
    if (!assessmentId) return;

    try {
      await deleteAssessmentQuestion(assessmentId, questionId);
      setQuestions((prev) => prev.filter((question) => String(question.id) !== String(questionId)));
      patchActiveLecture({ quizQuestionCount: Math.max(0, (activeLecture?.quizQuestionCount ?? 1) - 1) });
      setBuilderError(null);
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    }
  }

  async function refreshLectureFromVersionHistory() {
    if (!activeLecture || !activeSection) return;

    try {
      const response = await versionApi.getVersionHistory(
        Number(course.id),
        Number(activeSection.id),
        Number(activeLecture.id)
      );
      const currentVersion = response.data.find((version) => version.isCurrent) ?? response.data[0];
      if (!currentVersion) return;

      patchActiveLecture({
        videoUrl: activeLecture.type === "VIDEO" ? currentVersion.filePath : activeLecture.videoUrl,
        pdfUrl: activeLecture.type === "PDF" ? currentVersion.filePath : activeLecture.pdfUrl,
        contentUrl: currentVersion.filePath,
      });
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("admin.sections_lectures")}</h2>
        <div className="mt-4 space-y-3">
          {sections.map((section, index) => (
            <div key={section.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                {editingSectionId === String(section.id) ? (
                  <input
                    value={editingSectionTitle}
                    onChange={(event) => setEditingSectionTitle(event.target.value)}
                    onBlur={() => void handleSaveSectionTitle(section.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void handleSaveSectionTitle(section.id);
                    }}
                    autoFocus
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionId(String(section.id));
                      setEditingSectionTitle(section.title);
                    }}
                    className="text-left text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {index + 1}. {section.title}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDeleteSection(section.id)}
                  className="text-xs text-rose-600 hover:underline"
                >
                  {t("admin.delete")}
                </button>
              </div>

              <ul className="mt-2 space-y-1">
                {byOrder((section.lectures ?? []).filter((lecture): lecture is Lecture => lecture != null)).map((lecture) => (
                  <li key={lecture.id} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveLectureId(String(lecture.id))}
                      className={`flex-1 truncate rounded px-2 py-1 text-left text-xs ${
                        String(lecture.id) === activeLectureId
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {lectureTypeIcon(lecture.type)} {lecture.title}
                      {lecture.type === "VIDEO" && lecture.videoUrl ? (
                        <span className="ml-1 text-xs text-gray-400"><Video className="inline h-3 w-3" /></span>
                      ) : null}
                      {lecture.type === "PDF" && lecture.pdfUrl ? (
                        <span className="ml-1 text-xs text-gray-400"><FileText className="inline h-3 w-3" /></span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLecture(section.id, lecture.id)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      {t("admin.delete")}
                    </button>
                  </li>
                ))}
              </ul>

              {addingLectureSectionId === String(section.id) ? (
                <div className="mt-3 space-y-2 rounded border border-slate-200 p-2 dark:border-slate-800">
                  <input
                    value={addLectureForm.title}
                    onChange={(event) => setAddLectureForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder={t("admin.lecture_title_placeholder")}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <textarea
                    value={addLectureForm.description}
                    onChange={(event) => setAddLectureForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={2}
                    placeholder={t("admin.lecture_description_placeholder")}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={addLectureForm.type}
                      onChange={(event) =>
                        setAddLectureForm((prev) => {
                          const nextType = event.target.value;
                          if (nextType === "TEXT" || nextType === "QUIZ") {
                            clearSelectedFile();
                          }
                          return { ...prev, type: nextType };
                        })
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="VIDEO">{t("admin.type.video")}</option>
                      <option value="PDF">{t("admin.type.pdf")}</option>
                      <option value="TEXT">{t("admin.type.text")}</option>
                      <option value="QUIZ">{t("admin.type.quiz")}</option>
                    </select>
                    <input
                      type="number"
                      value={addLectureForm.orderIndex}
                      onChange={(event) => setAddLectureForm((prev) => ({ ...prev, orderIndex: Number(event.target.value) }))}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={() =>
                        setAddLectureForm((prev) => ({
                          ...prev,
                          isPreview: !prev.isPreview,
                        }))
                      }
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                        addLectureForm.isPreview ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-white transition dark:bg-slate-100 ${
                          addLectureForm.isPreview ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span>{t("admin.free_preview")}</span>
                  </label>
                  <p className="text-[11px] text-slate-500">{t("admin.free_preview_help")}</p>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={addLectureForm.type === "VIDEO" ? ".mp4" : addLectureForm.type === "PDF" ? ".pdf" : ""}
                      onChange={(event) => handleFileSelected(event.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddLecture(section)}
                      disabled={loading || uploading || !addLectureForm.title.trim() || fileError != null}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
                    >
                      {uploading ? `${t("admin.uploading_file")}... ${uploadProgress}%` : loading ? t("admin.adding") : t("admin.add_lecture")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectFileClick}
                      disabled={addLectureForm.type === "TEXT" || addLectureForm.type === "QUIZ"}
                      title={addLectureForm.type === "TEXT" || addLectureForm.type === "QUIZ" ? t("admin.no_file_needed") : ""}
                    className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {t("admin.select_file")}
                    </button>
                    <button
                      type="button"
                      onClick={closeAddLectureForm}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {t("admin.cancel")}
                    </button>
                  </div>

                  {uploading ? (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-sm text-gray-600">
                        <span>{t("admin.uploading_file")} {selectedFile?.name}...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : null}

                  {selectedFile ? (
                  <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          [{t("admin.file_label")}] {selectedFile.name} ({formatBytes(selectedFile.size)})
                          {uploadSuccess ? <span className="ml-2 text-emerald-600">[OK]</span> : null}
                        </span>
                    <button type="button" onClick={clearSelectedFile} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {uploadError ? <p className="text-[11px] text-rose-600">{uploadError}</p> : null}
                  {fileError ? (
                    <p className="mt-1 text-sm text-red-500">
                      ⚠ {fileError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAddLectureForm(section)}
                  className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t("admin.add_lecture")}
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleAddSection()}
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t("admin.add_section")}
        </button>
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("admin.lecture_editor")}</h2>
        {!activeLecture ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t("admin.select_lecture_prompt")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.title")}</span>
              <input
                value={activeLecture.title}
                onChange={(event) => patchActiveLecture({ title: event.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.description")}</span>
              <textarea
                value={activeLecture.description ?? ""}
                onChange={(event) => patchActiveLecture({ description: event.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.type")}</span>
              <div className="flex flex-wrap gap-2">
                {["VIDEO", "PDF", "TEXT", "QUIZ"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => patchActiveLecture({ type })}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      (activeLecture.type ?? "VIDEO") === type
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t(`admin.type.${type.toLowerCase()}`)}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(activeLecture.preview ?? activeLecture.isPreview)}
                onChange={(event) => patchActiveLecture({ preview: event.target.checked, isPreview: event.target.checked })}
              />
              {t("admin.free_preview")}
            </label>

            {(activeLecture.type ?? "VIDEO") === "VIDEO" || (activeLecture.type ?? "VIDEO") === "PDF" ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {formatTranslation(t("admin.upload_file"), {
                    ext: activeLecture.type === "PDF" ? ".pdf" : ".mp4",
                  })}
                </p>
                <div className="mt-3 flex rounded-lg border border-slate-300 p-1 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() =>
                      setLectureUploadMode((prev) => ({ ...prev, [String(activeLecture.id)]: "file" }))
                    }
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                      (lectureUploadMode[String(activeLecture.id)] ?? "file") === "file"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLectureUploadMode((prev) => ({ ...prev, [String(activeLecture.id)]: "url" }))
                    }
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                      (lectureUploadMode[String(activeLecture.id)] ?? "file") === "url"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    Paste URL
                  </button>
                </div>
                {(lectureUploadMode[String(activeLecture.id)] ?? "file") === "file" ? (
                  <input
                    type="file"
                    accept={activeLecture.type === "PDF" ? ".pdf" : ".mp4"}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file || !activeSection) return;
                      void handleUpload(
                        activeSection.id,
                        activeLecture,
                        file,
                        activeLecture.type === "PDF" ? ".pdf" : ".mp4"
                      );
                    }}
                    className="mt-3 text-sm"
                  />
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="url"
                      value={lectureUrlInput[String(activeLecture.id)] ?? ""}
                      onChange={(event) =>
                        setLectureUrlInput((prev) => ({ ...prev, [String(activeLecture.id)]: event.target.value }))
                      }
                      placeholder={
                        activeLecture.type === "PDF"
                          ? "https://example.com/file.pdf"
                          : "https://res.cloudinary.com/... or YouTube/Vimeo URL"
                      }
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && activeSection) {
                          void handleSaveLectureUrl(
                            activeSection.id,
                            activeLecture,
                            lectureUrlInput[String(activeLecture.id)] ?? ""
                          );
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!activeSection || !(lectureUrlInput[String(activeLecture.id)] ?? "").trim()}
                      onClick={() => {
                        if (!activeSection) return;
                        void handleSaveLectureUrl(
                          activeSection.id,
                          activeLecture,
                          (lectureUrlInput[String(activeLecture.id)] ?? "").trim()
                        );
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      Save URL
                    </button>
                  </div>
                )}
                {uploadMap[String(activeLecture.id)]?.isUploading ? (
                  <div className="mt-2">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${uploadMap[String(activeLecture.id)]?.progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                {getLectureAssetUrl(activeLecture) ? (
                  <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {t("admin.uploaded")}: {getLectureAssetUrl(activeLecture)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {(activeLecture.type === "VIDEO" || activeLecture.type === "PDF") &&
            hasLectureFile(activeLecture) &&
            activeSection ? (
              <div className="mt-4">
                <VersionHistoryPanel
                  courseId={Number(course.id)}
                  sectionId={Number(activeSection.id)}
                  lectureId={Number(activeLecture.id)}
                  lectureTitle={activeLecture.title}
                  lectureType={activeLecture.type}
                  onVersionUploaded={() => {
                    void refreshLectureFromVersionHistory();
                  }}
                />
              </div>
            ) : null}

            {(activeLecture.type ?? "VIDEO") === "TEXT" ? (
              <div className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("admin.enter_article")}</span>
                <RichTextEditor
                  value={activeLecture.contentHtml ?? activeLecture.content ?? ""}
                  placeholder={t("admin.article_placeholder")}
                  onChange={(value) => patchActiveLecture({ contentHtml: value, content: value })}
                />
              </div>
            ) : null}

            {(activeLecture.type ?? "VIDEO") === "QUIZ" ? (
              <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("admin.quiz_builder")}</h3>

                <div className="space-y-3 rounded border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("admin.quiz_section_settings")}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t("admin.passing_score_percent")}</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={quizConfig.passingScore}
                        onChange={(event) =>
                          setQuizConfig((prev) => ({ ...prev, passingScore: Number(event.target.value) }))
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t("admin.maximum_attempts")}</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={quizConfig.maxAttempts}
                        onChange={(event) =>
                          setQuizConfig((prev) => ({ ...prev, maxAttempts: Number(event.target.value) }))
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSaveQuizSettings()}
                    disabled={quizSaving}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {quizSaving ? t("admin.saving") : t("admin.save_settings")}
                  </button>
                </div>

                {assessmentId ? (
                  <>
                    <div className="space-y-3 rounded border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("admin.quiz_section_add_question")}</p>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t("admin.question_text")}</span>
                        <textarea
                          rows={3}
                          placeholder={t("admin.question_placeholder")}
                          value={newQuestion.questionText}
                          onChange={(event) =>
                            setNewQuestion((prev) => ({ ...prev, questionText: event.target.value }))
                          }
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setNewQuestion((prev) => ({
                              ...prev,
                              questionType: "MCQ",
                              correctAnswer: "",
                              options: prev.options.length === 4 ? prev.options : ["", "", "", ""],
                            }))
                          }
                          className={`rounded px-3 py-1 text-xs font-medium ${
                            newQuestion.questionType === "MCQ"
                              ? "bg-blue-600 text-white"
                              : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                          }`}
                        >
                          MCQ
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewQuestion((prev) => ({
                              ...prev,
                              questionType: "TRUE_FALSE",
                              correctAnswer: "",
                            }))
                          }
                          className={`rounded px-3 py-1 text-xs font-medium ${
                            newQuestion.questionType === "TRUE_FALSE"
                              ? "bg-blue-600 text-white"
                              : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {t("admin.true_false")}
                        </button>
                      </div>

                      {newQuestion.questionType === "MCQ" ? (
                        <div className="space-y-2">
                          {newQuestion.options.map((option, index) => (
                            <div key={`option-${index}`} className="flex items-center gap-2">
                              <span className="w-16 text-xs font-medium text-slate-600 dark:text-slate-400">{`${formatTranslation(
                                t("admin.option_label"),
                                { label: ["A", "B", "C", "D"][index] }
                              )}:`}</span>
                              <input
                                value={option}
                                onChange={(event) =>
                                  setNewQuestion((prev) => {
                                    const next = [...prev.options];
                                    const nextValue = event.target.value;
                                    const wasCorrect = prev.correctAnswer === prev.options[index];
                                    next[index] = event.target.value;
                                    return {
                                      ...prev,
                                      options: next,
                                      correctAnswer: wasCorrect ? nextValue : prev.correctAnswer,
                                    };
                                  })
                                }
                                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                              />
                              <input
                                type="radio"
                                name="mcq-correct-answer"
                                checked={newQuestion.correctAnswer === option && option.length > 0}
                                onChange={() =>
                                  setNewQuestion((prev) => ({
                                    ...prev,
                                    correctAnswer: prev.options[index],
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-sm">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="tf-correct-answer"
                              checked={newQuestion.correctAnswer === t("admin.true")}
                              onChange={() =>
                                setNewQuestion((prev) => ({
                                  ...prev,
                                  correctAnswer: t("admin.true"),
                                }))
                              }
                            />
                            {t("admin.true")}
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="tf-correct-answer"
                              checked={newQuestion.correctAnswer === t("admin.false")}
                              onChange={() =>
                                setNewQuestion((prev) => ({
                                  ...prev,
                                  correctAnswer: t("admin.false"),
                                }))
                              }
                            />
                            {t("admin.false")}
                          </label>
                        </div>
                      )}

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t("admin.points")}</span>
                        <input
                          type="number"
                          min={1}
                          value={newQuestion.points}
                          onChange={(event) =>
                            setNewQuestion((prev) => ({
                              ...prev,
                              points: Number(event.target.value),
                            }))
                          }
                          className="w-24 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t("admin.explanation_optional")}</span>
                        <textarea
                          rows={2}
                          placeholder={t("admin.explanation_placeholder")}
                          value={newQuestion.explanation ?? ""}
                          onChange={(event) =>
                            setNewQuestion((prev) => ({
                              ...prev,
                              explanation: event.target.value,
                            }))
                          }
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleAddQuestion()}
                        disabled={questionSaving}
                        className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {questionSaving ? t("admin.adding") : t("admin.add_question")}
                      </button>
                    </div>

                    <div className="space-y-3 rounded border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("admin.questions_list")}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{formatTranslation(t("admin.questions_added"), { count: questions.length })}</p>
                      {questions.length === 0 ? (
                        <p className="text-xs text-amber-700">{t("admin.question_required_before_publish")}</p>
                      ) : (
                        <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                          {questions.map((question, index) => (
                            <li key={question.id} className="rounded border border-slate-200 p-2 dark:border-slate-800">
                              <p className="font-medium">
                                {index + 1}. {question.questionText}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {t("admin.type")}: {question.questionType} | {t("admin.points")}: {question.points}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {t("admin.options")}:{" "}
                                {question.options.map((option, optionIndex) => {
                                  const label = ["A", "B", "C", "D"][optionIndex] ?? `${optionIndex + 1}`;
                                  return `${label}) ${option}`;
                                }).join(" | ")}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{t("admin.correct")}: {question.correctAnswer}</p>
                              {question.explanation ? (
                                <p className="text-xs text-slate-600 dark:text-slate-400">{t("admin.explanation")}: {question.explanation}</p>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void handleDeleteQuestion(question.id)}
                                className="mt-1 text-xs text-rose-600 hover:underline"
                              >
                                {t("admin.delete")}
                              </button>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {builderError ? <p className="text-sm text-rose-600">{builderError}</p> : null}

            <button
              type="button"
              onClick={() => void handleSaveLecture()}
              disabled={savingLecture}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {savingLecture ? t("admin.saving") : t("admin.save_lecture")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
