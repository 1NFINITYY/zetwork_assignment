import { AlertTriangle } from 'lucide-react'

export const ErrorBanner = ({ message, onRetry }) => (
  <div
    className="rounded-xl p-4 flex items-start gap-3"
    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
  >
    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-red-400 font-medium text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-semibold text-red-300 hover:text-red-200 underline underline-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  </div>
)
