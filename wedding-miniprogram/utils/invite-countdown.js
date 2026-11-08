/**
 * 婚礼仪式倒计时。
 * 目标时刻写死为带偏移的绝对时间，按 Asia/Shanghai（全年 UTC+8，无夏令时）判断「当天」。
 * 不用设备本地的年月日，也不改系统钟。调用方传入 now（毫秒或 Date）。
 */

export const CEREMONY_AT = '2026-11-14T10:58:00+08:00'
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

const OFFSET_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/

export function parseCeremonyAt(iso = CEREMONY_AT) {
  if (typeof iso !== 'string' || !OFFSET_RE.test(iso)) {
    throw new Error('ceremonyAt 必须是带显式时区偏移的时间，例如 2026-11-14T10:58:00+08:00')
  }
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) throw new Error('ceremonyAt 无法解析')
  return ms
}

export function toMs(now) {
  if (typeof now === 'number') {
    if (!Number.isFinite(now)) throw new Error('now 必须是有限的毫秒时间戳')
    return now
  }
  if (now instanceof Date) {
    const ms = now.getTime()
    if (!Number.isFinite(ms)) throw new Error('now 是无效日期')
    return ms
  }
  throw new Error('now 只能是毫秒时间戳或 Date')
}

/** 用 UTC 字段读出上海日历日，避免受到设备时区影响。 */
export function shanghaiDate(ms) {
  const shifted = new Date(ms + SHANGHAI_OFFSET_MS)
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate()
  }
}

function sameShanghaiDay(a, b) {
  const A = shanghaiDate(a)
  const B = shanghaiDate(b)
  return A.y === B.y && A.m === B.m && A.d === B.d
}

function partsFromRemaining(ms) {
  const clamped = ms > 0 ? ms : 0
  const day = Math.floor(clamped / DAY_MS)
  const hour = Math.floor((clamped % DAY_MS) / HOUR_MS)
  const minute = Math.floor((clamped % HOUR_MS) / MINUTE_MS)
  let second = Math.floor((clamped % MINUTE_MS) / 1000)
  // 还剩不到 1 秒时仍显示 1 秒，到点再交给 exact，避免倒计时出现 0 秒。
  if (ms > 0 && day === 0 && hour === 0 && minute === 0 && second === 0) second = 1
  return { day, hour, minute, second }
}

function formatUnits(parts) {
  const rows = [
    [parts.day, '天'],
    [parts.hour, '时'],
    [parts.minute, '分'],
    [parts.second, '秒']
  ]
  const start = rows.findIndex(([n]) => n > 0)
  if (start < 0) return ''
  // 天 / 时 / 分这一档不带秒，免得变成抢购看板；只剩几秒时才读秒。
  let end = start === 3 ? 4 : 3
  while (end > start + 1 && rows[end - 1][0] === 0) end -= 1
  return rows.slice(start, end).map(([n, unit]) => `${n} ${unit}`).join(' ')
}

/**
 * phase:
 *   before  上海日历日还没到仪式当天
 *   today   当天、约定时刻之前
 *   exact   到达那一秒（含整点，不含之后的整秒）
 *   after   约定时刻已过
 * 数字一律钳在 0，文案不宣称仪式是否真的正在举行。
 */
export function describeCountdown(now, ceremonyAt = CEREMONY_AT) {
  const nowMs = toMs(now)
  const targetMs = parseCeremonyAt(ceremonyAt)
  const remainingMs = targetMs - nowMs
  let phase
  if (remainingMs <= -1000) phase = 'after'
  else if (remainingMs <= 0) phase = 'exact'
  else if (sameShanghaiDay(nowMs, targetMs)) phase = 'today'
  else phase = 'before'

  const parts = partsFromRemaining(remainingMs)
  let text
  if (phase === 'exact') text = '约定的时辰到了'
  else if (phase === 'after') text = '约定的时辰已过'
  else if (phase === 'today') text = `今天，距约定的时辰还有 ${formatUnits(parts)}`
  else text = `距相见还有 ${formatUnits(parts)}`

  return {
    ceremonyAt,
    targetMs,
    nowMs,
    remainingMs,
    phase,
    parts,
    text
  }
}

/**
 * 页面时钟。show 可重复调用，不会叠第二个计时器；
 * hide / unload 清掉计时器。到点之后不再空转。
 */
export function createCountdown(options = {}) {
  const now = options.now || (() => Date.now())
  const schedule = options.schedule || ((fn, ms) => setInterval(fn, ms))
  const cancel = options.cancel || ((id) => clearInterval(id))
  const intervalMs = options.intervalMs || 1000
  const ceremonyAt = options.ceremonyAt || CEREMONY_AT
  const onTick = options.onTick || (() => {})
  let timer = null
  let armed = false

  function disarm() {
    if (!armed) return
    cancel(timer)
    timer = null
    armed = false
  }

  function render() {
    return describeCountdown(now(), ceremonyAt)
  }

  function arm() {
    if (armed) return
    armed = true
    timer = schedule(() => {
      const view = render()
      onTick(view)
      if (view.phase === 'after') disarm()
    }, intervalMs)
  }

  function show() {
    const view = render()
    onTick(view)
    if (view.phase === 'after') {
      disarm()
      return view
    }
    arm()
    return view
  }

  function hide() { disarm() }
  function unload() { disarm() }

  return { show, hide, unload }
}
