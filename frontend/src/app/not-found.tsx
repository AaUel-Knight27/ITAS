import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <span className="mb-6 text-8xl">404</span>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Page Not Found</h1>
      <p className="mb-6 max-w-sm text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
