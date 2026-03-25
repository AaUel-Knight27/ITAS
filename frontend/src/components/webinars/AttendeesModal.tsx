"use client";

import { useEffect, useState } from "react";

import { webinarApi } from "@/lib/api";
import type { AttendeeDto } from "@/lib/types";

interface Props {
  webinarId: number | null;
  webinarTitle: string;
  onClose: () => void;
}

export default function AttendeesModal({ webinarId, webinarTitle, onClose }: Props) {
  const [attendees, setAttendees] = useState<AttendeeDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!webinarId) return;

    setLoading(true);
    void webinarApi
      .getAttendees(webinarId)
      .then((res) => setAttendees(res.data))
      .catch(() => setAttendees([]))
      .finally(() => setLoading(false));
  }, [webinarId]);

  if (!webinarId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Attendees</h2>
            <p className="text-sm text-gray-500">{webinarTitle}</p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            x
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : attendees.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No registered attendees yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendees.map((attendee) => (
                  <tr key={attendee.userId} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{attendee.fullName || attendee.username}</td>
                    <td className="py-2 text-gray-500">{attendee.email}</td>
                    <td className="py-2 text-xs text-gray-400">
                      {new Date(attendee.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <span className="text-sm text-gray-500">{attendees.length} registered</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
