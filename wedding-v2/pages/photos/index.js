const app = getApp()
const store = require('../../services/store')

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    ready: false,      // 云已开且已打开婚礼
    photos: [],
    uploading: false
  },

  onShow() {
    const g = app.globalData
    if (!g.cloudOn || !g.weddingId) {
      this.setData({ ready: false, photos: [] })
      return
    }
    if (!app.isOwner()) {
      wx.showToast({ title: '只有主人能管理照片', icon: 'none' })
      setTimeout(() => wx.navigateBack({ fail: () => {} }), 800)
      return
    }
    app.loadWedding(true).then(w => {
      this.setData({ ready: true, photos: (w && w.photos) || [] })
    })
  },

  /* ---------- 添加 ---------- */

  addPhotos() {
    if (this.data.uploading) return
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      success: res => {
        const paths = (res.tempFiles || []).map(f => f.tempFilePath)
        this.uploadAll(paths)
      }
    })
  },

  compress(src) {
    return new Promise(resolve => {
      wx.compressImage({
        src,
        quality: 80,
        success: r => resolve(r.tempFilePath),
        fail: () => resolve(src)   // 压缩失败则用原图
      })
    })
  },

  uploadAll(paths) {
    const total = paths.length
    if (!total) return
    const weddingId = app.globalData.weddingId
    const added = []
    let failed = 0
    this.setData({ uploading: true })

    let chain = Promise.resolve()
    paths.forEach((p, i) => {
      chain = chain.then(() => {
        wx.showLoading({ title: `第${i + 1}/${total}张`, mask: true })
        return this.compress(p)
          .then(cp => store.uploadPhoto(weddingId, cp))
          .then(fileID => { added.push({ fileID, caption: '' }) })
          .catch(() => { failed += 1 })
      })
    })

    chain.then(() => {
      wx.hideLoading()
      this.setData({ uploading: false })
      if (!added.length) {
        wx.showToast({ title: '上传失败，请重试', icon: 'none' })
        return
      }
      const photos = this.data.photos.concat(added)
      store.updateWedding(weddingId, { photos }).then(() => {
        this.setData({ photos })
        wx.showToast({
          title: failed ? `已传${added.length}张，${failed}张失败` : '照片已更新',
          icon: 'none'
        })
      }).catch(() => {
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      })
    })
  },

  /* ---------- 编辑 / 删除 ---------- */

  onPhotoTap(e) {
    const index = e.currentTarget.dataset.index
    wx.showActionSheet({
      itemList: ['编辑图注', '删除这张照片'],
      success: res => {
        if (res.tapIndex === 0) this.editCaption(index)
        else if (res.tapIndex === 1) this.removePhoto(index)
      }
    })
  },

  editCaption(index) {
    const photo = this.data.photos[index]
    wx.showModal({
      title: '编辑图注',
      editable: true,
      placeholderText: '为这张照片写一句话',
      content: photo.caption || '',
      success: res => {
        if (!res.confirm) return
        const photos = this.data.photos.slice()
        photos[index] = { ...photo, caption: (res.content || '').trim() }
        this.savePhotos(photos, '图注已更新')
      }
    })
  },

  removePhoto(index) {
    wx.showModal({
      title: '删除这张照片',
      content: '删除后宾客将无法再看到它',
      confirmText: '删除',
      confirmColor: '#8E2F28',
      success: res => {
        if (!res.confirm) return
        const photos = this.data.photos.filter((_, i) => i !== index)
        this.savePhotos(photos, '已删除')
      }
    })
  },

  savePhotos(photos, okText) {
    wx.showLoading({ title: '保存中', mask: true })
    store.updateWedding(app.globalData.weddingId, { photos }).then(() => {
      wx.hideLoading()
      this.setData({ photos })
      wx.showToast({ title: okText, icon: 'none' })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    })
  },

  /* ---------- 导航 ---------- */

  goBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/home/index' })
    })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' })
  }
})
