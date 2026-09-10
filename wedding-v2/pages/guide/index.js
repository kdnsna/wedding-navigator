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
    const v = w.venue || {}
    const latitude = Number(v.latitude)
    const longitude = Number(v.longitude)
    if (!latitude || !longitude) {
      wx.showToast({ title: '场地坐标还没设置，请新人在编辑页用「在地图上选择」补上', icon: 'none' })
      return
    }
    wx.openLocation({
      latitude,
      longitude,
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
    return app.share()
  }
})
