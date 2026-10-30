import { io } from 'socket.io-client'

const REFRESH_EVENTS = ['results.snapshot', 'results.updated', 'results.reset']

function isValidPayload(payload) {
  return payload === undefined || (payload !== null && typeof payload === 'object')
}

function isPositiveAcknowledgment(response) {
  return response === true || response?.ok === true
}

export function createResultsRealtime({
  url,
  eventSlug,
  onRefresh,
  onError = () => {},
  socketFactory = io,
  ackTimeoutMs = 5000,
}) {
  let socket
  let stopped = false
  let subscriptionTimer

  const reportError = (error) => {
    if (!stopped) onError(error instanceof Error ? error : new Error(String(error)))
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

  const handleNotification = (payload) => {
    if (!isValidPayload(payload)) {
      reportError(new Error('O evento realtime recebeu um payload inválido.'))
      return
    }

    onRefresh()
  }

  const listeners = {
    connect: subscribe,
    connect_error: (error) => reportError(error || new Error('Falha na conexão realtime.')),
    disconnect: (reason) => reportError(new Error(`Conexão realtime encerrada: ${reason || 'desconhecido'}.`)),
  }

  for (const eventName of REFRESH_EVENTS) {
    listeners[eventName] = handleNotification
  }

  return {
    start() {
      if (socket || !url || !eventSlug) return

      stopped = false
      socket = socketFactory(url, { transports: ['websocket'] })
      Object.entries(listeners).forEach(([eventName, listener]) => {
        socket.on(eventName, listener)
      })
    },
    stop() {
      if (!socket) return

      stopped = true
      clearTimeout(subscriptionTimer)
      Object.entries(listeners).forEach(([eventName, listener]) => {
        socket.off(eventName, listener)
      })
      socket.disconnect()
      socket = undefined
    },
  }
}
