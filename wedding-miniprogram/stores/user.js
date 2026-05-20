import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DEFAULT_ENTITLEMENTS, getPlanTier, normalizeEntitlements } from '@/utils/commercial.js'

export const useUserStore = defineStore('user', () => {
  // State
  const openid = ref('')
  const phone = ref('')
  const isOwner = ref(false)
  const weddingId = ref('')
  const ownerVerified = ref(false)
  const profile = ref({ nickname: '', phone: '', role: '主人' })
  const plan = ref('free')
  const entitlements = ref({ ...DEFAULT_ENTITLEMENTS })
  const workspaces = ref([])

  // Getters
  const isLoggedIn = computed(() => !!openid.value)
  const canEdit = computed(() => isOwner.value && ownerVerified.value)
  const planTier = computed(() => getPlanTier(plan.value))
  const hasPremiumTemplate = computed(() => entitlements.value.premium_templates === true)

  // Actions
  function setUser(info) {
    openid.value = info.openid || ''
    phone.value = info.phone || ''
    isOwner.value = info.isOwner || false
    weddingId.value = info.weddingId || ''
    if (info.ownerVerified !== undefined) {
      ownerVerified.value = info.ownerVerified
    }
    if (info.profile) {
      profile.value = { ...profile.value, ...info.profile }
    }
    if (info.plan) {
      plan.value = info.plan
    }
    if (info.entitlements) {
      entitlements.value = normalizeEntitlements(info.entitlements)
    }
    if (Array.isArray(info.workspaces)) {
      workspaces.value = info.workspaces
    }
  }

  function setOwnerProfile(info = {}) {
    if (info.openid) openid.value = info.openid
    if (info.phone) phone.value = info.phone
    profile.value = {
      ...profile.value,
      ...(info.profile || {})
    }
    if (profile.value.phone) {
      phone.value = profile.value.phone
    }
    plan.value = info.plan || plan.value || 'free'
    entitlements.value = normalizeEntitlements(info.entitlements)
    workspaces.value = Array.isArray(info.workspaces) ? info.workspaces : workspaces.value
    isOwner.value = true
    ownerVerified.value = true
    saveToStorage()
  }

  function hasEntitlement(key) {
    return entitlements.value?.[key] === true
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
      ownerVerified: ownerVerified.value,
      profile: profile.value,
      plan: plan.value,
      entitlements: entitlements.value,
      workspaces: workspaces.value
    }))
  }

  function logout() {
    openid.value = ''
    phone.value = ''
    isOwner.value = false
    weddingId.value = ''
    ownerVerified.value = false
    profile.value = { nickname: '', phone: '', role: '主人' }
    plan.value = 'free'
    entitlements.value = { ...DEFAULT_ENTITLEMENTS }
    workspaces.value = []
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('currentWeddingId')
  }

  return {
    openid,
    phone,
    isOwner,
    weddingId,
    ownerVerified,
    profile,
    plan,
    entitlements,
    workspaces,
    isLoggedIn,
    canEdit,
    planTier,
    hasPremiumTemplate,
    setUser,
    setOwnerProfile,
    hasEntitlement,
    verifyOwner,
    setWeddingId,
    loadFromStorage,
    saveToStorage,
    logout
  }
})
