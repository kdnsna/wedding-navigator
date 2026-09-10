const app = getApp()
const store = require('../../services/store')

const OPTIONS = [
  { value: 'attend', label: '出席' },
  { value: 'maybe', label: '待定' },
  { value: 'decline', label: '遗憾缺席' }
]

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    loaded: false,
    wedding: null,
    options: OPTIONS,
    name: '',
    attendance: 'attend',
    count: 1,
    note: '',
    submitting: false,
    submitted: false,
    mine: null      // 我已提交的回执；存在则再次提交时更新它而不是重复新增
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
      this.setData({ loaded: true, wedding: w })
      if (w) this.loadMine()
    })
  },

  /** 拉取「我的回执」：已提交过则回填表单 */
  loadMine() {
    store.getMyRSVP(app.globalData.weddingId).then(mine => {
      if (!mine) return
      this.setData({
        mine,
        name: mine.name || '',
        attendance: mine.attendance || 'attend',
        count: mine.count || 1,
        note: mine.note || ''
      })
    }).catch(() => {})
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/home/index' })
    })
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  choose(e) {
    this.setData({ attendance: e.currentTarget.dataset.value })
  },

  countMinus() {
    if (this.data.count > 1) this.setData({ count: this.data.count - 1 })
  },

  countPlus() {
    if (this.data.count < 10) this.setData({ count: this.data.count + 1 })
  },

  submit() {
    if (!this.data.wedding) return
    const name = this.data.name.trim()
    if (!name) {
      wx.showToast({ title: '请留下你的姓名', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const attendanceLabel = OPTIONS.find(o => o.value === this.data.attendance).label
    const payload = {
      name,
      attendance: this.data.attendance,
      attendanceLabel,
      count: this.data.attendance === 'attend' ? this.data.count : 0,
      note: this.data.note.trim()
    }
    const req = this.data.mine
      ? store.updateRSVP(this.data.mine._id, payload)
      : store.submitRSVP(app.globalData.weddingId, payload)

    req.then(() => {
      this.setData({ submitting: false, submitted: true })
    }).catch(() => {
      this.setData({ submitting: false })
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
    })
  },

  backHome() {
    wx.switchTab({ url: '/pages/invite/index' })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' })
  },

  onShareAppMessage() {
    return app.share()
  }
})
