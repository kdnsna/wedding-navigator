const TAB_STATE_KEY = 'guestTabBarState'
const ALL_ITEMS = [
  { path: '/pages/index/index', text: '请柬', key: 'home' },
  { path: '/pages/rsvp/index', text: '赴约', key: 'rsvp' },
  { path: '/pages/guide/index', text: '路书', key: 'guide' },
  { path: '/pages/more/index', text: '更多', key: 'more' }
]

Component({
  data: {
    visible: false,
    selectedPath: '',
    selectedColor: '#8A3B45',
    items: []
  },
  lifetimes: {
    attached() {
      this.syncFromStorage()
    }
  },
  pageLifetimes: {
    show() {
      this.syncFromStorage()
    }
  },
  methods: {
    syncFromStorage() {
      const state = wx.getStorageSync(TAB_STATE_KEY) || {}
      const pages = getCurrentPages()
      const route = pages[pages.length - 1]?.route || ''
      const selectedPath = route ? `/${route}` : ''
      const items = ALL_ITEMS.filter(item => {
        if (item.key === 'rsvp') return state.showRsvp !== false
        if (item.key === 'guide') return state.showGuide !== false
        return true
      })
      this.setData({
        visible: state.visible === true,
        selectedPath,
        selectedColor: state.selectedColor || '#8A3B45',
        items
      })
    },
    switchTab(event) {
      const path = event.currentTarget.dataset.path
      if (!path || path === this.data.selectedPath) return
      wx.switchTab({ url: path })
    }
  }
})
