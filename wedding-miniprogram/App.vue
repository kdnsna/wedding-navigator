<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user.js'

onLaunch(() => {
  useUserStore().loadFromStorage()
  if (!isDevToolsRuntime()) checkUpdate()
})

onShow(() => {})
onHide(() => {})

uni.onError((err) => {
  console.error('[Global Error]', err)
})

if (typeof uni.onUnhandledRejection === 'function') {
  uni.onUnhandledRejection((res) => {
    console.error('[Unhandled Rejection]', res.reason)
  })
}

function checkUpdate() {
  if (typeof uni.getUpdateManager !== 'function') return

  const updateManager = uni.getUpdateManager()
  updateManager.onCheckForUpdate((res) => {
    if (!res.hasUpdate) return

    updateManager.onUpdateReady(() => {
      uni.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        confirmText: '立即重启',
        cancelText: '稍后',
        success: (modalRes) => {
          if (modalRes.confirm) updateManager.applyUpdate()
        }
      })
    })
    updateManager.onUpdateFailed(() => {
      uni.showModal({
        title: '更新失败',
        content: '新版本下载失败，请检查网络后重试',
        showCancel: false
      })
    })
  })
}

function isDevToolsRuntime() {
  try {
    return typeof wx !== 'undefined' && wx.getDeviceInfo?.().platform === 'devtools'
  } catch (err) {
    return false
  }
}
</script>

<style lang="scss">
@import '@/styles/theme.scss';
@import '@/styles/global.scss';
</style>
