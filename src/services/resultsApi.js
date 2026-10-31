const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof process !== 'undefined' && process.env) || {}

export const API_BASE_URL = (env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')

const DEFAULT_REALTIME_URL = 'https://placar-corrida-rua-backend.onrender.com'
const configuredRealtimeUrl = (
  env.VITE_REALTIME_URL ||
  API_BASE_URL ||
  DEFAULT_REALTIME_URL
).trim().replace(/\/+$/, '')

export const REALTIME_URL = (() => {
  try {
    const url = new URL(configuredRealtimeUrl)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString().replace(/\/+$/, '') : ''
  } catch {
    return ''
  }
})()

export const EVENT_SLUG = (
  env.VITE_EVENT_SLUG ||
  'corrida'
).trim()

export function buildApiUrl(path) {
  const base =
    API_BASE_URL ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost/5174')
  return new URL(path, base)
}

async function requestJson(url, signal) {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })
  const body = await response.text()
  let payload

  if (body) {
    try {
      payload = JSON.parse(body)
    } catch {
      if (response.ok) {
        throw new Error('A API retornou uma resposta que não está em JSON válido.')
      }
    }
  }

  if (!response.ok) {
    throw new Error(
      payload?.error || `A consulta à API falhou (HTTP ${response.status}).`,
    )
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('A API retornou uma resposta vazia ou inválida.')
  }

  return payload
}

export async function fetchResults({
  page = 1,
  limit = 50,
  gender = '',
  category = '',
  search = '',
  eventSlug = EVENT_SLUG,
  signal,
}) {
  const url = buildApiUrl('/api/results')
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 100)))

  if (gender) url.searchParams.set('gender', gender)
  if (category) url.searchParams.set('category', category)
  if (search) url.searchParams.set('search', search)
  if (eventSlug) url.searchParams.set('event_slug', eventSlug)

  const payload = await requestJson(url.toString(), signal)

  if (!Array.isArray(payload.results)) {
    throw new Error('A resposta da API não contém uma lista de resultados válida.')
  }

  return payload
}

export async function fetchParticipant(bibNumber, signal, eventSlug = EVENT_SLUG) {
  const url = buildApiUrl(`/api/results/${encodeURIComponent(bibNumber)}`)
  if (eventSlug) url.searchParams.set('event_slug', eventSlug)
  return requestJson(url.toString(), signal)
}
