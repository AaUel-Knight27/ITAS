"use client";

interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon = "No data", title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
      <span className="mb-4 text-3xl font-semibold text-gray-400">{icon}</span>
      <p className="text-lg font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
