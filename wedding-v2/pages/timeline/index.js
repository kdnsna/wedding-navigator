const app = getApp()
const { daysUntil } = require('../../utils/date')

/** 把 "HH:mm" 转成当天分钟数 */
function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    loaded: false,
    wedding: null,
    items: [],
    isToday: false
  },

  onLoad(options) {
    // 分享卡片带 ?w=weddingId 进入
    if (options && options.w) {
      app.globalData.weddingId = options.w
      app.globalData.wedding = null
    }
  },

  onShow() {
    app.loadWedding().then(w => {
      const list = (w && w.timeline) || []
      const isToday = w ? daysUntil(w.date.dateISO) === 0 : false

      // 婚礼当天：按当前时间标记 进行中 / 已结束
      let current = -1
      if (isToday) {
        const now = new Date()
        const cur = now.getHours() * 60 + now.getMinutes()
        list.forEach((it, i) => {
          const start = toMinutes(it.time)
          const end = i + 1 < list.length ? toMinutes(list[i + 1].time) : 24 * 60
          if (cur >= start && cur < end) current = i
        })
      }

      const items = list.map((it, i) => ({
        ...it,
        last: i === list.length - 1,
        state: !isToday || current === -1 ? '' : i < current ? 'done' : i === current ? 'current' : ''
      }))

      this.setData({ loaded: true, wedding: w, items, isToday })
    })

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' })
  },

  onShareAppMessage() {
    const w = this.data.wedding
    if (!w) return { title: '甜囍手册 · 制作你的婚礼请柬', path: '/pages/home/index' }
    return {
      title: `${w.couple.groom} & ${w.couple.bride} · 诚邀您见证我们的婚礼`,
      path: `/pages/invite/index?w=${w._id}`
    }
  }
})
