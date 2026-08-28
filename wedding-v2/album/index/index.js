const app = getApp()

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    loaded: false,
    wedding: null,
    photos: [],
    urls: [],
    vis: {}
  },

  onShow() {
    app.loadWedding().then(w => {
      const photos = (w && w.photos) || []
      const pad = n => (n < 10 ? '0' + n : '' + n)
      const total = pad(photos.length)
      this.setData({
        loaded: true,
        wedding: w,
        photos: photos.map((p, i) => ({ ...p, num: `${pad(i + 1)} / ${total}` })),
        urls: photos.map(p => p.fileID)
      }, () => this.observe())
    })
  },

  /** 滚动进入视口时淡入上浮（照片异步渲染，每次更新后重建观察器） */
  observe() {
    if (this._io) this._io.disconnect()
    const io = wx.createIntersectionObserver(this)
    io.relativeToViewport({ bottom: -20 }).observeAll('.photo-item', entries => {
      const patch = {}
      entries.forEach(e => {
        if (e.intersectionRatio > 0) patch[`vis[${e.dataset.i}]`] = true
      })
      if (Object.keys(patch).length) this.setData(patch)
    })
    this._io = io
  },

  preview(e) {
    const i = e.currentTarget.dataset.i
    wx.previewImage({ current: this.data.urls[i], urls: this.data.urls })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' })
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/invite/index' })
    })
  }
})
