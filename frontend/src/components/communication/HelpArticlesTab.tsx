"use client";

import { useEffect, useState } from "react";

import { helpApi, type HelpArticleRequest } from "@/lib/api";
import type { HelpArticleDto } from "@/lib/types";

const PAGE_IDS = ["course-builder", "quiz-builder", "webinar-form", "certificates", "profile", "general"];

const CATEGORIES = ["Course Builder", "Quiz", "Webinar", "Certificates", "Profile", "General"];

export default function HelpArticlesTab() {
  const [articles, setArticles] = useState<HelpArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<HelpArticleDto | null>(null);
  const [form, setForm] = useState<HelpArticleRequest>({
    title: "",
    content: "",
    pageId: "",
    fieldId: "",
    category: "",
    tags: "",
    isPublished: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterPage, setFilterPage] = useState("");

  useEffect(() => {
    void fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await helpApi.getAllAdmin();
      setArticles(res.data);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditArticle(null);
    setForm({
      title: "",
      content: "",
      pageId: "",
      fieldId: "",
      category: "",
      tags: "",
      isPublished: true,
    });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (article: HelpArticleDto) => {
    setEditArticle(article);
    setForm({
      title: article.title,
      content: article.content,
      pageId: article.pageId || "",
      fieldId: article.fieldId || "",
      category: article.category || "",
      tags: article.tags || "",
      isPublished: article.isPublished,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title?.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.content?.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (editArticle) {
        await helpApi.update(editArticle.id, form);
      } else {
        await helpApi.create(form);
      }
      setModalOpen(false);
      await fetchArticles();
    } catch {
      setError("Failed to save article.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await helpApi.toggle(id);
      await fetchArticles();
    } catch {
      window.alert("Failed to toggle article.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this help article?")) return;
    try {
      await helpApi.delete(id);
      await fetchArticles();
    } catch {
      window.alert("Failed to delete article.");
    }
  };

  const filtered = filterPage ? articles.filter((article) => article.pageId === filterPage) : articles;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={filterPage}
          onChange={(event) => setFilterPage(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Pages</option>
          {PAGE_IDS.map((page) => (
            <option key={page} value={page}>
              {page.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Help Article
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No help articles yet</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <div key={article.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {article.pageId ? (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        {article.pageId}
                      </span>
                    ) : null}
                    {article.fieldId ? (
                      <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-600">
                        #{article.fieldId}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        article.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {article.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{article.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{article.content}</p>
                  <p className="mt-1 text-xs text-gray-400">👁 {article.viewCount} views</p>
                </div>
                <div className="shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(article)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggle(article.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      article.isPublished
                        ? "border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                        : "border-green-200 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {article.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(article.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="font-semibold text-gray-900">{editArticle ? "Edit Help Article" : "Add Help Article"}</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              {error ? <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  value={form.title ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Help article title"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Content *</label>
                <textarea
                  value={form.content ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Help content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Page ID</label>
                  <select
                    value={form.pageId ?? ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, pageId: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select page...</option>
                    {PAGE_IDS.map((page) => (
                      <option key={page} value={page}>
                        {page}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Field ID</label>
                  <input
                    type="text"
                    value={form.fieldId ?? ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, fieldId: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={form.category ?? ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tags</label>
                  <input
                    type="text"
                    value={form.tags ?? ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="vat,filing,..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={Boolean(form.isPublished)}
                  onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="isPublished" className="cursor-pointer text-sm text-gray-700">
                  Published (visible to users)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : editArticle ? "Save Changes" : "Add Article"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
