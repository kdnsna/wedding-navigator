<template>
  <view class="page">
    <!-- 地图 -->
    <view class="map-container">
      <map
        id="weddingMap"
        class="map"
        :latitude="center.latitude"
        :longitude="center.longitude"
        :scale="scale"
        :markers="markers"
        :polyline="polyline"
        :show-location="true"
        @markertap="onMarkerTap"
      />
    </view>

    <!-- 场地列表 -->
    <scroll-view class="venue-list" scroll-y>
      <view
        class="venue-card"
        v-for="venue in venues"
        :key="venue.id"
        :class="{ active: selectedVenue?.id === venue.id }"
        @click="selectVenue(venue)"
      >
        <view class="venue-meta">
          <text class="venue-type">{{ typeLabel(venue.type) }}</text>
          <text class="venue-time" v-if="venue.arrival_time">{{ venue.arrival_time }}</text>
        </view>
        <text class="venue-name">{{ venue.name }}</text>
        <text class="venue-address">{{ venue.address }}</text>
        <view class="venue-actions">
          <button class="action-btn" @click.stop="callPhone(venue.contact_phone)" v-if="venue.contact_phone">
            电话
          </button>
          <button class="action-btn primary" @click.stop="navigateTo(venue)">
            导航
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'
import { MARKER_ICON } from '@/config/cloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const center = ref({ latitude: 39.908823, longitude: 116.397470 })
const scale = ref(12)
const selectedVenue = ref(null)

const venues = computed(() => store.venues?.venues || [])

const markers = computed(() => {
  return venues.value.map((v, i) => ({
    id: i,
    latitude: v.coordinate?.latitude || center.value.latitude,
    longitude: v.coordinate?.longitude || center.value.longitude,
    title: v.name,
    iconPath: MARKER_ICON || '',
    width: 30,
    height: 30,
    callout: {
      content: v.name,
      color: '#333',
      fontSize: 14,
      borderRadius: 8,
      bgColor: '#fff',
      padding: 10,
      display: 'BYCLICK'
    }
  }))
})

const polyline = computed(() => {
  const points = venues.value
    .filter(v => v.coordinate)
    .map(v => ({
      latitude: v.coordinate.latitude,
      longitude: v.coordinate.longitude
    }))
  if (points.length < 2) return []
  return [{
    points,
    color: '#B03A5B',
    width: 3,
    dottedLine: false
  }]
})

function typeLabel(type) {
  const map = { home: '家', hotel: '酒店', venue: '场地', hotel_guest: '住宿', photo: '摄影' }
  return map[type] || '场地'
}

function selectVenue(venue) {
  selectedVenue.value = venue
  if (venue.coordinate) {
    center.value = { latitude: venue.coordinate.latitude, longitude: venue.coordinate.longitude }
    scale.value = 16
  }
}

function onMarkerTap(e) {
  const idx = e.detail.markerId
  if (venues.value[idx]) selectVenue(venues.value[idx])
}

function navigateTo(venue) {
  if (!venue.coordinate) {
    uni.showToast({ title: '暂无坐标信息', icon: 'none' })
    return
  }
  uni.openLocation({
    latitude: venue.coordinate.latitude,
    longitude: venue.coordinate.longitude,
    name: venue.name,
    address: venue.address
  })
}

function callPhone(phone) {
  if (!phone) return
  uni.makePhoneCall({ phoneNumber: phone })
}

onShow(async () => {
  if (userStore.weddingId && venues.value.length === 0) {
    try {
      await fetchWedding(userStore.weddingId)
      const first = venues.value[0]
      if (first?.coordinate) {
        center.value = { latitude: first.coordinate.latitude, longitude: first.coordinate.longitude }
      }
    } catch (err) {}
  }
})
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-color;
}

.map-container {
  flex: 1;
  min-height: 400rpx;
}
.map {
  width: 100%;
  height: 100%;
}

.venue-list {
  max-height: 50vh;
  padding: 24rpx;
  background: $bg-color;
}

.venue-card {
  background: $bg-surface;
  border-radius: $radius-lg;
  padding: 32rpx;
  margin-bottom: 16rpx;
  transition: all 0.2s ease;
}
.venue-card.active {
  background: $text-primary;
}
.venue-card.active .venue-name,
.venue-card.active .venue-address,
.venue-card.active .venue-type,
.venue-card.active .venue-time {
  color: #fff;
}
.venue-card:active {
  opacity: 0.8;
}

.venue-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.venue-type {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-weight: 500;
}
.venue-time {
  font-size: 22rpx;
  color: $text-muted;
  font-weight: 500;
}

.venue-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.venue-address {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 24rpx;
  line-height: 1.5;
}

.venue-actions {
  display: flex;
  gap: 16rpx;
}
.action-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.action-btn.primary {
  background: $text-primary;
  color: #fff;
}
.action-btn::after { border: none; }
.action-btn:active { opacity: 0.8; }
</style>
