import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { fetchWedding } from '@/composables/useCloud.js'

/**
 * 主人端页面权限守卫
 * 实际权限校验由云函数通过 openid 完成，前端仅做状态标记
 */
export function useOwnerGuard() {
  const userStore = useUserStore()
  const weddingStore = useWeddingStore()

  if (!userStore.weddingId) {
    uni.showModal({
      title: '尚未创建婚礼',
      content: '请先完成创建向导，再进入主人端管理。',
      confirmText: '去创建',
      showCancel: false,
      success: () => {
        uni.navigateTo({ url: '/pages-owner/wizard/index' })
      }
    })
    return false
  }

  if (!userStore.ownerVerified) {
    uni.showToast({ title: '请使用主人身份进入管理后台', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages-owner/wizard/index' })
    }, 600)
    return false
  }

  const hasLoadedWedding = Boolean(weddingStore.wedding?._id || weddingStore.wedding?.wedding_id)
  if (!hasLoadedWedding) {
    fetchWedding(userStore.weddingId).catch((err) => {
      console.warn('主人端婚礼数据加载失败:', err)
    })
  }

  return true
}
