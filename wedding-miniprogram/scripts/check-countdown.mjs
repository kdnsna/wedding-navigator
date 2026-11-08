/**
 * 仪式倒计时。只把 now 传进去，不改系统钟。
 *   node scripts/check-countdown.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CEREMONY_AT,
  createCountdown,
  describeCountdown,
  parseCeremonyAt,
  shanghaiDate
} from '../utils/invite-countdown.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fails = []
const assert = (cond, msg) => { if (!cond) fails.push(msg) }
const at = (iso) => Date.parse(iso)
const TARGET = at(CEREMONY_AT)

function noNegative(view, label) {
  assert(view.parts.day >= 0 && view.parts.hour >= 0 && view.parts.minute >= 0 && view.parts.second >= 0, `${label}: 数字出现负数`)
  assert(!/-/.test(view.text), `${label}: 文案含负号 ${view.text}`)
  assert(!/进行|正在|已开始|仪式中/.test(view.text), `${label}: 文案在宣称仪式进程 ${view.text}`)
}

const dayBefore = describeCountdown(at('2026-11-13T10:58:00+08:00'))
assert(dayBefore.phase === 'before', `前日 phase ${dayBefore.phase}`)
assert(dayBefore.text === '距相见还有 1 天', `前日文案 ${dayBefore.text}`)
assert(dayBefore.remainingMs === 24 * 60 * 60 * 1000, '前日应刚好 1 天')
noNegative(dayBefore, '前日')

const eveningBefore = describeCountdown(at('2026-11-13T15:30:00Z'))
assert(eveningBefore.phase === 'before', `上海 13 日深夜应仍是 before，得到 ${eveningBefore.phase} / ${eveningBefore.text}`)
assert(eveningBefore.text.startsWith('距相见还有'), eveningBefore.text)
assert(!eveningBefore.text.includes('今天'), '前日文案不应说今天')
noNegative(eveningBefore, '前日傍晚')

const todayEarly = describeCountdown(at('2026-11-14T08:00:00+08:00'))
assert(todayEarly.phase === 'today', `当天开始前 phase ${todayEarly.phase}`)
assert(todayEarly.text === '今天，距约定的时辰还有 2 时 58 分', `当天开始前文案 ${todayEarly.text}`)
noNegative(todayEarly, '当天开始前')

const justAfterMidnight = describeCountdown(at('2026-11-13T16:30:00Z'))
assert(shanghaiDate(justAfterMidnight.nowMs).d === 14, '16:30Z 在上海应已是 14 日')
assert(justAfterMidnight.phase === 'today', `上海刚过零点应为 today，得到 ${justAfterMidnight.phase}（本地 ${new Date(justAfterMidnight.nowMs).toString()}）`)
assert(justAfterMidnight.text.startsWith('今天，距约定的时辰还有'), justAfterMidnight.text)

const lastMinute = describeCountdown(TARGET - 30 * 1000)
assert(lastMinute.phase === 'today', lastMinute.phase)
assert(lastMinute.text === '今天，距约定的时辰还有 30 秒', lastMinute.text)

const subSecond = describeCountdown(TARGET - 400)
assert(subSecond.phase === 'today' && subSecond.text === '今天，距约定的时辰还有 1 秒', subSecond.text)

const exact = describeCountdown(TARGET)
assert(exact.phase === 'exact', `恰好 phase ${exact.phase}`)
assert(exact.text === '约定的时辰到了', exact.text)
assert(exact.remainingMs === 0, '恰好剩余应为 0')
assert(exact.parts.day === 0 && exact.parts.hour === 0 && exact.parts.minute === 0 && exact.parts.second === 0, '恰好数字为 0')
noNegative(exact, '恰好')

const withinSecond = describeCountdown(TARGET + 500)
assert(withinSecond.phase === 'exact', `到点这一秒 phase ${withinSecond.phase}`)
assert(withinSecond.text === '约定的时辰到了', withinSecond.text)
assert(withinSecond.remainingMs === -500, '到点这一秒允许剩余为负，但文案不报数')
noNegative(withinSecond, '到点这一秒')

const justExpired = describeCountdown(TARGET + 1000)
assert(justExpired.phase === 'after', `过期 1 秒 phase ${justExpired.phase}`)
assert(justExpired.text === '约定的时辰已过', justExpired.text)
assert(justExpired.parts.day === 0 && justExpired.parts.hour === 0 && justExpired.parts.minute === 0 && justExpired.parts.second === 0, '过期后数字钳在 0')
noNegative(justExpired, '过期 1 秒')

const nextDay = describeCountdown(at('2026-11-15T10:58:00+08:00'))
assert(nextDay.phase === 'after' && nextDay.text === '约定的时辰已过', nextDay.text)
assert(nextDay.remainingMs < 0, '过期剩余时间戳可以为负')
noNegative(nextDay, '次日')

assert(parseCeremonyAt(CEREMONY_AT) === at('2026-11-14T02:58:00Z'), '目标时刻应等于 02:58:00Z')
assert(shanghaiDate(TARGET).y === 2026 && shanghaiDate(TARGET).m === 11 && shanghaiDate(TARGET).d === 14, '目标日在上海是 11 月 14 日')

const honoluluNow = at('2026-11-14T10:58:00-10:00')
const fromHonolulu = describeCountdown(honoluluNow)
assert(fromHonolulu.phase === 'after', `夏威夷墙上的 11 月 14 日 10:58 在上海已是次日清晨，应已过，得到 ${fromHonolulu.phase}`)
assert(describeCountdown(at('2026-11-14T10:58:00+08:00')).phase === 'exact', '同一串墙上时间若带 +08:00 才是到点')

let threw = false
try { parseCeremonyAt('2026-11-14T10:58:00') } catch (e) { threw = true }
assert(threw, '没有时区偏移的时间必须拒绝')

const src = fs.readFileSync(new URL('../utils/invite-countdown.js', import.meta.url), 'utf8')
assert(!/\.get(?!UTC)(FullYear|Month|Date|Hours|Minutes|Seconds)\(/.test(src), '倒计时不能读设备本地的年月日时分秒')
assert(!/new Date\(\s*\d/.test(src), '不能用本地时区的 new Date(y, m, d)')

const configSrc = fs.readFileSync(path.join(root, 'config/invite.js'), 'utf8')
const { default: CONFIG } = await import('data:text/javascript;base64,' + Buffer.from(configSrc).toString('base64'))
assert(CONFIG.ceremonyAt === CEREMONY_AT, `CONFIG.ceremonyAt ${CONFIG.ceremonyAt}`)
assert(CONFIG.whispers.story === '遇见你，山海都温柔', '故事点缀被改动')
assert(CONFIG.whispers.journey === '想和你，看遍每一片海', '旅程点缀被改动')
assert(CONFIG.whispers.ending === '从此朝暮，身边都是你', '尾声点缀被改动')
assert(CONFIG.groomName === '高嘉琪' && CONFIG.brideName === '张靖', '姓名被改动')
assert(CONFIG.story.aside === '从山间到平原，在泉城相遇，向荣成的海奔赴', CONFIG.story.aside)
assert(!/博兴|新泰/.test(configSrc), '配置里仍有博兴或新泰')

const page = fs.readFileSync(path.join(root, 'pages/invite/index.vue'), 'utf8')
assert(!/博兴|新泰/.test(page), '页面里仍有博兴或新泰')
assert(page.includes('从山间到平原，在泉城相遇，向荣成的海奔赴') || page.includes('C.story.aside'), '页面未使用含蓄副文')
assert(!/story\.origins/.test(page), '页面仍在拼 origins')
assert(/onShow\(\(\) => \{[\s\S]*?countdownClock\.show\(\)/.test(page), 'onShow 应重算倒计时')
assert(/onHide\(\(\) => \{[\s\S]*?countdownClock\.hide\(\)/.test(page), 'onHide 应清计时器')
assert(/onUnload\(\(\) => \{[\s\S]*?countdownClock\.unload\(\)/.test(page), 'onUnload 应清计时器')
assert(page.includes("color: $gold"), '香槟金 & 还在')

function fakeTimers() {
  let seq = 1
  const active = new Set()
  const fns = new Map()
  return {
    active,
    schedule(fn) {
      const id = seq++
      active.add(id)
      fns.set(id, fn)
      return id
    },
    cancel(id) { active.delete(id); fns.delete(id) },
    fire(id) { fns.get(id)() }
  }
}

{
  let now = TARGET - 90 * 1000
  const ticks = []
  const timers = fakeTimers()
  const clock = createCountdown({
    now: () => now,
    schedule: timers.schedule,
    cancel: timers.cancel,
    onTick: (view) => ticks.push(view.text)
  })
  const first = clock.show()
  assert(first.phase === 'today', '生命周期：开始前应是 today')
  clock.show()
  clock.show()
  assert(timers.active.size === 1, `多次 show 叠了 ${timers.active.size} 个计时器`)
  clock.hide()
  assert(timers.active.size === 0, 'hide 后计时器还在')
  clock.hide()
  clock.show()
  assert(timers.active.size === 1, '再次进入应只有一个计时器')
  const id = [...timers.active][0]
  now = TARGET
  timers.fire(id)
  assert(ticks[ticks.length - 1] === '约定的时辰到了', ticks[ticks.length - 1])
  assert(timers.active.size === 1, '到点这一秒仍可再跳一次，以便翻到已过')
  now = TARGET + 2000
  timers.fire([...timers.active][0])
  assert(ticks[ticks.length - 1] === '约定的时辰已过', ticks[ticks.length - 1])
  assert(timers.active.size === 0, '过期后应卸掉计时器')
  clock.unload()
  assert(timers.active.size === 0, 'unload 在已清除时也应安全')
}

{
  let now = TARGET - 5000
  const timers = fakeTimers()
  const clock = createCountdown({
    now: () => now,
    schedule: timers.schedule,
    cancel: timers.cancel
  })
  clock.show()
  clock.unload()
  assert(timers.active.size === 0, 'unload 应清掉计时器')
  clock.show()
  clock.show()
  assert(timers.active.size === 1, '卸载后再次进入不应重复')
  clock.hide()
}

{
  const timers = fakeTimers()
  const clock = createCountdown({
    now: () => TARGET + 60 * 1000,
    schedule: timers.schedule,
    cancel: timers.cancel
  })
  const view = clock.show()
  assert(view.phase === 'after' && timers.active.size === 0, '打开时已过期就不应再挂计时器')
  clock.show()
  assert(timers.active.size === 0, '已过期反复进入也不挂计时器')
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))
assert(manifest.versionName === '3.1.7' && String(manifest.versionCode) === '317', `版本 ${manifest.versionName}/${manifest.versionCode}`)

if (fails.length) {
  console.error(`countdown checks FAILED (TZ=${process.env.TZ || ''} offsetMin=${new Date(TARGET).getTimezoneOffset()}):\n- ` + fails.join('\n- '))
  process.exit(1)
}
console.log(`countdown checks passed (TZ=${process.env.TZ || 'unset'} offsetMin=${new Date(TARGET).getTimezoneOffset()})`)
