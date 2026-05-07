import { useUserStore } from '@/stores/user.js'
import { checkOwnership } from '@/composables/useCloud.js'

export function useOwnerGuard() {
  const userStore = useUserStore()

  if (userStore.isOwner && userStore.ownerVerified && userStore.weddingId) {
    return true
  }

  if (!userStore.weddingId) {
    uni.showModal({
      title: '提示',
      content: '请先创建婚礼',
      showCancel: false,
      success: () => {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    })
    return false
  }

  verifyAndGuard(userStore)
  return true
}

async function verifyAndGuard(userStore) {
  try {
    const res = await checkOwnership(userStore.weddingId)
    if (res?.success && res.isOwner) {
      userStore.verifyOwner(true)
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
  }
}
