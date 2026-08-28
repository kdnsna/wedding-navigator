Component({
  data: {
    selected: 0,
    list: [
      { path: '/pages/invite/index', text: '请柬', icon: '/assets/tab/invite.png', iconOn: '/assets/tab/invite-on.png' },
      { path: '/pages/timeline/index', text: '流程', icon: '/assets/tab/timeline.png', iconOn: '/assets/tab/timeline-on.png' },
      { path: '/pages/guide/index', text: '路书', icon: '/assets/tab/guide.png', iconOn: '/assets/tab/guide-on.png' },
      { path: '/pages/blessing/index', text: '祝福', icon: '/assets/tab/blessing.png', iconOn: '/assets/tab/blessing-on.png' }
    ]
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      if (index === this.data.selected) return
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    }
  }
})
