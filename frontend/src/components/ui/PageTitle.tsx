import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageTitle({ title, description, action }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
