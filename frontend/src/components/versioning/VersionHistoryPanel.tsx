"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { versionApi } from "@/lib/api";
import type { ContentVersionDto } from "@/lib/types";

interface Props {
  courseId: number;
  sectionId: number;
  lectureId: number;
  lectureTitle: string;
  lectureType: string;
  onVersionUploaded: () => void;
}

export default function VersionHistoryPanel({
  courseId,
  sectionId,
  lectureId,
  lectureTitle,
  lectureType,
  onVersionUploaded,
}: Props) {
  const [versions, setVersions] = useState<ContentVersionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeNotes, setChangeNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchHistory();
  }, [lectureId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await versionApi.getVersionHistory(courseId, sectionId, lectureId);
      setVersions(res.data);
    } catch {
      setError("Failed to load version history.");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      window.setTimeout(() => setError(""), 4000);
      return;
    }
    setSuccess(msg);
    window.setTimeout(() => setSuccess(""), 4000);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = lectureType === "VIDEO";
    const isPdf = lectureType === "PDF";

    if (isVideo) {
      const videoTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
      if (!videoTypes.includes(file.type)) {
        showMsg("Please select a video file (MP4, WebM, OGG)", true);
        return;
      }
    }

    if (isPdf && file.type !== "application/pdf") {
      showMsg("Please select a PDF file", true);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showMsg("Please select a file", true);
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await versionApi.uploadNewVersion(courseId, sectionId, lectureId, selectedFile, changeNotes);
      showMsg("New version uploaded successfully!");
      setShowUploadForm(false);
      setSelectedFile(null);
      setChangeNotes("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchHistory();
      onVersionUploaded();
    } catch {
      showMsg("Failed to upload new version. Please try again.", true);
    } finally {
      setUploading(false);
    }
  };

  const handleRollback = async (version: ContentVersionDto) => {
    if (version.isCurrent) return;

    if (
      !window.confirm(
        `Rollback to Version ${version.versionNumber}?\n\nThe lecture will use the file from ${new Date(
          version.createdAt
        ).toLocaleDateString()}.\nThis action can be reversed by rolling back to another version.`
      )
    ) {
      return;
    }

    setRollbackLoading(version.id);
    setError("");
    try {
      await versionApi.rollbackToVersion(courseId, sectionId, lectureId, version.id);
      showMsg(`Rolled back to Version ${version.versionNumber}`);
      await fetchHistory();
      onVersionUploaded();
    } catch {
      showMsg("Rollback failed. Try again.", true);
    } finally {
      setRollbackLoading(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const acceptAttr =
    lectureType === "VIDEO" ? "video/mp4,video/webm,video/ogg" : lectureType === "PDF" ? "application/pdf" : "*";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {lectureTitle} · {lectureType}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowUploadForm((prev) => !prev);
            setSelectedFile(null);
            setChangeNotes("");
            setError("");
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            showUploadForm ? "bg-gray-200 text-gray-700" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {showUploadForm ? "✕ Cancel" : "↑ Upload New Version"}
        </button>
      </div>

      {error ? <div className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div> : null}
      {success ? <div className="mx-5 mt-4 rounded-lg bg-green-50 px-4 py-2 text-xs text-green-700">{success}</div> : null}

      {showUploadForm ? (
        <div className="space-y-3 border-b border-gray-200 bg-blue-50 px-5 py-4">
          <p className="text-xs font-medium text-blue-800">
            Upload a new version of this {lectureType === "VIDEO" ? " video" : " PDF"}
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              selectedFile ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div className="text-blue-700">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="mt-0.5 text-xs text-blue-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <p className="text-sm">{lectureType === "VIDEO" ? "🎬 Click to select video" : "📄 Click to select PDF"}</p>
                <p className="mt-1 text-xs">{lectureType === "VIDEO" ? "MP4, WebM, OGG" : "PDF only"}</p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Change Notes (optional)</label>
            <textarea
              value={changeNotes}
              onChange={(event) => setChangeNotes(event.target.value)}
              rows={2}
              placeholder="What changed in this version?"
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!selectedFile || uploading}
            className="w-full rounded-lg bg-blue-600 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                Uploading...
              </span>
            ) : (
              `Upload as Version ${(versions[0]?.versionNumber || 0) + 1}`
            )}
          </button>
        </div>
      ) : null}

      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm font-medium">No version history yet</p>
            <p className="mt-1 text-xs">Upload a new version to start tracking changes</p>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className={`flex items-start justify-between gap-4 px-5 py-4 ${
                version.isCurrent ? "bg-green-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    version.isCurrent ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  v{version.versionNumber}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {version.isCurrent ? (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">Current</span>
                    ) : null}
                    {index === 0 && !version.isCurrent ? (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">Latest</span>
                    ) : null}
                  </div>

                  {version.changeNotes ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-800">{version.changeNotes}</p>
                  ) : (
                    <p className="mt-0.5 text-sm italic text-gray-400">No change notes</p>
                  )}

                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {new Date(version.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>by {version.uploadedByUsername}</span>
                    {version.fileSize ? <span>{formatFileSize(version.fileSize)}</span> : null}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {version.isCurrent ? (
                  <span className="text-xs font-medium text-green-600">✓ Active</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleRollback(version)}
                    disabled={rollbackLoading === version.id}
                    className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs text-orange-600 transition-colors hover:bg-orange-50 disabled:opacity-50"
                  >
                    {rollbackLoading === version.id ? "..." : "↩ Rollback"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {versions.length > 0 ? (
        <div className="flex justify-between border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-400">
          <span>
            {versions.length} version{versions.length !== 1 ? "s" : ""}
          </span>
          <span>Latest: v{versions[0]?.versionNumber}</span>
        </div>
      ) : null}
    </div>
  );
}
