import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  onClick?: () => void;
  clickable?: boolean;
}

export default function StatCard({
  label,
  value,
  icon,
  color,
  onClick,
  clickable,
}: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all ${
        clickable ? "cursor-pointer hover:border-blue-300 hover:shadow-md active:scale-95" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
      {clickable && <p className="mt-2 text-xs font-medium text-blue-500">Click to view →</p>}
    </div>
  );
}
