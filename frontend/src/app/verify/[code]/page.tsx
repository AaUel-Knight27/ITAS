import { CheckCircle2, XCircle } from "lucide-react";
import { API_BASE } from "@/lib/config";

type VerifyPageProps = {
  params: { code: string };
};

type VerifyPayload = {
  valid?: boolean;
  code?: string;
  learnerName?: string;
  courseName?: string;
  issuedAt?: string;
  data?: {
    valid?: boolean;
    code?: string;
    learnerName?: string;
    courseName?: string;
    issuedAt?: string;
  };
};

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { code } = params;

  let payload: VerifyPayload | null = null;
  let isValid = false;

  try {
    const response = await fetch(`${API_BASE}/lms/certificate/verify/${code}`, {
      method: "GET",
      cache: "no-store",
    });

    if (response.ok) {
      const json = (await response.json()) as VerifyPayload;
      payload = json.data ?? json;
      isValid = Boolean(payload.valid ?? true);
    }
  } catch {
    isValid = false;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {isValid && payload ? (
          <div>
            <div className="mb-4 flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
              <h1 className="text-2xl font-semibold text-slate-900">Certificate Verified</h1>
            </div>
            <p className="text-slate-600">This certificate is authentic and was issued by the LMS.</p>

            <dl className="mt-6 space-y-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Learner</dt>
                <dd className="text-slate-900">{payload.learnerName ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Course</dt>
                <dd className="text-slate-900">{payload.courseName ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Issued Date</dt>
                <dd className="text-slate-900">{formatDate(payload.issuedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Certificate Code</dt>
                <dd className="font-mono text-slate-900">{payload.code ?? code}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-2 text-rose-600">
              <XCircle className="h-7 w-7" />
              <h1 className="text-2xl font-semibold text-slate-900">Certificate not found</h1>
            </div>
            <p className="text-slate-600">The certificate code is invalid or could not be verified.</p>
          </div>
        )}
      </section>
    </main>
  );
}
