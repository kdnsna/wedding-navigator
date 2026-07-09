const DAY_MS = 24 * 60 * 60 * 1000
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000

function normalizeDate(value) {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
  const parsed = new Date(`${text}T00:00:00+08:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  const normalized = new Date(parsed.getTime() + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10)
  return normalized === text ? text : ''
}

function shanghaiDate(timestamp = Date.now()) {
  return new Date(Number(timestamp) + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10)
}

function getForecastWindow(weddingDate, timestamp = Date.now(), maxForecastDays = 7) {
  const normalizedWeddingDate = normalizeDate(weddingDate)
  if (!String(weddingDate || '').trim()) return { state: 'missing', daysAway: null, weddingDate: '' }
  if (!normalizedWeddingDate) return { state: 'invalid', daysAway: null, weddingDate: '' }

  const today = shanghaiDate(timestamp)
  const todayMs = Date.parse(`${today}T00:00:00+08:00`)
  const weddingMs = Date.parse(`${normalizedWeddingDate}T00:00:00+08:00`)
  const daysAway = Math.round((weddingMs - todayMs) / DAY_MS)

  if (daysAway < 0) return { state: 'past', daysAway, weddingDate: normalizedWeddingDate }
  if (daysAway >= maxForecastDays) return { state: 'future', daysAway, weddingDate: normalizedWeddingDate }
  return { state: 'available', daysAway, weddingDate: normalizedWeddingDate }
}

function selectWeddingForecast(daily = [], weddingDate = '') {
  if (!Array.isArray(daily)) return null
  const normalizedWeddingDate = normalizeDate(weddingDate)
  if (!normalizedWeddingDate) return null
  return daily.find(item => item?.fxDate === normalizedWeddingDate || item?.date === normalizedWeddingDate) || null
}

module.exports = {
  getForecastWindow,
  normalizeDate,
  selectWeddingForecast,
  shanghaiDate
}
