import { ChevronLeft, ChevronRight } from 'lucide-react'

export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null

  const { page, totalPages, total, hasNextPage, hasPrevPage } = pagination

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (i === page - 2 || i === page + 2) {
      pages.push('...')
    }
  }

  // Deduplicate '...'
  const deduped = pages.filter((p, idx) => p !== '...' || pages[idx - 1] !== '...')

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Showing page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="btn-ghost text-sm px-2.5 py-1.5 disabled:opacity-30 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        {deduped.map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} style={{ color: 'var(--text-muted)' }} className="text-sm px-1">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={p === page ? 'btn-primary text-sm px-3 py-1.5' : 'btn-ghost text-sm px-3 py-1.5'}
              style={p === page ? { width: 'auto' } : {}}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="btn-ghost text-sm px-2.5 py-1.5 disabled:opacity-30 flex items-center gap-1"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
