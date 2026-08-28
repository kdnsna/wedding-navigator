const app = getApp()
const store = require('../../services/store')
const { formatTime } = require('../../utils/date')

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    loaded: false,
    wedding: null,
    list: [],
    name: '',
    text: '',
    submitting: false
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
      this.setData({ loaded: true, wedding: w, list: [] })
      if (w) this.load()
    })

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  load() {
    store.listBlessings(app.globalData.weddingId).then(list => {
      this.setData({
        list: list.map(it => ({ ...it, timeText: formatTime(it.createdAt) }))
      })
    }).catch(() => {})
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onTextInput(e) {
    this.setData({ text: e.detail.value })
  },

  submit() {
    if (!this.data.wedding) return
    const text = this.data.text.trim()
    if (!text) {
      wx.showToast({ title: '先写一句祝福吧', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })

    store.addBlessing(app.globalData.weddingId, {
      name: this.data.name.trim() || '一位宾客',
      text
    }).then(() => {
      wx.showToast({ title: '祝福已送达', icon: 'success' })
      this.setData({ name: '', text: '', submitting: false })
      this.load()
    }).catch(() => {
      this.setData({ submitting: false })
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
    })
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
