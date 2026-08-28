const app = getApp()
const store = require('../../services/store')

Page({
  data: {
    config: app.globalData.config,
    statusBarHeight: app.globalData.statusBarHeight,
    cloudOn: false,
    myWeddings: [],
    loading: true
  },

  onShow() {
    const cloudOn = app.globalData.cloudOn
    this.setData({ cloudOn })
    if (!cloudOn) {
      this.setData({ loading: false })
      return
    }
    this.setData({ loading: true })
    store.listMyWeddings().then(list => {
      app.globalData.myWeddings = list
      this.setData({ myWeddings: list, loading: false })
    }).catch(() => this.setData({ loading: false }))
  },

  create() {
    wx.navigateTo({ url: '/pages/edit/index?new=1' })
  },

  openWedding(e) {
    app.openWedding(e.currentTarget.dataset.id)
  }
})
