const app = getApp()

Page({
  data: {
    config: app.globalData.config,
    statusBarHeight: app.globalData.statusBarHeight,
    cloudOn: false,
    myWeddings: [],
    loading: true,
    failed: false
  },

  onShow() {
    const cloudOn = app.globalData.cloudOn
    this.setData({ cloudOn })
    if (!cloudOn) {
      this.setData({ loading: false })
      return
    }
    this.refresh()
  },

  refresh() {
    this.setData({ loading: true, failed: false })
    app.refreshMine().then(list => {
      this.setData({ myWeddings: list, loading: false })
    }).catch(() => {
      this.setData({ loading: false, failed: true })
    })
  },

  create() {
    wx.navigateTo({ url: '/pages/edit/index?new=1' })
  },

  openWedding(e) {
    app.openWedding(e.currentTarget.dataset.id)
  },

  onShareAppMessage() {
    return app.share()
  }
})
