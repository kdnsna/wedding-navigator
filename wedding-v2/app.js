const config = require('./config/app')
const store = require('./services/store')

App({
  globalData: {
    config,
    cloudOn: false,
    weddingId: '',      // 当前打开的婚礼
    wedding: null,      // 当前婚礼完整数据
    myWeddings: [],     // 我的婚礼列表（home 页填充，用于 isOwner 判断）
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

    // 分享卡片进入：?w=weddingId
    const w = options && options.query && options.query.w
    if (w) this.globalData.weddingId = w
  },

  /**
   * 加载当前婚礼到 globalData，各页面统一走这里。
   * 返回 Promise<wedding|null>，失败（不存在/无网络/未开云）返回 null。
   */
  loadWedding(force) {
    const g = this.globalData
    if (!g.cloudOn || !g.weddingId) return Promise.resolve(null)
    if (!force && g.wedding && g.wedding._id === g.weddingId) {
      return Promise.resolve(g.wedding)
    }
    return store.getWedding(g.weddingId).then(w => {
      g.wedding = w
      return w
    }).catch(() => null)
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
    wx.switchTab({ url: '/pages/invite/index' })
  }
})
