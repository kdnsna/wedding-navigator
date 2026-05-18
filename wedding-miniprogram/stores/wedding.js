import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWeddingStore = defineStore('wedding', () => {
  const fallbackWedding = {
    basic_info: {
      date: '2026-10-01',
      time: '12:00'
    },
    share_config: {
      title: '诚邀您参加我们的婚礼'
    }
  }

  const fallbackInvitation = {
    couple: {
      groom: { name: '新郎' },
      bride: { name: '新娘' }
    },
    wedding: {
      venue_name: '婚礼宴会厅',
      venue_address: '请在主人端填写婚礼地址'
    },
    content: {
      main_text: '诚挚邀请您参加我们的婚礼，见证我们的幸福时刻。'
    }
  }

  const fallbackVenues = {
    venues: [{
      id: 'default',
      name: '婚礼宴会厅',
      address: '请在主人端填写婚礼地址',
      coordinate: null
    }]
  }

  // State
  const wedding = ref(fallbackWedding)
  const invitation = ref(fallbackInvitation)
  const album = ref({ photos: [] })
  const venues = ref(fallbackVenues)
  const timeline = ref(null)
  const guests = ref(null)
  const blessings = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastFetchTime = ref(0)

  const CACHE_TTL = 5 * 60 * 1000

  const isCacheValid = computed(() => {
    return lastFetchTime.value > 0 && (Date.now() - lastFetchTime.value) < CACHE_TTL
  })

  // Getters
  function guestStatus(guest) {
    return guest?.rsvp_status || guest?.status || 'pending'
  }

  function guestCount(guest) {
    return Number(guest?.attending_count ?? guest?.guestCount ?? guest?.guest_count ?? 1)
  }

  const coupleName = computed(() => {
    if (!invitation.value?.couple) return ''
    const { groom, bride } = invitation.value.couple
    return `${groom?.name || ''} & ${bride?.name || ''}`
  })

  const weddingDate = computed(() => {
    return wedding.value?.basic_info?.date || ''
  })

  const weddingTime = computed(() => {
    return wedding.value?.basic_info?.time || ''
  })

  const venueName = computed(() => {
    return invitation.value?.wedding?.venue_name || ''
  })

  const primaryVenue = computed(() => {
    const list = venues.value?.venues || []
    return list.find(v => v.type === 'venue') || list[0] || fallbackVenues.venues[0]
  })

  const nextTimelineEvent = computed(() => {
    const list = [...(timeline.value?.events || [])].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
    if (!list.length) return null
    if (weddingDate.value) {
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      if (todayStr === weddingDate.value) {
        const next = list.find(event => {
          if (!event.time) return false
          const [h, m] = String(event.time).split(':').map(Number)
          const eventTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h || 0, m || 0)
          return eventTime.getTime() + 30 * 60 * 1000 >= now.getTime()
        })
        return next || list[list.length - 1]
      }
    }
    return list[0]
  })

  const latestBlessings = computed(() => {
    const list = blessings.value?.blessings || []
    return [...list]
      .sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return (b.created_at || 0) - (a.created_at || 0)
      })
      .slice(0, 2)
  })

  const featuredPhotos = computed(() => {
    const photos = album.value?.photos || []
    return photos.slice(0, 3)
  })

  const publishChecklist = computed(() => {
    const coverReady = Boolean(album.value?.photos?.some(p => p.type === 'cover') || album.value?.photos?.[0]?.url)
    const primary = primaryVenue.value
    const items = [
      {
        key: 'invitation',
        title: '婚书信息',
        desc: coupleName.value?.trim() && weddingDate.value ? '新人姓名和婚期已填写' : '补齐新人姓名和婚期',
        done: Boolean(coupleName.value?.replace('&', '').trim() && weddingDate.value),
        route: '/pages-owner/invitation/edit'
      },
      {
        key: 'cover',
        title: '封面相册',
        desc: coverReady ? '已有可用于首页和分享的图片' : '至少上传 1 张封面或婚纱照',
        done: coverReady,
        route: '/pages-owner/album/manage'
      },
      {
        key: 'venue',
        title: '到场路书',
        desc: primary?.coordinate?.latitude ? '主场地、地址和坐标已准备' : '设置场地地址和地图坐标',
        done: Boolean(primary?.coordinate?.latitude && primary?.coordinate?.longitude),
        route: '/pages-owner/guide/edit'
      },
      {
        key: 'timeline',
        title: '婚礼流程',
        desc: (timeline.value?.events || []).length ? '宾客可查看当天安排' : '添加至少 1 个流程节点',
        done: Boolean((timeline.value?.events || []).length),
        route: '/pages-owner/timeline/edit'
      },
      {
        key: 'share',
        title: '分享卡片',
        desc: wedding.value?.share_config?.title ? '分享标题已设置' : '设置微信分享标题',
        done: Boolean(wedding.value?.share_config?.title),
        route: '/pages-owner/share/index'
      }
    ]
    const doneCount = items.filter(item => item.done).length
    return {
      items,
      doneCount,
      total: items.length,
      percent: Math.round((doneCount / items.length) * 100),
      ready: doneCount === items.length
    }
  })

  const countdown = computed(() => {
    if (!weddingDate.value) return null
    const time = weddingTime.value || '00:00:00'
    const normalizedTime = time.length === 5 ? `${time}:00` : time
    const date = new Date(`${weddingDate.value}T${normalizedTime}`)
    const now = new Date()
    const diff = date - now

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      isToday: false
    }
  })

  // 实时倒计时（传入当前时间戳以触发响应式更新）
  function getLiveCountdown(timestamp = Date.now()) {
    if (!weddingDate.value) return null
    const time = weddingTime.value || '00:00:00'
    const normalizedTime = time.length === 5 ? `${time}:00` : time
    const date = new Date(`${weddingDate.value}T${normalizedTime}`)
    const now = new Date(timestamp)
    const diff = date - now

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      isToday: false
    }
  }

  const rsvpStats = computed(() => {
    const list = guests.value?.guests || []
    return {
      total: list.length,
      attending: list.filter(g => guestStatus(g) === 'attending').length,
      uncertain: list.filter(g => guestStatus(g) === 'uncertain').length,
      declined: list.filter(g => guestStatus(g) === 'declined').length,
      pending: list.filter(g => guestStatus(g) === 'pending').length,
      attending_people: list
        .filter(g => guestStatus(g) === 'attending')
        .reduce((sum, g) => sum + guestCount(g), 0)
    }
  })

  // Actions
  function setWeddingData(data) {
    wedding.value = data.wedding || fallbackWedding
    invitation.value = data.invitation || fallbackInvitation
    album.value = data.album || { photos: [] }
    venues.value = data.venues ? {
      venues: data.venues.venues || data.venues,
      transportation: data.venues.transportation || {},
      accommodations: data.venues.accommodations || []
    } : fallbackVenues
    timeline.value = data.timeline || null
    guests.value = data.guests || null
    blessings.value = data.blessings || null
    lastFetchTime.value = Date.now()
  }

  function updateWeddingField(field, value) {
    if (wedding.value) {
      wedding.value[field] = value
    }
  }

  function updateInvitation(data) {
    invitation.value = { ...invitation.value, ...data }
  }

  function addPhoto(photo) {
    if (!album.value) album.value = { photos: [] }
    if (!album.value.photos) album.value.photos = []
    album.value.photos.push(photo)
  }

  function removePhoto(photoId) {
    if (!album.value?.photos) return
    album.value.photos = album.value.photos.filter(p => p.id !== photoId)
  }

  function addVenue(venue) {
    if (!venues.value) venues.value = { venues: [], transportation: {}, accommodations: [] }
    if (!venues.value.venues) venues.value.venues = []
    if (!venues.value.transportation) venues.value.transportation = {}
    if (!venues.value.accommodations) venues.value.accommodations = []
    venues.value.venues.push(venue)
  }

  function addTimelineEvent(event) {
    if (!timeline.value) timeline.value = { events: [] }
    if (!timeline.value.events) timeline.value.events = []
    timeline.value.events.push(event)
    // 按时间排序
    timeline.value.events.sort((a, b) => a.time.localeCompare(b.time))
  }

  function addGuest(guest) {
    if (!guests.value) guests.value = { guests: [] }
    if (!guests.value.guests) guests.value.guests = []
    guests.value.guests.push(guest)
  }

  function updateGuestRSVP(phone, rsvpData) {
    if (!guests.value?.guests) return
    const idx = guests.value.guests.findIndex(g => g.phone === phone)
    if (idx >= 0) {
      guests.value.guests[idx] = { ...guests.value.guests[idx], ...rsvpData }
    } else {
      guests.value.guests.push({
        id: Date.now().toString(),
        phone,
        ...rsvpData,
        created_at: Date.now(),
        updated_at: Date.now()
      })
    }
  }

  function addBlessing(blessing) {
    if (!blessings.value) blessings.value = { blessings: [] }
    if (!blessings.value.blessings) blessings.value.blessings = []
    blessings.value.blessings.unshift(blessing)
  }

  function setLoading(val) {
    loading.value = val
  }

  function setError(err) {
    error.value = err
  }

  return {
    wedding,
    invitation,
    album,
    venues,
    timeline,
    guests,
    blessings,
    loading,
    error,
    lastFetchTime,
    isCacheValid,
    coupleName,
    weddingDate,
    weddingTime,
    venueName,
    primaryVenue,
    nextTimelineEvent,
    latestBlessings,
    featuredPhotos,
    publishChecklist,
    countdown,
    getLiveCountdown,
    rsvpStats,
    setWeddingData,
    updateWeddingField,
    updateInvitation,
    addPhoto,
    removePhoto,
    addVenue,
    addTimelineEvent,
    addGuest,
    updateGuestRSVP,
    addBlessing,
    setLoading,
    setError
  }
})
