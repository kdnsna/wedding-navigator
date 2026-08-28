const app = getApp()

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    loaded: false,
    wedding: null
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
      this.setData({ loaded: true, wedding: w })
    })

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  /** 调起系统地图导航到场地 */
  openLocation() {
    const w = this.data.wedding
    if (!w) return
    const v = w.venue
    wx.openLocation({
      latitude: v.latitude,
      longitude: v.longitude,
      name: v.name,
      address: v.address,
      scale: 16
    })
  },

  callVenue() {
    const w = this.data.wedding
    const phone = w && w.venue.phone
    if (phone) wx.makePhoneCall({ phoneNumber: phone })
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
