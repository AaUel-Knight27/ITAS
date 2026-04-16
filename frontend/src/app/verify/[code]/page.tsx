import VerificationResultView from "@/components/verify/VerificationResultView";
import { API_BASE } from "@/lib/config";

type Props = {
  params: Promise<{ code: string }>;
};

type VerifyResult = {
  status: "VALID" | "INVALID";
  valid: boolean;
  recipientName?: string;
  courseName?: string;
  issueDate?: string;
  certificateCode?: string;
  verificationUuid?: string;
  message?: string;
};

async function fetchVerification(uuid: string): Promise<VerifyResult> {
  try {
    const endpoints = [
      `${API_BASE}/verify/${uuid}`,
      `${API_BASE}/lms/certificate/verify/${uuid}`,
    ];

    for (const endpoint of endpoints) {
      const res = await fetch(endpoint, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 404) {
        continue;
      }

      if (!res.ok) {
        return {
          status: "INVALID",
          valid: false,
          message: "Verification failed",
        };
      }

      const data = await res.json();

      return {
        status: data.status ?? "VALID",
        valid: data.valid ?? Boolean(data.certificateCode || data.verificationUuid),
        recipientName: data.recipientName ?? data.userFullName,
        courseName: data.courseName ?? data.courseTitle,
        issueDate: data.issueDate ?? data.issuedAt,
        certificateCode: data.certificateCode,
        verificationUuid: data.verificationUuid,
        message: data.message,
      };
    }

    return {
      status: "INVALID",
      valid: false,
      message: "Certificate not found",
    };
  } catch {
    return {
      status: "INVALID",
      valid: false,
      message: "Could not connect to verification server",
    };
  }
}

export default async function VerifyPage({ params }: Props) {
  const { code } = await params;
  const result = await fetchVerification(code);

  return <VerificationResultView result={result} uuid={code} />;
}
