import { Button } from '@/components/ui/Button'

interface Props {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  secondaryAction,
}: Props) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 text-5xl animate-bounce-slow">
        {icon}
      </div>

      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {description ? (
        <p className="mb-6 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      ) : null}

      {action ? (
        <div className="flex w-full flex-col gap-2">
          <Button
            onClick={action.onClick}
            variant="primary"
            size="md"
          >
            {action.label}
          </Button>
          {secondaryAction ? (
            <Button
              onClick={secondaryAction.onClick}
              variant="secondary"
              size="md"
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
