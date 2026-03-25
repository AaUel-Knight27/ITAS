"use client";

import { useEffect, useState } from "react";
import { Bell, HelpCircle, MessageSquare, Send, Plus, Clock } from "lucide-react";

import { getFaqs, createFaq, type Faq } from "@/lib/api/faqs";
import { getNotifications, sendNotification, type NotificationLog } from "@/lib/api/notifications";
import { getResponses, replyToResponse, type SupportResponse } from "@/lib/api/responses";
import { getErrorMessage } from "@/lib/errors";
import { useUIStore } from "@/lib/store";

const audienceOptions = ["TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"];

export default function CommunicationAdminDashboard() {
  const { showToast } = useUIStore();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [responses, setResponses] = useState<SupportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [notificationForm, setNotificationForm] = useState({
    subject: "",
    message: "",
    scheduleAt: "",
    audienceRoles: ["TAXPAYER"],
  });

  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "General" });
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setIsLoading(true);
        const [notificationsData, faqData, responseData] = await Promise.all([
          getNotifications(),
          getFaqs(),
          getResponses(),
        ]);
        if (!active) return;
        setNotifications(notificationsData);
        setFaqs(faqData);
        setResponses(responseData);
      } catch {
        if (!active) return;
        showToast("Failed to load communications data.", "error");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [showToast]);

  async function handleSendNotification() {
    if (!notificationForm.subject.trim() || !notificationForm.message.trim()) {
      showToast("Subject and message are required.", "error");
      return;
    }
    try {
      const sent = await sendNotification({
        subject: notificationForm.subject,
        message: notificationForm.message,
        channel: "EMAIL",
        audienceRoles: notificationForm.audienceRoles,
        scheduleAt: notificationForm.scheduleAt || undefined,
      });
      setNotifications((prev) => [sent, ...prev]);
      showToast("Notification queued successfully.", "success");
      setNotificationForm((prev) => ({ ...prev, subject: "", message: "" }));
    } catch (error) {
      showToast(getErrorMessage(error) || "Could not send notification. Please try again.", "error");
    }
  }

  async function handleCreateFaq() {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      showToast("FAQ question and answer are required.", "error");
      return;
    }
    try {
      const created = await createFaq({
        question: faqForm.question,
        answer: faqForm.answer,
        category: faqForm.category,
      });
      setFaqs((prev) => [created, ...prev]);
      showToast("FAQ published.", "success");
      setFaqForm({ question: "", answer: "", category: "General" });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  async function handleReply(responseId: number | string) {
    const message = replyMap[String(responseId)]?.trim();
    if (!message) {
      showToast("Reply message is required.", "error");
      return;
    }
    try {
      const updated = await replyToResponse({ responseId, message });
      setResponses((prev) => prev.map((item) => (item.id === responseId ? updated : item)));
      setReplyMap((prev) => ({ ...prev, [String(responseId)]: "" }));
      showToast("Response sent.", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 lg:p-8" id="communications">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Communications Center</h1>
            <p className="mt-1 text-muted-foreground">
              Manage notifications, FAQs, and support responses.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{notifications.length} sent</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{responses.filter((r) => r.status === "OPEN").length} open</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Notification Management */}
          <section className="rounded-xl border border-border bg-card shadow-soft">
            <div className="border-b border-border p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                <Bell className="h-5 w-5 text-primary" />
                Send Notification
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Subject</label>
                <input
                  value={notificationForm.subject}
                  onChange={(event) => setNotificationForm((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Notification subject"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Message</label>
                <textarea
                  value={notificationForm.message}
                  onChange={(event) => setNotificationForm((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Your message"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {audienceOptions.map((role) => {
                    const selected = notificationForm.audienceRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setNotificationForm((prev) => ({
                            ...prev,
                            audienceRoles: selected
                              ? prev.audienceRoles.filter((item) => item !== role)
                              : [...prev.audienceRoles, role],
                          }))
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                        }`}
                      >
                        {role.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Schedule (optional)</label>
                <input
                  value={notificationForm.scheduleAt}
                  onChange={(event) => setNotificationForm((prev) => ({ ...prev, scheduleAt: event.target.value }))}
                  type="datetime-local"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleSendNotification()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
                Send Notification
              </button>
            </div>

            {/* Recent Notifications */}
            {notifications.length > 0 && (
              <div className="border-t border-border p-5">
                <h3 className="mb-3 text-sm font-semibold text-card-foreground">Recent Notifications</h3>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notification) => (
                    <article key={notification.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-card-foreground">{notification.subject}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          notification.status === "Sent" ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"
                        }`}>
                          {notification.status ?? "Queued"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{notification.message}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="space-y-6">
            {/* FAQ Management */}
            <section className="rounded-xl border border-border bg-card shadow-soft">
              <div className="border-b border-border p-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  FAQ Management
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">Question</label>
                  <input
                    value={faqForm.question}
                    onChange={(event) => setFaqForm((prev) => ({ ...prev, question: event.target.value }))}
                    placeholder="Frequently asked question"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">Answer</label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(event) => setFaqForm((prev) => ({ ...prev, answer: event.target.value }))}
                    placeholder="Answer"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">Category</label>
                  <input
                    value={faqForm.category}
                    onChange={(event) => setFaqForm((prev) => ({ ...prev, category: event.target.value }))}
                    placeholder="Category"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateFaq()}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border font-medium text-card-foreground transition-colors hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  Publish FAQ
                </button>
              </div>
              {faqs.length > 0 && (
                <div className="border-t border-border p-5">
                  <div className="space-y-2">
                    {faqs.slice(0, 2).map((faq) => (
                      <article key={faq.id} className="rounded-lg border border-border p-3">
                        <p className="font-medium text-card-foreground">{faq.question}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{faq.answer}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Support Responses */}
            <section className="rounded-xl border border-border bg-card shadow-soft">
              <div className="border-b border-border p-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Support Tickets
                </h2>
              </div>
              <div className="p-5">
                {responses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No support tickets.</p>
                ) : (
                  <div className="space-y-3">
                    {responses.slice(0, 3).map((response) => (
                      <article key={response.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-card-foreground">{response.requesterName}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            response.status === "OPEN" ? "bg-warning/10 text-warning-foreground" : "bg-success/10 text-success"
                          }`}>
                            {response.status ?? "OPEN"}
                          </span>
                        </div>
                        <p className="mt-2 font-medium text-card-foreground">{response.subject}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{response.message}</p>
                        <div className="mt-3">
                          <textarea
                            value={replyMap[String(response.id)] ?? ""}
                            onChange={(event) => setReplyMap((prev) => ({ ...prev, [String(response.id)]: event.target.value }))}
                            placeholder="Write your response..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                            rows={2}
                          />
                          <button
                            type="button"
                            onClick={() => void handleReply(response.id)}
                            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <Send className="h-3 w-3" />
                            Reply
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
