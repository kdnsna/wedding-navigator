import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { fetchWedding, syncOwnerProfile } from '@/composables/useCloud.js'

const WORKSPACE_SYNC_TTL = 60 * 1000
let workspaceSyncPromise = null
let lastWorkspaceSyncAt = 0

export async function useOwnerGuard(options = {}) {
  const userStore = useUserStore()
  const weddingStore = useWeddingStore()
  const {
    allowNoWedding = false,
    forceWorkspaceSync = false,
    forceWeddingRefresh = false
  } = options || {}

  try {
    await syncWorkspaceProfile(userStore, forceWorkspaceSync)
  } catch (err) {
    console.warn('主人工作区同步失败:', err)
    if (!userStore.ownerVerified && !userStore.ownerActiveWeddingId) {
      return showOwnerVerificationFailure(userStore, weddingStore, err)
    }
  }

  if (!userStore.ownerActiveWeddingId) {
    if (allowNoWedding && userStore.ownerVerified) return true
    weddingStore.setWeddingData({})
    return showMissingWedding('当前账号还没有可管理的婚书，请先完成四幕向导。')
  }

  const weddingId = userStore.ownerActiveWeddingId
  try {
    const res = await fetchWedding(weddingId, forceWeddingRefresh)
    if (res?.fromCache || isOwnerResult(res)) {
      userStore.verifyOwner(true)
      return true
    }
    return recoverUnavailableWorkspace(userStore, weddingStore, weddingId)
  } catch (err) {
    if (isUnavailableWeddingError(err)) {
      return recoverUnavailableWorkspace(userStore, weddingStore, weddingId)
    }
    console.warn('主人端婚礼数据加载失败:', err)
    if (weddingStore.isCacheValidFor(weddingId) && userStore.ownerVerified) {
      uni.showToast({ title: '当前显示上次保存的书案', icon: 'none' })
      return true
    }
    return showOwnerVerificationFailure(userStore, weddingStore, err)
  }
}

async function syncWorkspaceProfile(userStore, force = false) {
  const cacheFresh = Date.now() - lastWorkspaceSyncAt < WORKSPACE_SYNC_TTL
  if (!force && cacheFresh && userStore.ownerVerified) return true
  if (workspaceSyncPromise) return workspaceSyncPromise

  workspaceSyncPromise = syncOwnerProfile()
    .then((res) => {
      if (!res?.success) throw new Error(res?.message || '主人账号同步失败')
      userStore.setOwnerProfile(res)
      lastWorkspaceSyncAt = Date.now()
      return true
    })
    .finally(() => {
      workspaceSyncPromise = null
    })
  return workspaceSyncPromise
}

function isOwnerResult(res) {
  return Boolean(res?.isOwner || res?.data?.isOwner || res?.data?.is_owner)
}

function isUnavailableWeddingError(err) {
  const message = String(err?.message || '')
  return err?.code === 'NOT_FOUND' || message.includes('婚礼不存在') || message.includes('无权限')
}

async function recoverUnavailableWorkspace(userStore, weddingStore, failedWeddingId) {
  try {
    await syncWorkspaceProfile(userStore, true)
  } catch (err) {
    return showOwnerVerificationFailure(userStore, weddingStore, err)
  }

  const recoveredWeddingId = userStore.ownerActiveWeddingId
  weddingStore.setWeddingData({})
  if (recoveredWeddingId && recoveredWeddingId !== failedWeddingId) {
    try {
      const res = await fetchWedding(recoveredWeddingId, true)
      if (isOwnerResult(res)) {
        userStore.verifyOwner(true)
        uni.showToast({ title: '已切换到可用婚书', icon: 'none' })
        return true
      }
    } catch (err) {
      console.warn('恢复主人工作区失败:', err)
    }
  }

  userStore.setOwnerActiveWeddingId('')
  weddingStore.setWeddingData({})
  return showMissingWedding('原婚书已经失效，当前账号下也没有其他可用婚书。')
}

function showMissingWedding(content) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '书案需要重新落笔',
      content,
      confirmText: '创建婚书',
      showCancel: false,
      success: () => {
        goCreateWizard()
        resolve(false)
      },
      fail: () => resolve(false)
    })
  })
}

function showOwnerVerificationFailure(userStore, weddingStore, cause) {
  const message = String(cause?.message || '')
  return new Promise((resolve) => {
    uni.showModal({
      title: '书案暂时无法核验',
      content: message.includes('超时')
        ? '云端响应超时，请检查网络后重试。'
        : '暂时无法确认主人工作区，请检查网络后重试。',
      confirmText: '重试',
      cancelText: '返回首页',
      success: async (res) => {
        if (res.confirm) {
          resolve(await useOwnerGuard({ forceWorkspaceSync: true, forceWeddingRefresh: true }))
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
  uni.reLaunch({
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
