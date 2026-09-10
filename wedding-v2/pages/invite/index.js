const app = getApp()
const { daysUntil } = require('../../utils/date')

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    loaded: false,
    wedding: null,
    daysLeft: 0,
    isOwner: false
  },

  onLoad(options) {
    // 分享卡片带 ?w=weddingId 进入
    if (options && options.w) {
      app.globalData.weddingId = options.w
      app.globalData.wedding = null
      app.globalData.weddingAt = 0
      app.globalData.weddingFromRestore = false
    }
  },

  onShow() {
    app.loadWedding().then(w => {
      this.setData({
        loaded: true,
        wedding: w,
        daysLeft: w ? daysUntil(w.date.dateISO) : 0,
        isOwner: w ? app.isOwner() : false
      })
    })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  goHome() {
    wx.navigateTo({ url: '/pages/home/index' })
  },

  goOwner() {
    wx.navigateTo({ url: '/pages/owner/index' })
  },

  onShareAppMessage() {
    return app.share()
  },

  onShareTimeline() {
    const w = this.data.wedding
    return {
      title: w
        ? `${w.couple.groom} & ${w.couple.bride} · ${w.date.display} 诚邀见证`
        : '甜囍手册 · 制作你的婚礼请柬'
    }
  }
})
