import test from 'node:test'
import assert from 'node:assert/strict'
import { createResultsRealtime } from './resultsRealtime.js'

function createFakeSocket() {
  const listeners = new Map()
  const emitted = []

  return {
    emitted,
    on(event, listener) {
      listeners.set(event, listener)
    },
    off(event, listener) {
      if (listeners.get(event) === listener) listeners.delete(event)
    },
    emit(event, ...args) {
      emitted.push({ event, args })
    },
    disconnect() {
      this.disconnected = true
    },
    trigger(event, ...args) {
      listeners.get(event)?.(...args)
    },
  }
}

test('subscribes after connect and refreshes on result notifications', () => {
  const socket = createFakeSocket()
  let refreshes = 0
  const realtime = createResultsRealtime({
    url: 'https://example.com',
    eventSlug: 'corrida-demonstracao-mvp',
    socketFactory: () => socket,
    onRefresh: () => {
      refreshes += 1
    },
  })

  realtime.start()
  socket.trigger('connect')
  const subscription = socket.emitted[0]
  assert.equal(subscription.event, 'subscribe')
  assert.deepEqual(subscription.args[0], { event_slug: 'corrida-demonstracao-mvp' })
  subscription.args[1]({ subscribed: true, room: 'results:corrida' })
  socket.trigger('results.updated', {})
  socket.trigger('results.reset')
  assert.equal(refreshes, 2)
})

test('reports invalid subscription acknowledgments and cleans up', () => {
  const socket = createFakeSocket()
  const errors = []
  const realtime = createResultsRealtime({
    url: 'https://example.com',
    eventSlug: 'event',
    socketFactory: () => socket,
    onError: (error) => errors.push(error),
  })

  realtime.start()
  socket.trigger('connect')
  socket.emitted[0].args[1]({ ok: false })
  realtime.stop()
  socket.trigger('results.updated', {})

  assert.equal(errors.length, 1)
  assert.equal(socket.disconnected, true)
})
