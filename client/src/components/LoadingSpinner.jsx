export const LoadingSpinner = ({ size = 'md', message = '' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-2 border-transparent`}
        style={{ borderTopColor: '#3b82f6', borderRightColor: 'rgba(59,130,246,0.3)' }}
      />
      {message && <p style={{ color: 'var(--text-muted)' }} className="text-sm">{message}</p>}
    </div>
  )
}
