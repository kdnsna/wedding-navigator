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
      if (!w) {
        this.setData({ loaded: true, wedding: null, photos: [], urls: [] })
        return
      }
      // 免费版云存储仅创建者可读，照片经 getPhotos 云函数换取临时链接
      wx.cloud.callFunction({
        name: 'getPhotos',
        data: { weddingId: w._id }
      }).then(res => {
        const photos = (res.result && res.result.photos) || []
        const pad = n => (n < 10 ? '0' + n : '' + n)
        const total = pad(photos.length)
        this.setData({
          loaded: true,
          wedding: w,
          photos: photos.map((p, i) => ({ ...p, num: `${pad(i + 1)} / ${total}` })),
          urls: photos.map(p => p.url)
        }, () => this.observe())
      }).catch(() => {
        this.setData({ loaded: true, wedding: w, photos: [], urls: [] })
      })
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
