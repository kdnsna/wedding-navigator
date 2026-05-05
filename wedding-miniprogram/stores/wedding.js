import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWeddingStore = defineStore('wedding', () => {
  // State
  const wedding = ref(null)
  const invitation = ref(null)
  const album = ref(null)
  const venues = ref(null)
  const timeline = ref(null)
  const guests = ref(null)
  const blessings = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
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

  const countdown = computed(() => {
    if (!weddingDate.value) return null
    const date = new Date(`${weddingDate.value} ${weddingTime.value || '00:00:00'}`)
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

  const rsvpStats = computed(() => {
    const list = guests.value?.guests || []
    return {
      total: list.length,
      attending: list.filter(g => g.rsvp_status === 'attending').length,
      uncertain: list.filter(g => g.rsvp_status === 'uncertain').length,
      declined: list.filter(g => g.rsvp_status === 'declined').length,
      pending: list.filter(g => g.rsvp_status === 'pending').length
    }
  })

  // Actions
  function setWeddingData(data) {
    wedding.value = data.wedding || null
    invitation.value = data.invitation || null
    album.value = data.album || null
    venues.value = data.venues || null
    timeline.value = data.timeline || null
    guests.value = data.guests || null
    blessings.value = data.blessings || null
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
    if (!venues.value) venues.value = { venues: [] }
    if (!venues.value.venues) venues.value.venues = []
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
    coupleName,
    weddingDate,
    weddingTime,
    venueName,
    countdown,
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
