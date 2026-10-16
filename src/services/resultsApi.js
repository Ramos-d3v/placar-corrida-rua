const DEFAULT_API_BASE_URL = 'https://placar-corrida-rua-backend.onrender.com'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

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
  signal,
}) {
  const url = new URL(`${API_BASE_URL}/api/results`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 100)))

  if (gender) url.searchParams.set('gender', gender)
  if (category) url.searchParams.set('category', category)
  if (search) url.searchParams.set('search', search)

  const payload = await requestJson(url, signal)

  if (!Array.isArray(payload.results)) {
    throw new Error('A resposta da API não contém uma lista de resultados válida.')
  }

  return payload
}

export async function fetchParticipant(bibNumber, signal) {
  const url = `${API_BASE_URL}/api/results/${encodeURIComponent(bibNumber)}`
  return requestJson(url, signal)
}
