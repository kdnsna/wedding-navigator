const config = require('./config/app')
const store = require('./services/store')

const LAST_KEY = 'sw_last_wedding'    // 本机记住「上次打开的请柬」
const WEDDING_TTL = 60 * 1000         // 婚礼数据缓存 60 秒，过期自动重取

App({
  globalData: {
    config,
    cloudOn: false,
    weddingId: '',      // 当前打开的婚礼
    wedding: null,      // 当前婚礼完整数据
    weddingAt: 0,       // 婚礼数据取回时间（TTL 刷新用）
    weddingFromRestore: false, // weddingId 是否来自本机记忆（拉取失败时清理）
    myWeddings: [],     // 我的婚礼列表（主人身份判断用）
    myWeddingsReady: false,
    statusBarHeight: 24
  },

  onLaunch(options) {
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this.globalData.statusBarHeight = info.statusBarHeight || 24
    } catch (e) { /* 保持默认值 */ }

    if (config.cloudEnv && wx.cloud) {
      try {
        wx.cloud.init({ env: config.cloudEnv, traceUser: true })
        this.globalData.cloudOn = true
      } catch (e) {
        console.warn('[甜囍手册] 云开发初始化失败', e)
      }
    }

    // 分享卡片进入：?w=weddingId；否则沿用本机上次打开的请柬
    const w = options && options.query && options.query.w
    if (w) {
      this.globalData.weddingId = w
      this.globalData.weddingFromRestore = false
      return
    }
    try {
      const last = wx.getStorageSync(LAST_KEY)
      if (last) {
        this.globalData.weddingId = last
        this.globalData.weddingFromRestore = true
      }
    } catch (e) { /* 没有记忆就留空 */ }
  },

  /** 热启动：从后台回来时点了另一个分享卡片 */
  onShow(options) {
    const w = options && options.query && options.query.w
    const g = this.globalData
    if (w && w !== g.weddingId) {
      g.weddingId = w
      g.wedding = null
      g.weddingAt = 0
      g.weddingFromRestore = false
    }
  },

  /**
   * 加载当前婚礼到 globalData，各页面统一走这里。
   * 返回 Promise<wedding|null>；同时保证「我的婚礼」列表就绪（主人身份判断用）。
   */
  loadWedding(force) {
    const g = this.globalData
    if (!g.cloudOn || !g.weddingId) return Promise.resolve(null)
    if (!force && g.wedding && g.wedding._id === g.weddingId &&
        Date.now() - g.weddingAt < WEDDING_TTL) {
      return this.ensureMine().then(() => g.wedding)
    }
    return store.getWedding(g.weddingId).then(w => {
      g.wedding = w
      g.weddingAt = Date.now()
      g.weddingFromRestore = false
      try { wx.setStorageSync(LAST_KEY, w._id) } catch (e) { /* 忽略 */ }
      return this.ensureMine().then(() => w)
    }).catch(() => {
      // 本机记忆里的请柬拉不到（多半已被删除）：清掉记忆，回到空态
      if (g.weddingFromRestore) {
        try { wx.removeStorageSync(LAST_KEY) } catch (e) { /* 忽略 */ }
        g.weddingId = ''
        g.weddingFromRestore = false
      }
      return null
    })
  },

  /** 拉取「我的婚礼」列表（每次调用都刷新） */
  refreshMine() {
    const g = this.globalData
    if (!g.cloudOn) return Promise.resolve(g.myWeddings)
    return store.listMyWeddings().then(list => {
      g.myWeddings = list
      g.myWeddingsReady = true
      return list
    })
  },

  /** 首次需要时拉一次「我的婚礼」列表并缓存 */
  ensureMine() {
    const g = this.globalData
    if (g.myWeddingsReady) return Promise.resolve(g.myWeddings)
    return this.refreshMine().catch(() => g.myWeddings)
  },

  /** 当前用户是否为当前婚礼的主人 */
  isOwner() {
    const g = this.globalData
    return !!(g.weddingId && g.myWeddings.some(w => w._id === g.weddingId))
  },

  /** 打开某场婚礼（主人从列表进入 / 创建后进入） */
  openWedding(id) {
    const g = this.globalData
    g.weddingId = id
    g.wedding = null
    g.weddingAt = 0
    g.weddingFromRestore = false
    try { wx.setStorageSync(LAST_KEY, id) } catch (e) { /* 忽略 */ }
    wx.switchTab({ url: '/pages/invite/index' })
  },

  /** 婚礼被删除后的本地清理 */
  forgetWedding(id) {
    const g = this.globalData
    if (g.weddingId === id) {
      g.weddingId = ''
      g.wedding = null
      g.weddingAt = 0
    }
    g.myWeddings = g.myWeddings.filter(w => w._id !== id)
    try {
      if (wx.getStorageSync(LAST_KEY) === id) wx.removeStorageSync(LAST_KEY)
    } catch (e) { /* 忽略 */ }
  },

  /** 统一分享卡片：分享的永远是请柬，而不是当前所在的管理页 */
  share() {
    const g = this.globalData
    const w = g.wedding
    if (w && w.couple) {
      return {
        title: `${w.couple.groom} & ${w.couple.bride} · 诚邀您见证我们的婚礼`,
        path: `/pages/invite/index?w=${w._id}`
      }
    }
    return {
      title: `${g.config.product.name} · ${g.config.product.slogan}`,
      path: '/pages/home/index'
    }
  }
})
