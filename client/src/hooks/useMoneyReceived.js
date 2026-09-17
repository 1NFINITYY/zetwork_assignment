import { useEffect, useRef, useCallback } from 'react'
import { useSocket } from '../context/useSocket'

const MONEY_RECEIVED = 'money_received'

/**
 * useMoneyReceived
 *
 * Subscribes to the money_received socket event.
 * Calls onReceived(payload) when a new unique event arrives.
 *
 * Deduplication (spec §17): tracks seen transactionIds in a Set.
 * If the same event is received twice, onReceived is NOT called again.
 */
export function useMoneyReceived(onReceived) {
  const { socket } = useSocket()
  const seenIds = useRef(new Set())
  const onReceivedRef = useRef(onReceived)

  // Keep the callback ref fresh without re-registering the socket listener
  useEffect(() => {
    onReceivedRef.current = onReceived
  }, [onReceived])

  useEffect(() => {
    if (!socket) return

    const handler = (payload) => {
      const { transactionId } = payload

      // Deduplicate (spec §17)
      if (seenIds.current.has(transactionId)) return
      seenIds.current.add(transactionId)

      onReceivedRef.current(payload)
    }

    socket.on(MONEY_RECEIVED, handler)
    return () => {
      socket.off(MONEY_RECEIVED, handler)
    }
  }, [socket])
}
