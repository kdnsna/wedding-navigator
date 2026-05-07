import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const openid = ref('')
  const phone = ref('')
  const isOwner = ref(false)
  const weddingId = ref('')
  const ownerVerified = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!openid.value)
  const canEdit = computed(() => isOwner.value && ownerVerified.value)

  // Actions
  function setUser(info) {
    openid.value = info.openid || ''
    phone.value = info.phone || ''
    isOwner.value = info.isOwner || false
    weddingId.value = info.weddingId || ''
    if (info.ownerVerified !== undefined) {
      ownerVerified.value = info.ownerVerified
    }
  }

  function verifyOwner(verified) {
    isOwner.value = verified
    ownerVerified.value = verified
    saveToStorage()
  }

  function setWeddingId(id) {
    weddingId.value = id
    uni.setStorageSync('currentWeddingId', id)
    saveToStorage()
  }

  function loadFromStorage() {
    try {
      const stored = uni.getStorageSync('userInfo')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('读取用户缓存失败，清除损坏数据:', e)
      uni.removeStorageSync('userInfo')
    }
    weddingId.value = uni.getStorageSync('currentWeddingId') || ''
  }

  function saveToStorage() {
    uni.setStorageSync('userInfo', JSON.stringify({
      openid: openid.value,
      phone: phone.value,
      isOwner: isOwner.value,
      weddingId: weddingId.value,
      ownerVerified: ownerVerified.value
    }))
  }

  function logout() {
    openid.value = ''
    phone.value = ''
    isOwner.value = false
    weddingId.value = ''
    ownerVerified.value = false
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('currentWeddingId')
  }

  return {
    openid,
    phone,
    isOwner,
    weddingId,
    ownerVerified,
    isLoggedIn,
    canEdit,
    setUser,
    verifyOwner,
    setWeddingId,
    loadFromStorage,
    saveToStorage,
    logout
  }
})
