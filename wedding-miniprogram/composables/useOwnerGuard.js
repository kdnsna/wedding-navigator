import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { checkOwnership, fetchWedding } from '@/composables/useCloud.js'

export async function useOwnerGuard() {
  const userStore = useUserStore()
  const weddingStore = useWeddingStore()

  if (!userStore.weddingId) {
    uni.showModal({
      title: '尚未创建婚礼',
      content: '请先完成创建向导，再进入主人端管理。',
      confirmText: '去创建',
      showCancel: false,
      success: () => {
        goCreateWizard()
      }
    })
    return false
  }

  if (userStore.isOwner && userStore.ownerVerified) {
    loadWeddingIfNeeded(userStore, weddingStore)
    return true
  }

  return verifyAndGuard(userStore, weddingStore)
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
      return true
    } else {
      userStore.verifyOwner(false)
      uni.showModal({
        title: '无权限',
        content: '仅婚礼主人可访问此页面',
        showCancel: false,
        success: () => {
          goGuestHome()
        }
      })
      return false
    }
  } catch (err) {
    console.warn('所有权验证失败:', err)
    if (userStore.isOwner) {
      uni.showToast({ title: '主人权限暂未完成云端校验', icon: 'none' })
      loadWeddingIfNeeded(userStore, weddingStore)
      return true
    }
    return showOwnerVerificationFailure(userStore, weddingStore)
  }
}

function showOwnerVerificationFailure(userStore, weddingStore) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '权限校验失败',
      content: '暂时无法确认您是婚礼主人，请检查网络后重试。',
      confirmText: '重试',
      cancelText: '返回首页',
      success: async (res) => {
        if (res.confirm) {
          resolve(await verifyAndGuard(userStore, weddingStore))
        } else {
          goGuestHome()
          resolve(false)
        }
      },
      fail: () => {
        goGuestHome()
        resolve(false)
      }
    })
  })
}

function goCreateWizard() {
  uni.navigateTo({
    url: '/pages-owner/wizard/index',
    fail: (err) => {
      console.warn('主人守卫打开创建向导失败:', err)
      uni.showToast({ title: '创建向导打开失败，请稍后重试', icon: 'none' })
    }
  })
}

function goGuestHome() {
  uni.reLaunch({
    url: '/pages/index/index',
    fail: (err) => {
      console.warn('主人守卫返回首页失败:', err)
      uni.showToast({ title: '返回首页失败，请稍后重试', icon: 'none' })
    }
  })
}
