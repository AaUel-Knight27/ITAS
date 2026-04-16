import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { API_BASE, STORAGE_BASE } from "@/lib/config";

const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-disposition",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
];

function isAllowedMediaUrl(url: URL) {
  return url.href.startsWith(`${API_BASE}/`) || url.href.startsWith(`${STORAGE_BASE}/`);
}

async function handleMediaRequest(request: NextRequest, method: "GET" | "HEAD") {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ message: "Missing src parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(src);
  } catch {
    return NextResponse.json({ message: "Invalid src parameter" }, { status: 400 });
  }

  if (!isAllowedMediaUrl(targetUrl)) {
    return NextResponse.json({ message: "Unsupported media source" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as any)?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${accessToken}`);

  const range = request.headers.get("range");
  if (range) {
    headers.set("Range", range);
  }

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    redirect: "follow",
  });

  const responseHeaders = new Headers();
  FORWARDED_RESPONSE_HEADERS.forEach((header) => {
    const value = upstream.headers.get(header);
    if (value) {
      responseHeaders.set(header, value);
    }
  });

  return new NextResponse(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest) {
  return handleMediaRequest(request, "GET");
}

export async function HEAD(request: NextRequest) {
  return handleMediaRequest(request, "HEAD");
}
