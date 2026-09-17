/**
 * ServerWakingScreen
 *
 * Shown when the backend (Render free tier) is sleeping and needs
 * 30–60 seconds to cold-start. Auto-dismisses once the server responds.
 */

import { useEffect, useState } from 'react'

export function ServerWakingScreen() {
  const [seconds, setSeconds] = useState(0)
  const [dots, setDots] = useState('.')

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {/* Animated server icon */}
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '1.25rem',
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.2rem',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        🖥️
      </div>

      <div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Server is waking up{dots}
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            maxWidth: '360px',
            lineHeight: 1.6,
          }}
        >
          The backend is hosted on{' '}
          <span style={{ color: '#60a5fa' }}>Render's free tier</span> and spins
          down after 15 minutes of inactivity. It usually takes{' '}
          <strong style={{ color: 'var(--text-primary)' }}>30–60 seconds</strong> to
          restart.
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '260px',
          height: '4px',
          borderRadius: '999px',
          background: 'rgba(148,163,184,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            animation: 'indeterminate 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Waiting{' '}
        <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {seconds}s
        </span>{' '}
        · Retrying automatically every 8 seconds
      </p>

      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-100%) scaleX(0.4); }
          50%  { transform: translateX(0%)    scaleX(0.6); }
          100% { transform: translateX(100%)  scaleX(0.4); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
