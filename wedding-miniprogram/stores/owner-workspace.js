import { defineStore } from 'pinia'
import { ref } from 'vue'

const ACTIVE_KEY = 'ownerActiveWeddingId'
const LEGACY_KEY = 'currentWeddingId'

export const useOwnerWorkspaceStore = defineStore('ownerWorkspace', () => {
  const activeWeddingId = ref('')
  const workspaces = ref([])

  function setActiveWedding(id = '') {
    activeWeddingId.value = String(id || '')
    if (activeWeddingId.value) {
      uni.setStorageSync(ACTIVE_KEY, activeWeddingId.value)
    } else {
      uni.removeStorageSync(ACTIVE_KEY)
    }
  }

  function setWorkspaces(items = []) {
    workspaces.value = Array.isArray(items) ? items : []
    if (
      activeWeddingId.value &&
      !workspaces.value.some(item => String(item?.weddingId || '') === activeWeddingId.value)
    ) {
      setActiveWedding(workspaces.value[0]?.weddingId || '')
    }
  }

  function loadFromStorage(ownerVerified = false) {
    const current = uni.getStorageSync(ACTIVE_KEY) || ''
    if (current) {
      activeWeddingId.value = current
      return
    }

    const legacy = uni.getStorageSync(LEGACY_KEY) || ''
    if (legacy && ownerVerified) {
      setActiveWedding(legacy)
    }
    uni.removeStorageSync(LEGACY_KEY)
  }

  function clear() {
    activeWeddingId.value = ''
    workspaces.value = []
    uni.removeStorageSync(ACTIVE_KEY)
    uni.removeStorageSync(LEGACY_KEY)
  }

  return {
    activeWeddingId,
    workspaces,
    setActiveWedding,
    setWorkspaces,
    loadFromStorage,
    clear
  }
})
