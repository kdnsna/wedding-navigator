import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DEFAULT_ENTITLEMENTS, getPlanTier, normalizeEntitlements } from '@/utils/commercial.js'
import { useOwnerWorkspaceStore } from '@/stores/owner-workspace.js'

export const useUserStore = defineStore('user', () => {
  const ownerWorkspace = useOwnerWorkspaceStore()
  const openid = ref('')
  const phone = ref('')
  const isOwner = ref(false)
  const ownerVerified = ref(false)
  const profile = ref({ nickname: '', phone: '', role: '主人' })
  const plan = ref('free')
  const entitlements = ref({ ...DEFAULT_ENTITLEMENTS })

  const ownerActiveWeddingId = computed(() => ownerWorkspace.activeWeddingId)
  const weddingId = ownerActiveWeddingId
  const workspaces = computed(() => ownerWorkspace.workspaces)
  const isLoggedIn = computed(() => Boolean(openid.value))
  const canEdit = computed(() => isOwner.value && ownerVerified.value)
  const planTier = computed(() => getPlanTier(plan.value))
  const hasPremiumTemplate = computed(() => entitlements.value.premium_templates === true)

  function setUser(info = {}) {
    openid.value = info.openid || ''
    phone.value = info.phone || ''
    isOwner.value = Boolean(info.isOwner)
    ownerVerified.value = info.ownerVerified === true
    if (info.profile) profile.value = { ...profile.value, ...info.profile }
    if (info.plan) plan.value = info.plan
    if (info.entitlements) entitlements.value = normalizeEntitlements(info.entitlements)
    if (Array.isArray(info.workspaces)) {
      ownerWorkspace.setWorkspaces(info.workspaces)
      if (ownerVerified.value && !ownerWorkspace.activeWeddingId && info.workspaces[0]?.weddingId) {
        ownerWorkspace.setActiveWedding(info.workspaces[0].weddingId)
      }
    }

    const activeId = info.ownerActiveWeddingId || (ownerVerified.value ? info.weddingId : '')
    if (activeId) ownerWorkspace.setActiveWedding(activeId)
  }

  function setOwnerProfile(info = {}) {
    if (info.openid) openid.value = info.openid
    if (info.phone) phone.value = info.phone
    profile.value = { ...profile.value, ...(info.profile || {}) }
    if (profile.value.phone) phone.value = profile.value.phone
    plan.value = info.plan || plan.value || 'free'
    entitlements.value = normalizeEntitlements(info.entitlements)
    if (Array.isArray(info.workspaces)) {
      ownerWorkspace.setWorkspaces(info.workspaces)
      if (!ownerWorkspace.activeWeddingId && info.workspaces[0]?.weddingId) {
        ownerWorkspace.setActiveWedding(info.workspaces[0].weddingId)
      }
    }
    if (info.ownerActiveWeddingId) ownerWorkspace.setActiveWedding(info.ownerActiveWeddingId)
    isOwner.value = true
    ownerVerified.value = true
    saveToStorage()
  }

  function hasEntitlement(key) {
    return entitlements.value?.[key] === true
  }

  function verifyOwner(verified) {
    isOwner.value = Boolean(verified)
    ownerVerified.value = Boolean(verified)
    saveToStorage()
  }

  function setOwnerActiveWeddingId(id) {
    ownerWorkspace.setActiveWedding(id)
    saveToStorage()
  }

  // Compatibility for owner pages during the v2 migration. Guest pages must not use it.
  function setWeddingId(id) {
    setOwnerActiveWeddingId(id)
  }

  function loadFromStorage() {
    try {
      const stored = uni.getStorageSync('userInfo')
      if (stored) setUser(typeof stored === 'string' ? JSON.parse(stored) : stored)
    } catch (err) {
      console.warn('读取用户缓存失败，清除损坏数据:', err)
      uni.removeStorageSync('userInfo')
    }
    ownerWorkspace.loadFromStorage(ownerVerified.value)
  }

  function saveToStorage() {
    uni.setStorageSync('userInfo', JSON.stringify({
      openid: openid.value,
      phone: phone.value,
      isOwner: isOwner.value,
      ownerVerified: ownerVerified.value,
      ownerActiveWeddingId: ownerWorkspace.activeWeddingId,
      profile: profile.value,
      plan: plan.value,
      entitlements: entitlements.value,
      workspaces: ownerWorkspace.workspaces
    }))
  }

  function logout() {
    openid.value = ''
    phone.value = ''
    isOwner.value = false
    ownerVerified.value = false
    profile.value = { nickname: '', phone: '', role: '主人' }
    plan.value = 'free'
    entitlements.value = { ...DEFAULT_ENTITLEMENTS }
    ownerWorkspace.clear()
    uni.removeStorageSync('userInfo')
  }

  return {
    openid,
    phone,
    isOwner,
    weddingId,
    ownerActiveWeddingId,
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
    setOwnerActiveWeddingId,
    loadFromStorage,
    saveToStorage,
    logout
  }
})
