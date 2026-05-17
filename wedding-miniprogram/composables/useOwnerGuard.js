import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { checkOwnership, fetchWedding } from '@/composables/useCloud.js'

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

  if (userStore.isOwner && userStore.ownerVerified) {
    loadWeddingIfNeeded(userStore, weddingStore)
    return true
  }

  verifyAndGuard(userStore, weddingStore)
  return true
}

function loadWeddingIfNeeded(userStore, weddingStore) {
  const hasLoadedWedding = Boolean(weddingStore.wedding?._id || weddingStore.wedding?.wedding_id)
  if (!hasLoadedWedding) {
    fetchWedding(userStore.weddingId).catch((err) => {
      console.warn('主人端婚礼数据加载失败:', err)
    })
  }
}

async function verifyAndGuard(userStore, weddingStore) {
  try {
    const res = await checkOwnership(userStore.weddingId)
    if (res?.success && res.isOwner) {
      userStore.verifyOwner(true)
      loadWeddingIfNeeded(userStore, weddingStore)
    } else {
      userStore.verifyOwner(false)
      uni.showModal({
        title: '无权限',
        content: '仅婚礼主人可访问此页面',
        showCancel: false,
        success: () => {
          uni.reLaunch({ url: '/pages/index/index' })
        }
      })
    }
  } catch (err) {
    console.warn('所有权验证失败，允许访问（云端会做最终校验）:', err)
    loadWeddingIfNeeded(userStore, weddingStore)
  }
}
