const app = getApp()
const store = require('../../services/store')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

/** 多行文本 → 数组（按换行拆分，过滤空行） */
function splitLines(text) {
  return (text || '').split('\n').map(s => s.trim()).filter(Boolean)
}

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    isEdit: false,
    weddingId: '',
    photos: [],        // 编辑模式保留原照片
    // 基本信息
    groom: '',
    bride: '',
    invite: '',
    // 日期时间
    dateISO: '',       // YYYY-MM-DD
    time: '',          // HH:mm
    lunar: '',
    // 场地
    venueName: '',
    address: '',
    latitude: 0,
    longitude: 0,
    venuePhone: '',
    // 流程 / 路书 / 回执
    timeline: [],      // [{ time, title, note }]
    transportText: '',
    parkingText: '',
    tipsText: '',
    rsvpDeadline: '',
    rsvpNote: '',
    saving: false
  },

  onLoad(options) {
    // ?new=1 = 创建模式；?w= 或当前已打开的婚礼 = 编辑模式（主人台入口不带参数）
    if (options && options.new) {
      this.initCreate()
      return
    }
    const id = (options && options.w) || app.globalData.weddingId
    if (id) {
      this.loadForEdit(id)
      return
    }
    this.initCreate()
  },

  /** 创建模式：预填 config.defaults 模板 */
  initCreate() {
    const def = app.globalData.config.defaults
    this.setData({
      invite: def.invite,
      timeline: def.timeline.map(t => ({ time: t.time, title: t.title, note: t.note })),
      transportText: def.guide.transport.join('\n'),
      parkingText: def.guide.parking.join('\n'),
      tipsText: def.guide.tips.join('\n'),
      rsvpDeadline: def.rsvp.deadline,
      rsvpNote: def.rsvp.note
    })
  },

  /* ---------- 编辑模式 ---------- */

  loadForEdit(id) {
    app.globalData.weddingId = id
    app.loadWedding(true).then(w => {
      if (!w) {
        wx.showToast({ title: '婚礼加载失败', icon: 'none' })
        this.goBack()
        return
      }
      if (!app.isOwner()) {
        wx.showToast({ title: '只有主人能编辑', icon: 'none' })
        this.goBack()
        return
      }
      const couple = w.couple || {}
      const date = w.date || {}
      const venue = w.venue || {}
      const guide = w.guide || {}
      const rsvp = w.rsvp || {}
      // date.time 存的是「上午 11:58 仪式开始」，提取 HH:mm 回填 picker
      const timeMatch = (date.time || '').match(/\d{2}:\d{2}/)
      this.setData({
        isEdit: true,
        weddingId: w._id,
        photos: w.photos || [],
        groom: couple.groom || '',
        bride: couple.bride || '',
        invite: couple.invite || '',
        dateISO: date.dateISO || '',
        time: timeMatch ? timeMatch[0] : '',
        lunar: date.lunar || '',
        venueName: venue.name || '',
        address: venue.address || '',
        latitude: venue.latitude || 0,
        longitude: venue.longitude || 0,
        venuePhone: venue.phone || '',
        timeline: (w.timeline || []).map(t => ({
          time: t.time || '',
          title: t.title || '',
          note: t.note || ''
        })),
        transportText: (guide.transport || []).join('\n'),
        parkingText: (guide.parking || []).join('\n'),
        tipsText: (guide.tips || []).join('\n'),
        rsvpDeadline: rsvp.deadline || '',
        rsvpNote: rsvp.note || ''
      })
    })
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/home/index' })
    })
  },

  /* ---------- 输入 ---------- */

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ dateISO: e.detail.value })
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value })
  },

  chooseVenue() {
    wx.chooseLocation({
      success: res => {
        this.setData({
          venueName: res.name || this.data.venueName,
          address: res.address || this.data.address,
          latitude: res.latitude,
          longitude: res.longitude
        })
      }
    })
  },

  /* ---------- 流程行编辑器 ---------- */

  onTimelineTime(e) {
    const i = e.currentTarget.dataset.index
    this.setData({ ['timeline[' + i + '].time']: e.detail.value })
  },

  onTimelineTitle(e) {
    const i = e.currentTarget.dataset.index
    this.setData({ ['timeline[' + i + '].title']: e.detail.value })
  },

  onTimelineNote(e) {
    const i = e.currentTarget.dataset.index
    this.setData({ ['timeline[' + i + '].note']: e.detail.value })
  },

  addTimeline() {
    this.setData({
      timeline: this.data.timeline.concat([{ time: '', title: '', note: '' }])
    })
  },

  removeTimeline(e) {
    const timeline = this.data.timeline.slice()
    timeline.splice(e.currentTarget.dataset.index, 1)
    this.setData({ timeline })
  },

  /* ---------- 保存 ---------- */

  save() {
    const d = this.data
    if (d.saving) return

    const groom = d.groom.trim()
    const bride = d.bride.trim()
    const venueName = d.venueName.trim()
    if (!groom) return wx.showToast({ title: '请填写新郎姓名', icon: 'none' })
    if (!bride) return wx.showToast({ title: '请填写新娘姓名', icon: 'none' })
    if (!d.dateISO) return wx.showToast({ title: '请选择婚礼日期', icon: 'none' })
    if (!venueName) return wx.showToast({ title: '请填写场地名称', icon: 'none' })

    const parts = d.dateISO.split('-')
    const year = +parts[0]
    const month = +parts[1]
    const day = +parts[2]
    const weekday = '星期' + WEEKDAYS[new Date(year, month - 1, day).getDay()]

    let timeText = ''
    if (d.time) {
      const hour = +d.time.split(':')[0]
      const period = hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上'
      timeText = period + ' ' + d.time + ' 仪式开始'
    }

    const timeline = d.timeline
      .map(t => ({ time: t.time, title: (t.title || '').trim(), note: (t.note || '').trim() }))
      .filter(t => t.time || t.title)

    const doc = {
      couple: { groom, bride, invite: d.invite.trim() },
      date: {
        dateISO: d.dateISO,
        display: year + '.' + pad2(month) + '.' + pad2(day),
        lunar: d.lunar.trim(),
        weekday,
        time: timeText
      },
      venue: {
        name: venueName,
        address: d.address.trim(),
        latitude: d.latitude,
        longitude: d.longitude,
        phone: d.venuePhone.trim()
      },
      timeline,
      guide: {
        transport: splitLines(d.transportText),
        parking: splitLines(d.parkingText),
        tips: splitLines(d.tipsText)
      },
      rsvp: { deadline: d.rsvpDeadline.trim(), note: d.rsvpNote.trim() },
      photos: d.photos
    }

    this.setData({ saving: true })
    const req = d.isEdit
      ? store.updateWedding(d.weddingId, doc).then(() => d.weddingId)
      : store.createWedding(doc)

    req.then(id => {
      return store.listMyWeddings()
        .then(list => { app.globalData.myWeddings = list })
        .catch(() => {})
        .then(() => {
          wx.showToast({ title: '已保存' })
          app.openWedding(id)
        })
    }).catch(() => {
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    })
  }
})
