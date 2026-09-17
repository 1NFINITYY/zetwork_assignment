import { useContext } from 'react'
import { ServerStatusContext } from './ServerStatusContext'

export function useServerStatus() {
  const ctx = useContext(ServerStatusContext)
  if (!ctx) throw new Error('useServerStatus must be inside ServerStatusProvider')
  return ctx
}
