import type { ReactNode } from 'react'
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Hash,
  Shield,
  User,
  XCircle,
} from 'lucide-react'
import { API_BASE } from '@/lib/config'

type Props = {
  params: Promise<{ code: string }>
}

type VerifyResult = {
  status: 'VALID' | 'INVALID'
  valid: boolean
  recipientName?: string
  courseName?: string
  issueDate?: string
  certificateCode?: string
  verificationUuid?: string
  message?: string
}

async function fetchVerification(uuid: string): Promise<VerifyResult> {
  try {
    const endpoints = [
      `${API_BASE}/verify/${uuid}`,
      `${API_BASE}/lms/certificate/verify/${uuid}`,
    ]

    for (const endpoint of endpoints) {
      const res = await fetch(endpoint, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.status === 404) {
        continue
      }

      if (!res.ok) {
        return {
          status: 'INVALID',
          valid: false,
          message: 'Verification failed',
        }
      }

      const data = await res.json()

      return {
        status: data.status ?? 'VALID',
        valid:
          data.valid ??
          Boolean(
            data.certificateCode ||
            data.verificationUuid,
          ),
        recipientName:
          data.recipientName ??
          data.userFullName,
        courseName:
          data.courseName ??
          data.courseTitle,
        issueDate:
          data.issueDate ??
          data.issuedAt,
        certificateCode:
          data.certificateCode,
        verificationUuid:
          data.verificationUuid,
        message: data.message,
      }
    }

    return {
      status: 'INVALID',
      valid: false,
      message: 'Certificate not found',
    }
  } catch {
    return {
      status: 'INVALID',
      valid: false,
      message: 'Could not connect to verification server',
    }
  }
}

function formatDate(value?: string) {
  if (!value) return 'N/A'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

export default async function VerifyPage({ params }: Props) {
  const { code } = await params
  const uuid = code
  const result = await fetchVerification(uuid)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-900">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Certificate Verification
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ministry of Revenue — Taxpayer Education Portal
          </p>
        </div>

        {result.valid ? (
          <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-lg">
            <div className="bg-emerald-600 px-8 py-6 text-center">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Verified ✓</h2>
              <p className="mt-1 text-sm text-emerald-100">
                This certificate is authentic
              </p>
            </div>

            <div className="px-8 py-6">
              <div className="space-y-4">
                <DetailRow
                  icon={<User className="h-4 w-4" />}
                  label="Recipient"
                  value={result.recipientName || 'N/A'}
                  large
                />

                <div className="border-t border-slate-100" />

                <DetailRow
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Course"
                  value={result.courseName || 'N/A'}
                />

                <DetailRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date Issued"
                  value={formatDate(result.issueDate)}
                />

                <DetailRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Certificate No."
                  value={result.certificateCode || 'N/A'}
                  mono
                />
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Issued by
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      Ministry of Revenue
                    </p>
                    <p className="text-xs text-slate-500">
                      Taxpayer Education Portal
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      VALID
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-lg">
            <div className="bg-rose-600 px-8 py-6 text-center">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <XCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Not Verified</h2>
              <p className="mt-1 text-sm text-rose-100">
                This certificate could not be verified
              </p>
            </div>

            <div className="px-8 py-6 text-center">
              <p className="mb-2 text-sm text-slate-600">
                {result.message ||
                  'The certificate code is invalid or does not exist.'}
              </p>
              <p className="text-xs text-slate-400">
                If you believe this is an error, please contact the Ministry of
                Revenue.
              </p>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Verification ID: <span className="font-mono">{uuid}</span>
        </p>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
  large = false,
  mono = false,
}: {
  icon: ReactNode
  label: string
  value: string
  large?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-slate-400">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p
          className={`mt-0.5 text-slate-800 ${
            large ? 'text-xl font-bold' : 'text-sm font-medium'
          } ${mono ? 'font-mono' : ''}`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
