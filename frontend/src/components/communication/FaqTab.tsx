"use client";

import { useEffect, useState } from "react";

import { communicationApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { FaqDto, FaqRequest } from "@/lib/types";

const CATEGORIES = ["General", "Tax Filing", "VAT", "Certificates", "Technical"];

export default function FaqTab() {
  const [faqs, setFaqs] = useState<FaqDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFaq, setEditFaq] = useState<FaqDto | null>(null);
  const [form, setForm] = useState<FaqRequest>({
    question: "",
    answer: "",
    category: "General",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await communicationApi.getAllFaqs();
      setFaqs(res.data);
    } catch {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditFaq(null);
    setForm({ question: "", answer: "", category: "General" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (faq: FaqDto) => {
    setEditFaq(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.question.trim()) {
      setError("Question is required");
      return;
    }
    if (!form.answer.trim()) {
      setError("Answer is required");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (editFaq) {
        await communicationApi.updateFaq(editFaq.id, form);
      } else {
        await communicationApi.createFaq(form);
      }
      setModalOpen(false);
      await fetchFaqs();
    } catch (error) {
      setError(getErrorMessage(error) || "Could not save FAQ. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      await communicationApi.deleteFaq(id);
      await fetchFaqs();
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add FAQ
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No FAQs yet. Click "Add FAQ" to create one.</div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {faq.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{faq.answer}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(faq)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(faq.id)}
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
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">{editFaq ? "Edit FAQ" : "Add FAQ"}</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                x
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              {error ? <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter question..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Answer</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter answer..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : editFaq ? "Save Changes" : "Add FAQ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
