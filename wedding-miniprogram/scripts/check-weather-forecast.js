const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  getForecastWindow,
  normalizeDate,
  selectWeddingForecast,
  shanghaiDate
} = require('../cloudfunctions/getWeather/weather-utils')

const JULY_10_NOON_SHANGHAI = Date.parse('2026-07-10T12:00:00+08:00')

assert.strictEqual(shanghaiDate(JULY_10_NOON_SHANGHAI), '2026-07-10')
assert.strictEqual(normalizeDate('2026-02-29'), '')
assert.strictEqual(normalizeDate('2026-07-16'), '2026-07-16')

assert.deepStrictEqual(
  getForecastWindow('', JULY_10_NOON_SHANGHAI),
  { state: 'missing', daysAway: null, weddingDate: '' }
)
assert.strictEqual(getForecastWindow('2026-07-09', JULY_10_NOON_SHANGHAI).state, 'past')
assert.strictEqual(getForecastWindow('2026-07-10', JULY_10_NOON_SHANGHAI).state, 'available')
assert.strictEqual(getForecastWindow('2026-07-16', JULY_10_NOON_SHANGHAI).state, 'available')
assert.strictEqual(getForecastWindow('2026-07-17', JULY_10_NOON_SHANGHAI).state, 'future')

const daily = [
  { fxDate: '2026-07-10', textDay: '晴' },
  { fxDate: '2026-07-11', textDay: '小雨' }
]
assert.strictEqual(selectWeddingForecast(daily, '2026-07-11')?.textDay, '小雨')
assert.strictEqual(selectWeddingForecast(daily, '2026-07-12'), null)

const root = path.resolve(__dirname, '..')
const weatherFunction = fs.readFileSync(path.join(root, 'cloudfunctions/getWeather/index.js'), 'utf8')
const guidePage = fs.readFileSync(path.join(root, 'pages/guide/index.vue'), 'utf8')

assert(weatherFunction.includes('/v7/weather/7d'), 'getWeather must use the seven-day forecast endpoint')
assert(weatherFunction.includes('selectWeddingForecast(res.daily, weddingDate)'), 'getWeather must select the exact wedding date')
assert(!weatherFunction.includes('buildMockWeather'), 'getWeather must not fabricate sunny weather when forecast data is unavailable')
assert(guidePage.includes('weatherPending'), 'guide page must render the pre-forecast pending state')
assert(guidePage.includes('婚礼前 7 天更新'), 'guide page must explain the forecast window')

console.log('weather forecast contract checks passed')
