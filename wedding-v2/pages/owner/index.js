const app = getApp()
const store = require('../../services/store')
const { formatTime } = require('../../utils/date')

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    loaded: false,
    wedding: null,
    stats: { total: 0, attend: 0, maybe: 0, decline: 0, seats: 0 },
    rsvps: [],
    blessings: []
  },

  onShow() {
    app.loadWedding().then(w => {
      if (!w) {
        this.setData({ loaded: true, wedding: null })
        return
      }
      if (!app.isOwner()) {
        wx.showToast({ title: '只有主人能查看', icon: 'none' })
        wx.navigateBack({
          fail: () => wx.reLaunch({ url: '/pages/home/index' })
        })
        return
      }
      this.setData({ loaded: true, wedding: w })
      this.load(w._id)
    })
  },

  load(weddingId) {
    Promise.all([store.listRSVPs(weddingId), store.listBlessings(weddingId)]).then(([rsvps, blessings]) => {
      const stats = { total: rsvps.length, attend: 0, maybe: 0, decline: 0, seats: 0 }
      rsvps.forEach(r => {
        if (r.attendance === 'attend') { stats.attend++; stats.seats += r.count || 1 }
        else if (r.attendance === 'maybe') stats.maybe++
        else if (r.attendance === 'decline') stats.decline++
      })
      this.setData({
        stats,
        rsvps: rsvps.map(r => ({ ...r, timeText: formatTime(r.createdAt) })),
        blessings: blessings.map(b => ({ ...b, timeText: formatTime(b.createdAt) }))
      })
    }).catch(() => {
      wx.showToast({ title: '统计加载失败，稍后再试', icon: 'none' })
    })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' })
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/home/index' })
    })
  },

  onShareAppMessage() {
    return app.share()
  }
})
