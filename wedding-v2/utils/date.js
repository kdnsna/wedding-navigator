/** 倒计时与日期工具 */

/** 距目标日期还剩几天（目标当天返回 0，已过返回负数） */
function daysUntil(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target - today) / 86400000)
}

/** 把 Date.now() 格式化为「M月D日 HH:mm」 */
function formatTime(ts) {
  const t = new Date(ts)
  const pad = n => (n < 10 ? '0' + n : '' + n)
  return `${t.getMonth() + 1}月${t.getDate()}日 ${pad(t.getHours())}:${pad(t.getMinutes())}`
}

module.exports = { daysUntil, formatTime }
