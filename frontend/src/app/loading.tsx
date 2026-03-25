import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" color="blue" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
