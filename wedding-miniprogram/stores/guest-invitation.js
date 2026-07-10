import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getThemeTokens } from '@/utils/legacy-theme-map.js'

export const GUEST_INVITATION_STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  INVALID: 'invalid',
  CLOSED: 'closed',
  OFFLINE: 'offline'
})

const CACHE_PREFIX = 'guestInvitation:v1:'
const TAB_STATE_KEY = 'guestTabBarState'

export const useGuestInvitationStore = defineStore('guestInvitation', () => {
  const invitationId = ref('')
  const status = ref(GUEST_INVITATION_STATUS.IDLE)
  const snapshot = ref(null)
  const error = ref('')

  const isReady = computed(() => status.value === GUEST_INVITATION_STATUS.READY)
  const hasUsableSnapshot = computed(() => Boolean(snapshot.value && invitationId.value))
  const canRenderInvitation = computed(() => isReady.value || (
    status.value === GUEST_INVITATION_STATUS.OFFLINE && hasUsableSnapshot.value
  ))

  const features = computed(() => snapshot.value?.invitation?.features || {})
  const hasGuide = computed(() => {
    const guide = snapshot.value?.venues || {}
    const transport = guide.transportation || {}
    return Boolean(
      (guide.venues || []).length ||
      (guide.accommodations || []).length ||
      Object.values(transport).some(value => Array.isArray(value) ? value.length : String(value || '').trim())
    )
  })
  const showRsvp = computed(() => canRenderInvitation.value && features.value.show_rsvp !== false)
  const showGuide = computed(() => canRenderInvitation.value && hasGuide.value)
  const showTabBar = computed(() => canRenderInvitation.value)

  function setInvitationId(id = '') {
    const next = String(id || '')
    if (next === invitationId.value) return
    invitationId.value = next
    snapshot.value = null
    error.value = ''
    status.value = next ? GUEST_INVITATION_STATUS.LOADING : GUEST_INVITATION_STATUS.IDLE
    publishTabBarState()
  }

  function hydrate(id) {
    setInvitationId(id)
    if (!invitationId.value) return null
    try {
      const cached = uni.getStorageSync(`${CACHE_PREFIX}${invitationId.value}`)
      if (!cached) return null
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      if (parsed?.weddingId !== invitationId.value || !parsed?.data) return null
      snapshot.value = parsed.data
      status.value = GUEST_INVITATION_STATUS.OFFLINE
      publishTabBarState()
      return parsed.data
    } catch (err) {
      console.warn('读取宾客邀请快照失败:', err)
      uni.removeStorageSync(`${CACHE_PREFIX}${invitationId.value}`)
      return null
    }
  }

  function beginLoading() {
    error.value = ''
    if (!snapshot.value) status.value = GUEST_INVITATION_STATUS.LOADING
    publishTabBarState()
  }

  function resolve(data) {
    if (!data) {
      fail('这封邀请不存在或已失效', GUEST_INVITATION_STATUS.INVALID)
      return
    }
    snapshot.value = data
    error.value = ''
    status.value = data.wedding?.status === 'ended'
      ? GUEST_INVITATION_STATUS.CLOSED
      : GUEST_INVITATION_STATUS.READY
    if (status.value === GUEST_INVITATION_STATUS.READY) {
      uni.setStorageSync(`${CACHE_PREFIX}${invitationId.value}`, {
        weddingId: invitationId.value,
        savedAt: Date.now(),
        data
      })
    }
    publishTabBarState()
  }

  function fail(message, nextStatus = GUEST_INVITATION_STATUS.INVALID) {
    error.value = message || '这封邀请暂时无法打开'
    status.value = snapshot.value ? GUEST_INVITATION_STATUS.OFFLINE : nextStatus
    publishTabBarState()
  }

  function clear() {
    invitationId.value = ''
    snapshot.value = null
    error.value = ''
    status.value = GUEST_INVITATION_STATUS.IDLE
    publishTabBarState()
  }

  function publishTabBarState() {
    const theme = snapshot.value?.invitation?.theme || 'wine'
    const state = {
      visible: showTabBar.value,
      showRsvp: showRsvp.value,
      showGuide: showGuide.value,
      selectedColor: getThemeTokens(theme).accent
    }
    uni.setStorageSync(TAB_STATE_KEY, state)
    try {
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      const current = pages[pages.length - 1]
      const tabBar = current?.getTabBar?.()
      tabBar?.syncFromStorage?.()
    } catch (err) {
      console.warn('同步宾客导航失败:', err)
    }
  }

  return {
    invitationId,
    status,
    snapshot,
    error,
    isReady,
    hasUsableSnapshot,
    canRenderInvitation,
    showRsvp,
    showGuide,
    showTabBar,
    setInvitationId,
    hydrate,
    beginLoading,
    resolve,
    fail,
    clear,
    publishTabBarState
  }
})
