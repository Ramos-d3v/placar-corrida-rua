import { io } from 'socket.io-client'

const REFRESH_EVENTS = ['results.snapshot', 'results.updated', 'results.reset']

function isValidPayload(payload) {
  return payload === undefined || (payload !== null && typeof payload === 'object')
}

function isPositiveAcknowledgment(response) {
  return response === true || response?.ok === true || response?.subscribed === true
}

export function createResultsRealtime({
  url,
  eventSlug,
  onRefresh = () => {},
  onAthleteUpdated = () => {},
  onStatusChange = () => {},
  onError = () => {},
  socketFactory = io,
  ackTimeoutMs = 5000,
}) {
  let socket
  let stopped = false
  let subscriptionTimer

  const reportError = (error) => {
    if (!stopped) {
      onStatusChange('error')
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  const subscribe = () => {
    if (stopped || !socket) return

    clearTimeout(subscriptionTimer)
    let acknowledged = false
    subscriptionTimer = setTimeout(() => {
      if (!acknowledged) reportError(new Error('A inscrição realtime expirou.'))
    }, ackTimeoutMs)

    socket.emit('subscribe', { event_slug: eventSlug }, (response) => {
      acknowledged = true
      clearTimeout(subscriptionTimer)
      if (!isPositiveAcknowledgment(response)) {
        reportError(new Error('O backend recusou a inscrição realtime.'))
      }
    })
  }

  const handleNotification = (payload, eventName) => {
    if (!isValidPayload(payload)) {
      reportError(new Error('O evento realtime recebeu um payload inválido.'))
      return
    }

    onRefresh(payload, eventName)
  }

  const handleAthleteUpdated = (payload) => {
    if (!isValidPayload(payload)) {
      reportError(new Error('O evento athlete.updated recebeu um payload inválido.'))
      return
    }

    onAthleteUpdated(payload)
    onRefresh(payload, 'athlete.updated')
  }

  const listeners = {
    connect: () => {
      onStatusChange('connected')
      subscribe()
    },
    connect_error: (error) => {
      reportError(error || new Error('Falha na conexão realtime.'))
    },
    disconnect: (reason) => {
      if (!stopped) onStatusChange('disconnected')
      reportError(new Error(`Conexão realtime encerrada: ${reason || 'desconhecido'}.`))
    },
    'athlete.updated': handleAthleteUpdated,
    'results.pending': (payload) => {
      if (isValidPayload(payload)) {
        onRefresh(payload, 'results.pending')
      }
    },
  }

  for (const eventName of REFRESH_EVENTS) {
    listeners[eventName] = (payload) => handleNotification(payload, eventName)
  }

  return {
    start() {
      if (socket || !url || !eventSlug) return

      stopped = false
      onStatusChange('connecting')
      socket = socketFactory(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      })
      Object.entries(listeners).forEach(([eventName, listener]) => {
        socket.on(eventName, listener)
      })
    },
    stop() {
      if (!socket) return

      stopped = true
      onStatusChange('disconnected')
      clearTimeout(subscriptionTimer)
      Object.entries(listeners).forEach(([eventName, listener]) => {
        socket.off(eventName, listener)
      })

      const targetSocket = socket
      socket = undefined

      if (
        typeof targetSocket.connected === 'boolean' &&
        !targetSocket.connected &&
        typeof targetSocket.once === 'function'
      ) {
        const timer = setTimeout(() => {
          try {
            targetSocket.disconnect()
          } catch {
            // ignore
          }
        }, 1000)

        targetSocket.once('connect', () => {
          clearTimeout(timer)
          try {
            targetSocket.disconnect()
          } catch {
            // ignore
          }
        })

        targetSocket.once('connect_error', () => {
          clearTimeout(timer)
          try {
            targetSocket.disconnect()
          } catch {
            // ignore
          }
        })
      } else {
        targetSocket.disconnect()
      }
    },
    getSocket() {
      return socket
    },
  }
}
