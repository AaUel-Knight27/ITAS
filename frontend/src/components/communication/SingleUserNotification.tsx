"use client";

import { useEffect, useRef, useState } from "react";

import { communicationApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { SingleNotificationRequest, UserSearchDto } from "@/lib/types";

const ROLE_COLORS: Record<string, string> = {
  TAXPAYER: "bg-blue-100 text-blue-700",
  TAX_AGENT: "bg-cyan-100 text-cyan-700",
  MOR_STAFF: "bg-teal-100 text-teal-700",
  MANAGER: "bg-purple-100 text-purple-700",
  CONTENT_ADMIN: "bg-orange-100 text-orange-700",
  TRAINING_ADMIN: "bg-pink-100 text-pink-700",
  COMMUNICATION: "bg-yellow-100 text-yellow-700",
  WEB_ADMIN: "bg-red-100 text-red-700",
  SYSTEM_ADMIN: "bg-slate-200 text-slate-700",
};

function isSearchable(value: string) {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? trimmed.length >= 1 : trimmed.length >= 2;
}

export default function SingleUserNotification() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchDto[]>([]);
  const [selected, setSelected] = useState<UserSearchDto | null>(null);
  const [searching, setSearching] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentRecipient, setSentRecipient] = useState<UserSearchDto | null>(null);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearch = async (value: string) => {
    if (!isSearchable(value)) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const res = await communicationApi.searchUsers(value.trim(), 8);
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    if (selected) {
      setSelected(null);
    }
    setError("");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void handleSearch(value);
    }, 400);
  };

  const handleSelect = (user: UserSearchDto) => {
    setSelected(user);
    setQuery(user.fullName || user.username);
    setResults([]);
    setError("");
  };

  const resetForm = () => {
    setSelected(null);
    setQuery("");
    setSubject("");
    setMessage("");
    setResults([]);
  };

  const handleSend = async () => {
    if (!selected) {
      setError("Please select a recipient");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!message.trim()) {
      setError("Message is required");
      return;
    }

    setSending(true);
    setError("");

    const payload: SingleNotificationRequest = {
      subject: subject.trim(),
      message: message.trim(),
    };

    try {
      await communicationApi.sendSingleUserNotification(selected.id, payload);
      setSentRecipient(selected);
      resetForm();
      setTimeout(() => {
        setSentRecipient(null);
      }, 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (sentRecipient) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 text-5xl">✉️</div>
        <h3 className="mb-1 text-lg font-semibold text-green-600 dark:text-green-400">Email Sent!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Notification delivered to <strong>{sentRecipient.email}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Send to a Single User</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Search by name, username, email, or ID</p>
      </div>

      <div className="relative">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient *</label>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search users by name, username, email, or ID..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {searching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : null}
        </div>

        {results.length > 0 && !selected ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.fullName || user.username}
                      </p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          ROLE_COLORS[user.role] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.role.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      @{user.username} {" · "} {user.email}
                    </p>
                  </div>
                  <span className="ml-4 shrink-0 font-mono text-xs text-gray-400">#{user.id}</span>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {selected ? (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {(selected.fullName || selected.username).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {selected.fullName || selected.username}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {selected.email} {" · "} @{selected.username} {" · "} ID #{selected.id}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
              className="shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
        <input
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="e.g. Important update about your account"
          maxLength={200}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Message *</label>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your message here. The recipient's name will be included automatically."
          rows={5}
          maxLength={2000}
          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-400">{message.length}/2000 characters</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {selected && subject.trim() && message.trim() ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Preview</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>To:</strong> {selected.email}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Subject:</strong> [ITAS Portal] {subject}
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            <strong>Opening:</strong> Dear {selected.fullName || selected.username}, ...
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleSend()}
        disabled={sending || !selected || !subject.trim() || !message.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sending...
          </>
        ) : (
          <>✉️ Send Email Notification</>
        )}
      </button>
    </div>
  );
}
