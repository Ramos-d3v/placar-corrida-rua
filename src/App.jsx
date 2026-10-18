import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  API_BASE_URL,
  fetchParticipant,
  fetchResults,
} from './services/resultsApi.js'

const PAGE_SIZE = 50
const AGE_CATEGORIES = [
  '15-19',
  '20-24',
  '25-29',
  '30-34',
  '35-39',
  '40-44',
  '45-49',
  '50-54',
  '55-59',
  '60-64',
  '65+',
]
const GENDER_TABS = [
  { id: 'feminino', label: 'Feminino', gender: 'FEMININO' },
  { id: 'masculino', label: 'Masculino', gender: 'MASCULINO' },
]
const CATEGORY_OPTIONS = [
  { prefix: 'F', gender: 'Feminino', genderTab: 'feminino' },
  { prefix: 'M', gender: 'Masculino', genderTab: 'masculino' },
].flatMap(({ prefix, gender, genderTab }) =>
  AGE_CATEGORIES.map((age) => ({
    value: `${prefix}${age}`,
    label: `${gender} · ${age.replace('-', '–')} anos`,
    genderTab,
  })),
)

function getBibFromPath() {
  const match = window.location.pathname.match(/^\/resultados\/([^/]+)\/?$/)
  if (!match) return ''

  try {
    return decodeURIComponent(match[1])
  } catch {
    return ''
  }
}

function formatTime(value) {
  if (!value) return '—'
  return value
}

function formatCategory(category = '') {
  const match = /^([FM])(\d+-\d+|\d+\+)$/.exec(category)
  if (!match) return category

  const [, prefix, age] = match
  const gender = prefix === 'F' ? 'Feminino' : 'Masculino'
  return `${gender} · ${age.replace('-', '–')} anos`
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR')
}

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.2 4.2" />
      </svg>
    )
  }

  if (name === 'arrow') {
    return (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    )
  }

  if (name === 'back') {
    return (
      <svg {...common}>
        <path d="M19 12H5m6 7-7-7 7-7" />
      </svg>
    )
  }

  if (name === 'chevron-left') {
    return (
      <svg {...common}>
        <path d="m15 18-6-6 6-6" />
      </svg>
    )
  }

  if (name === 'chevron-right') {
    return (
      <svg {...common}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
      <circle cx="12" cy="12" r="6.5" />
    </svg>
  )
}

function App() {
  const [genderTab, setGenderTab] = useState('feminino')
  const [category, setCategory] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [listData, setListData] = useState(null)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState('')
  const [bibNumber, setBibNumber] = useState(getBibFromPath)
  const [participant, setParticipant] = useState(null)
  const [participantLoading, setParticipantLoading] = useState(() => Boolean(getBibFromPath()))
  const [participantError, setParticipantError] = useState('')

  const beginListLoad = useCallback(() => {
    setListLoading(true)
    setListError('')
  }, [])

  const selectedGender = useMemo(
    () => GENDER_TABS.find((tab) => tab.id === genderTab)?.gender ?? '',
    [genderTab],
  )

  useEffect(() => {
    const syncPath = () => {
      const nextBibNumber = getBibFromPath()
      setBibNumber(nextBibNumber)

      if (nextBibNumber) {
        setParticipant(null)
        setParticipantError('')
        setParticipantLoading(true)
      } else {
        beginListLoad()
      }
    }

    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [beginListLoad])

  useEffect(() => {
    if (bibNumber) return undefined

    const controller = new AbortController()

    fetchResults({
      page,
      limit: PAGE_SIZE,
      gender: selectedGender,
      category,
      search,
      signal: controller.signal,
    })
      .then((data) => {
        setListData(data)
        setLastUpdated(new Date().toISOString())
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setListError(error.message || 'Não foi possível carregar os resultados.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false)
      })

    return () => controller.abort()
  }, [bibNumber, page, selectedGender, category, search, refreshKey])

  useEffect(() => {
    if (!bibNumber) return undefined

    const controller = new AbortController()

    fetchParticipant(bibNumber, controller.signal)
      .then(setParticipant)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setParticipantError(error.message || 'Não foi possível encontrar este participante.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setParticipantLoading(false)
      })

    return () => controller.abort()
  }, [bibNumber])

  const openParticipant = useCallback((bib) => {
    window.history.pushState({}, '', `/resultados/${encodeURIComponent(bib)}`)
    setParticipant(null)
    setParticipantError('')
    setParticipantLoading(true)
    setBibNumber(String(bib))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const returnToResults = useCallback(() => {
    window.history.pushState({}, '', '/')
    beginListLoad()
    setBibNumber('')
    setParticipant(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [beginListLoad])

  const applySearch = (event) => {
    event.preventDefault()
    beginListLoad()
    setPage(1)
    setSearch(searchDraft.trim())
  }

  const changeGender = (id) => {
    beginListLoad()
    setGenderTab(id)
    setCategory('')
    setPage(1)
  }

  const changeCategory = (event) => {
    beginListLoad()
    const nextCategory = event.target.value
    const option = CATEGORY_OPTIONS.find(({ value }) => value === nextCategory)
    setCategory(nextCategory)
    if (option) setGenderTab(option.genderTab)
    setPage(1)
  }

  const changePage = (nextPage) => {
    beginListLoad()
    setPage(nextPage)
  }

  const event = listData?.event
  const pagination = listData?.pagination
  const results = listData?.results ?? []
  const total = pagination?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const eventDate = formatDate(event?.imported_at)
  const selectedCategory = CATEGORY_OPTIONS.find(({ value }) => value === category)
  const selectedGenderLabel = GENDER_TABS.find(({ id }) => id === genderTab)?.label ?? ''
  const activeFilters = [
    category ? selectedCategory?.label ?? formatCategory(category) : selectedGenderLabel,
    search ? `Busca: ${search}` : '',
  ].filter(Boolean)

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" onClick={(event) => {
          event.preventDefault()
          returnToResults()
        }} aria-label="Placar de Corrida de Rua — início">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">PLACAR<span>.</span></span>
        </a>

        <div className="header-meta">
          <span className="header-caption">CORRIDA DE RUA</span>
          <span className="header-divider" />
          <span className="connection-indicator">
            <span className={`connection-dot${listError || participantError ? ' is-error' : ''}`} />
            {listError || participantError ? 'API indisponível' : 'PLACAR OFICIAL'}
          </span>
        </div>
      </header>

      <main>
        {bibNumber ? (
          <ParticipantDetail
            bibNumber={bibNumber}
            participant={participant}
            loading={participantLoading}
            error={participantError}
            onBack={returnToResults}
          />
        ) : (
          <>
            <section className="intro">
              <div className="intro-copy">
                <p className="eyebrow"><span className="eyebrow-line" /> RESULTADOS DA PROVA</p>
                <h1>A corrida termina.<br /><em>A história fica.</em></h1>
                <p className="intro-description">
                  Cada número tem uma chegada. Encontre a sua classificação.
                </p>
              </div>
              <div className="intro-art" aria-hidden="true">
                <div className="track track-one" />
                <div className="track track-two" />
                <div className="track track-three" />
                <div className="track-center">FINISH<br />LINE</div>
                <span className="track-label">KM 00 — CHEGADA</span>
                <span className="track-number">01</span>
              </div>
              <div className="intro-index"><span>01</span> / CLASSIFICAÇÃO</div>
            </section>

            <section className="board-section" aria-labelledby="board-title">
              <div className="board-heading">
                <div>
                  <p className="eyebrow"><span className="eyebrow-line" /> O PLACAR</p>
                  <h2 id="board-title">Resultados <span>oficiais</span></h2>
                </div>
                <div className="board-status" aria-live="polite">
                  <span className={`status-pulse${listError ? ' is-error' : ''}`} />
                  {listLoading ? 'Atualizando resultados' : listError ? 'Conexão interrompida' : 'Dados da organização'}
                </div>
              </div>

              <div className="event-card">
                <div className="event-card-label">
                  <span className="event-symbol"><Icon name="finish" size={20} /></span>
                  <span>EVENTO ATUAL</span>
                </div>
                <div className="event-main">
                  <h3>{event?.title || (listLoading ? 'Carregando evento…' : 'Nenhum evento publicado')}</h3>
                  <p>
                    {event?.slug ? `/${event.slug}` : 'A classificação atual da prova aparece aqui.'}
                  </p>
                </div>
                <div className="event-stats">
                  <div>
                    <span className="stat-label">PARTICIPANTES</span>
                    <strong>{listLoading ? '—' : total.toLocaleString('pt-BR')}</strong>
                  </div>
                  <span className="event-stats-divider" />
                  <div>
                    <span className="stat-label">IMPORTADO</span>
                    <strong className="event-date">{eventDate || '—'}</strong>
                  </div>
                </div>
              </div>

              <div className="filters-panel">
                <div className="filter-topline">
                  <div className="gender-tabs" role="group" aria-label="Filtrar classificação por gênero">
                    {GENDER_TABS.map((tab) => (
                      <button
                        className={`gender-tab${genderTab === tab.id ? ' is-active' : ''}`}
                        key={tab.id}
                        type="button"
                        aria-pressed={genderTab === tab.id}
                        onClick={() => changeGender(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <label className="category-filter">
                    <span className="sr-only">Filtrar por categoria</span>
                    <select value={category} onChange={changeCategory}>
                      <option value="">Todas as categorias</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <span className="select-chevron" aria-hidden="true">⌄</span>
                  </label>
                </div>

                <div className="filter-bottomline">
                  <div className="filter-context">
                    <span className="filter-context-mark" />
                    <span>{activeFilters.length ? activeFilters.join(' · ') : 'Todas as classificações'}</span>
                  </div>
                  <form className="search-form" onSubmit={applySearch} role="search">
                    <Icon name="search" size={18} />
                    <label className="sr-only" htmlFor="result-search">Buscar atleta ou número de peito</label>
                    <input
                      id="result-search"
                      type="search"
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder="Nome ou número de peito"
                    />
                    {searchDraft && (
                      <button className="search-clear" type="button" onClick={() => {
                        setSearchDraft('')
                        if (search) {
                      beginListLoad()
                      setSearch('')
                      setPage(1)
                        }
                      }} aria-label="Limpar busca">×</button>
                    )}
                    <button className="search-submit" type="submit" aria-label="Buscar">
                      <Icon name="arrow" size={17} />
                    </button>
                  </form>
                </div>
              </div>

              <div className="results-header">
                <div>
                  <span className="results-overline">CLASSIFICAÇÃO</span>
                  <h3>{category ? `Categoria ${selectedCategory?.label ?? formatCategory(category)}` : GENDER_TABS.find((tab) => tab.id === genderTab)?.label}</h3>
                </div>
                <div className="results-count">
                  {listLoading ? 'Carregando…' : `${total.toLocaleString('pt-BR')} resultados`}
                  {lastUpdated && !listLoading && <span>Atualizado {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastUpdated))}</span>}
                </div>
              </div>

              {listError ? (
                <div className="state-card error-card" role="alert">
                  <div className="state-icon">!</div>
                  <h3>Não foi possível carregar os resultados</h3>
                  <p>{listError}</p>
                  <button className="retry-button" type="button" onClick={() => {
                    beginListLoad()
                    setRefreshKey((current) => current + 1)
                  }}>
                    Tentar novamente <Icon name="arrow" size={16} />
                  </button>
                </div>
              ) : listLoading ? (
                <ResultsLoading />
              ) : !event ? (
                <div className="state-card">
                  <div className="state-icon"><Icon name="finish" size={23} /></div>
                  <h3>Ainda não há uma prova publicada</h3>
                  <p>Quando a organização publicar os resultados, a classificação aparecerá aqui.</p>
                </div>
              ) : results.length === 0 ? (
                <div className="state-card">
                  <div className="state-icon"><Icon name="search" size={23} /></div>
                  <h3>Nenhum resultado encontrado</h3>
                  <p>Experimente outra busca ou remova um dos filtros selecionados.</p>
                  {(activeFilters.length > 0 || search) && (
                    <button className="reset-filters" type="button" onClick={() => {
                      beginListLoad()
                      setGenderTab('feminino')
                      setCategory('')
                      setSearch('')
                      setSearchDraft('')
                      setPage(1)
                    }}>Limpar filtros</button>
                  )}
                </div>
              ) : (
                <>
                  <ResultsTable
                    results={results}
                    category={category}
                    onSelect={openParticipant}
                  />
                  <div className="pagination">
                    <span className="pagination-summary">
                      Mostrando <strong>{Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}</strong> de <strong>{total.toLocaleString('pt-BR')}</strong>
                    </span>
                    <div className="pagination-controls">
                      <button type="button" onClick={() => changePage(Math.max(1, page - 1))} disabled={page <= 1 || listLoading} aria-label="Página anterior">
                        <Icon name="chevron-left" size={18} />
                      </button>
                      <span><strong>{page}</strong><span className="page-slash">/</span>{totalPages}</span>
                      <button type="button" onClick={() => changePage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || listLoading} aria-label="Próxima página">
                        <Icon name="chevron-right" size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="/" onClick={(event) => {
          event.preventDefault()
          returnToResults()
        }}>PLACAR<span>.</span></a>
        <span>RESULTADOS QUE CONTAM HISTÓRIAS</span>
        {API_BASE_URL && (
          <a href={`${API_BASE_URL}/swagger/`} target="_blank" rel="noreferrer">
            API de resultados <Icon name="arrow" size={14} />
          </a>
        )}
      </footer>
    </div>
  )
}

function ResultsTable({ results, category, onSelect }) {
  return (
    <div className="table-frame">
      <table className="results-table">
        <thead>
          <tr>
            <th className="position-heading">{category ? 'CAT. POS.' : 'POS.'}</th>
            <th>ATLETA</th>
            <th className="bib-heading">PEITO</th>
            <th className="category-heading">CATEGORIA</th>
            <th className="time-heading">TEMPO</th>
            <th className="team-heading">EQUIPE</th>
            <th><span className="sr-only">Detalhes</span></th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => {
            const position = category ? result.rank_category : result.rank_general
            const time = result.time_net || result.time_gross

            return (
              <tr key={result.id || result.bib_number || `${result.athlete_name}-${index}`}>
                <td className="position-cell">
                  <span className={`rank-badge${position <= 3 ? ` rank-top-${position}` : ''}`}>
                    {position ?? '—'}
                  </span>
                </td>
                <td>
                  <button className="athlete-link" type="button" onClick={() => onSelect(result.bib_number)}>
                    <span className="athlete-avatar">{initials(result.athlete_name)}</span>
                    <span className="athlete-copy">
                      <strong>{result.athlete_name}</strong>
                      <span>{result.gender || 'Participante'}{result.status && result.status !== 'Concluído' ? ` · ${result.status}` : ''}</span>
                    </span>
                  </button>
                </td>
                <td className="bib-cell"><span>#{result.bib_number}</span></td>
                <td className="category-cell">{formatCategory(result.category) || '—'}</td>
                <td className="time-cell">{formatTime(time)}</td>
                <td className="team-cell">{result.team_name || '—'}</td>
                <td className="row-action-cell">
                  <button className="row-action" type="button" onClick={() => onSelect(result.bib_number)} aria-label={`Ver resultado de ${result.athlete_name}`}>
                    <Icon name="arrow" size={16} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ResultsLoading() {
  return (
    <div className="loading-list" aria-label="Carregando resultados" aria-busy="true">
      <div className="loading-row loading-heading" />
      {[1, 2, 3, 4, 5].map((item) => <div className="loading-row" key={item}><span /><span /><span /><span /></div>)}
    </div>
  )
}

function ParticipantDetail({ bibNumber, participant, loading, error, onBack }) {
  const result = participant?.result ?? participant
  const event = participant?.event
  const categoryIncludesGender = /^[FM]\d/.test(result?.category ?? '')

  return (
    <section className="detail-section">
      <button className="back-link" type="button" onClick={onBack}>
        <Icon name="back" size={18} /> Voltar à classificação
      </button>

      {loading ? (
        <div className="state-card detail-state"><div className="state-icon"><Icon name="finish" size={23} /></div><h3>Buscando atleta…</h3><p>Consultando o número de peito {bibNumber}.</p></div>
      ) : error ? (
        <div className="state-card detail-state" role="alert"><div className="state-icon">!</div><h3>Não encontramos este resultado</h3><p>{error}</p><button className="retry-button" type="button" onClick={onBack}>Voltar ao placar <Icon name="arrow" size={16} /></button></div>
      ) : result ? (
        <article className="participant-card">
          <div className="participant-topline">
            <p className="eyebrow"><span className="eyebrow-line" /> RESULTADO INDIVIDUAL</p>
            <span className="bib-number">Nº {result.bib_number || bibNumber}</span>
          </div>
          <div className="participant-identity">
            <span className="participant-avatar">{initials(result.athlete_name)}</span>
            <div>
              <h1>{result.athlete_name}</h1>
              <p>{[
                categoryIncludesGender ? formatCategory(result.category) : result.gender,
                categoryIncludesGender ? '' : formatCategory(result.category),
                result.team_name,
              ].filter(Boolean).join(' · ') || 'Participante'}</p>
            </div>
          </div>
          <div className="participant-event">
            <span>EVENTO</span>
            <strong>{event?.title || 'Corrida de rua'}</strong>
          </div>
          <div className="participant-stats">
            <div className="participant-stat participant-stat-featured">
              <span>CLASSIFICAÇÃO GERAL</span>
              <strong>{result.rank_general ?? '—'}<small>º</small></strong>
            </div>
            <div className="participant-stat">
              <span>POSIÇÃO NA CATEGORIA</span>
              <strong>{result.rank_category ?? '—'}<small>º</small></strong>
            </div>
            <div className="participant-stat">
              <span>{result.time_net ? 'TEMPO LÍQUIDO' : 'TEMPO BRUTO'}</span>
              <strong className="participant-time">{formatTime(result.time_net || result.time_gross)}</strong>
            </div>
            <div className="participant-stat">
              <span>STATUS</span>
              <strong className="participant-status">{result.status || '—'}</strong>
            </div>
          </div>
          <button className="detail-back-button" type="button" onClick={onBack}>Voltar ao placar <Icon name="arrow" size={16} /></button>
        </article>
      ) : null}
    </section>
  )
}

export default App
