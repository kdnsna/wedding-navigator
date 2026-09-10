const app = getApp()
const { daysUntil } = require('../../utils/date')

/** 把 "HH:mm" 转成当天分钟数；无效时间返回 null */
function toMinutes(time) {
  const [h, m] = (time || '').split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
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
          if (start == null) return
          const next = i + 1 < list.length ? toMinutes(list[i + 1].time) : null
          const end = next == null ? 24 * 60 : next
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
    return app.share()
  }
})
