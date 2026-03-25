"use client";

import { Paperclip, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  addLecture,
  addSection,
  createAssessment,
  createAssessmentQuestion,
  deleteAssessmentQuestion,
  deleteLecture,
  deleteSection,
  updateLecture,
  updateSection,
  uploadLectureFile,
  type QuizQuestionPayload,
} from "@/lib/api/admin-courses";
import { versionApi } from "@/lib/api";
import { getErrorMessage, getUploadErrorMessage } from "@/lib/errors";
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
};

const DEFAULT_QUESTION = {
  questionText: "",
  questionType: "MCQ" as "MCQ" | "TRUE_FALSE",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
};

function byOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
}

function lectureTypeIcon(type?: string) {
  const normalized = (type ?? "VIDEO").toUpperCase();
  if (normalized === "VIDEO") return "🎬";
  if (normalized === "PDF") return "📄";
  if (normalized === "TEXT") return "📝";
  if (normalized === "QUIZ") return "❓";
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

export default function CourseBuilder({ course, onCourseChange }: CourseBuilderProps) {
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [uploadMap, setUploadMap] = useState<Record<string, UploadState>>({});
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

  function updateCourse(mutator: (next: Course) => void) {
    const next = cloneCourse(course);
    mutator(next);
    onCourseChange(next);
  }

  async function handleAddSection() {
    try {
      setBuilderError(null);
      const section = await addSection(course.id, `Section ${sections.length + 1}`, sections.length + 1);
      updateCourse((next) => {
        next.sections = [...(next.sections ?? []), { ...section, lectures: section.lectures ?? [] }];
      });
    } catch (error: any) {
      setBuilderError(getErrorMessage(error));
    }
  }

  async function handleDeleteSection(sectionId: number | string) {
    const confirmed = window.confirm("Delete this section and all lectures?");
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
      title: `Lecture ${orderIndex}`,
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
      setFileError(`File is too large (${sizeMB}MB). Maximum allowed size is 100MB.`);
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
      setUploadError(`Invalid file type for ${addLectureForm.type}.`);
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

    const updated = await uploadLectureFile(courseId, sectionId, lectureId, file, (percent) => {
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
            `File upload failed: ${message}. The lecture "${newLecture.title}" was created but has no video. You can re-upload the file from the version history panel.`
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
      const message = error?.response ? getErrorMessage(error) : error?.message || "An unexpected error occurred.";
      setUploadError(message);
      setBuilderError(message);
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDeleteLecture(sectionId: number | string, lectureId: number | string) {
    const confirmed = window.confirm("Delete this lecture?");
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
      setBuilderError(`Invalid file type. Expected ${expectedExt}`);
      return;
    }

    try {
      setBuilderError(null);
      setUploadMap((prev) => ({ ...prev, [String(lecture.id)]: { progress: 0, isUploading: true } }));
      const updated = await uploadLectureAsset(course.id, sectionId, lecture.id, file, (progress) => {
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
      setBuilderError("Failed to save quiz settings.");
    } finally {
      setQuizSaving(false);
    }
  }

  async function handleAddQuestion() {
    if (!assessmentId) return;
    if (!newQuestion.questionText.trim()) {
      setBuilderError("Question text is required.");
      return;
    }

    if (!newQuestion.correctAnswer) {
      setBuilderError("Please select the correct answer.");
      return;
    }

    if (newQuestion.questionType === "MCQ" && newQuestion.options.some((option) => !option.trim())) {
      setBuilderError("All MCQ options are required.");
      return;
    }

    const payload: QuizQuestionPayload = {
      questionText: newQuestion.questionText.trim(),
      questionType: newQuestion.questionType,
      optionsJson: JSON.stringify(
        newQuestion.questionType === "MCQ" ? newQuestion.options : ["True", "False"]
      ),
      correctAnswer: newQuestion.correctAnswer,
      points: Number(newQuestion.points) || 1,
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
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
        <h2 className="text-base font-semibold text-slate-900">Sections & Lectures</h2>
        <div className="mt-4 space-y-3">
          {sections.map((section, index) => (
            <div key={section.id} className="rounded-lg border border-slate-200 p-3">
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
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionId(String(section.id));
                      setEditingSectionTitle(section.title);
                    }}
                    className="text-left text-sm font-medium text-slate-900"
                  >
                    {index + 1}. {section.title}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDeleteSection(section.id)}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </div>

              <ul className="mt-2 space-y-1">
                {byOrder((section.lectures ?? []).filter((lecture): lecture is Lecture => lecture != null)).map((lecture) => (
                  <li key={lecture.id} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveLectureId(String(lecture.id))}
                      className={`flex-1 truncate rounded px-2 py-1 text-left text-xs ${
                        String(lecture.id) === activeLectureId ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {lectureTypeIcon(lecture.type)} {lecture.title}
                      {lecture.type === "VIDEO" && lecture.videoUrl ? (
                        <span className="ml-1 text-xs text-gray-400">🎬</span>
                      ) : null}
                      {lecture.type === "PDF" && lecture.pdfUrl ? (
                        <span className="ml-1 text-xs text-gray-400">📄</span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLecture(section.id, lecture.id)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>

              {addingLectureSectionId === String(section.id) ? (
                <div className="mt-3 space-y-2 rounded border border-slate-200 p-2">
                  <input
                    value={addLectureForm.title}
                    onChange={(event) => setAddLectureForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Lecture title"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                  <textarea
                    value={addLectureForm.description}
                    onChange={(event) => setAddLectureForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={2}
                    placeholder="Lecture description"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
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
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="VIDEO">VIDEO</option>
                      <option value="PDF">PDF</option>
                      <option value="TEXT">TEXT</option>
                      <option value="QUIZ">QUIZ</option>
                    </select>
                    <input
                      type="number"
                      value={addLectureForm.orderIndex}
                      onChange={(event) => setAddLectureForm((prev) => ({ ...prev, orderIndex: Number(event.target.value) }))}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <button
                      type="button"
                      onClick={() =>
                        setAddLectureForm((prev) => ({
                          ...prev,
                          isPreview: !prev.isPreview,
                        }))
                      }
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                        addLectureForm.isPreview ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-white transition ${
                          addLectureForm.isPreview ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span>Free Preview</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Free preview lectures are visible without enrollment.</p>

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
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {uploading ? `Uploading... ${uploadProgress}%` : loading ? "Adding..." : "Add Lecture"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectFileClick}
                      disabled={addLectureForm.type === "TEXT" || addLectureForm.type === "QUIZ"}
                      title={addLectureForm.type === "TEXT" || addLectureForm.type === "QUIZ" ? "No file needed for this type" : ""}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      Select File
                    </button>
                    <button
                      type="button"
                      onClick={closeAddLectureForm}
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>

                  {uploading ? (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-sm text-gray-600">
                        <span>Uploading {selectedFile?.name}...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : null}

                  {selectedFile ? (
                    <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          [FILE] {selectedFile.name} ({formatBytes(selectedFile.size)})
                          {uploadSuccess ? <span className="ml-2 text-emerald-600">[OK]</span> : null}
                        </span>
                        <button type="button" onClick={clearSelectedFile} className="text-slate-500 hover:text-slate-700">
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
                  className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Add Lecture
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleAddSection()}
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Add Section
        </button>
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h2 className="text-base font-semibold text-slate-900">Lecture Editor</h2>
        {!activeLecture ? (
          <p className="mt-3 text-sm text-slate-600">Select a lecture from the left panel to edit.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
              <input
                value={activeLecture.title}
                onChange={(event) => patchActiveLecture({ title: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={activeLecture.description ?? ""}
                onChange={(event) => patchActiveLecture({ description: event.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Type</span>
              <div className="flex flex-wrap gap-2">
                {["VIDEO", "PDF", "TEXT", "QUIZ"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => patchActiveLecture({ type })}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      (activeLecture.type ?? "VIDEO") === type
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(activeLecture.preview ?? activeLecture.isPreview)}
                onChange={(event) => patchActiveLecture({ preview: event.target.checked, isPreview: event.target.checked })}
              />
              Free Preview
            </label>

            {(activeLecture.type ?? "VIDEO") === "VIDEO" || (activeLecture.type ?? "VIDEO") === "PDF" ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4">
                <p className="text-sm text-slate-700">
                  Upload {activeLecture.type === "PDF" ? ".pdf" : ".mp4"} file
                </p>
                <input
                  type="file"
                  accept={activeLecture.type === "PDF" ? ".pdf" : ".mp4"}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file || !activeSection) return;
                    void handleUpload(activeSection.id, activeLecture, file, activeLecture.type === "PDF" ? ".pdf" : ".mp4");
                  }}
                  className="mt-2 text-sm"
                />
                {uploadMap[String(activeLecture.id)]?.isUploading ? (
                  <div className="mt-2">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${uploadMap[String(activeLecture.id)]?.progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                {activeLecture.contentUrl ? (
                  <p className="mt-2 text-xs text-slate-600">Uploaded: {activeLecture.contentUrl}</p>
                ) : null}
                {activeLecture.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeLecture.thumbnailUrl} alt={activeLecture.title} className="mt-2 h-16 w-28 rounded object-cover" />
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
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Enter the Article</span>
                <textarea
                  value={activeLecture.contentHtml ?? ""}
                  onChange={(event) => patchActiveLecture({ contentHtml: event.target.value })}
                  rows={10}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            ) : null}

            {(activeLecture.type ?? "VIDEO") === "QUIZ" ? (
              <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Quiz Builder</h3>

                <div className="space-y-3 rounded border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-700">Section A - Quiz Settings</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Passing Score (%)</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={quizConfig.passingScore}
                        onChange={(event) =>
                          setQuizConfig((prev) => ({ ...prev, passingScore: Number(event.target.value) }))
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Maximum Attempts</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={quizConfig.maxAttempts}
                        onChange={(event) =>
                          setQuizConfig((prev) => ({ ...prev, maxAttempts: Number(event.target.value) }))
                        }
                        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSaveQuizSettings()}
                    disabled={quizSaving}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {quizSaving ? "Saving..." : "Save Settings"}
                  </button>
                </div>

                {assessmentId ? (
                  <>
                    <div className="space-y-3 rounded border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700">Section B - Add Question</p>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Question Text</span>
                        <textarea
                          rows={3}
                          placeholder="Enter your question here..."
                          value={newQuestion.questionText}
                          onChange={(event) =>
                            setNewQuestion((prev) => ({ ...prev, questionText: event.target.value }))
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
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
                              : "border border-slate-300 text-slate-700"
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
                              : "border border-slate-300 text-slate-700"
                          }`}
                        >
                          TRUE / FALSE
                        </button>
                      </div>

                      {newQuestion.questionType === "MCQ" ? (
                        <div className="space-y-2">
                          {newQuestion.options.map((option, index) => (
                            <div key={`option-${index}`} className="flex items-center gap-2">
                              <span className="w-16 text-xs font-medium text-slate-600">{`Option ${
                                ["A", "B", "C", "D"][index]
                              }:`}</span>
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
                                className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
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
                              checked={newQuestion.correctAnswer === "True"}
                              onChange={() =>
                                setNewQuestion((prev) => ({
                                  ...prev,
                                  correctAnswer: "True",
                                }))
                              }
                            />
                            True
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="tf-correct-answer"
                              checked={newQuestion.correctAnswer === "False"}
                              onChange={() =>
                                setNewQuestion((prev) => ({
                                  ...prev,
                                  correctAnswer: "False",
                                }))
                              }
                            />
                            False
                          </label>
                        </div>
                      )}

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Points</span>
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
                          className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleAddQuestion()}
                        disabled={questionSaving}
                        className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {questionSaving ? "Adding..." : "Add Question"}
                      </button>
                    </div>

                    <div className="space-y-3 rounded border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700">Section C - Questions List</p>
                      <p className="text-xs text-slate-600">{questions.length} questions added</p>
                      {questions.length === 0 ? (
                        <p className="text-xs text-amber-700">⚠ Add at least 1 question before publishing</p>
                      ) : (
                        <ol className="space-y-2 text-sm text-slate-700">
                          {questions.map((question, index) => (
                            <li key={question.id} className="rounded border border-slate-200 p-2">
                              <p className="font-medium">
                                {index + 1}. {question.questionText}
                              </p>
                              <p className="text-xs text-slate-600">
                                Type: {question.questionType} | Points: {question.points}
                              </p>
                              <p className="text-xs text-slate-600">
                                Options:{" "}
                                {question.options.map((option, optionIndex) => {
                                  const label = ["A", "B", "C", "D"][optionIndex] ?? `${optionIndex + 1}`;
                                  return `${label}) ${option}`;
                                }).join(" | ")}
                              </p>
                              <p className="text-xs text-slate-600">Correct: {question.correctAnswer} ✅</p>
                              <button
                                type="button"
                                onClick={() => void handleDeleteQuestion(question.id)}
                                className="mt-1 text-xs text-rose-600 hover:underline"
                              >
                                Delete
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
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {savingLecture ? "Saving..." : "Save Lecture"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
