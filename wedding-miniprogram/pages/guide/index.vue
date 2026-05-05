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
        <view class="venue-header">
          <view class="venue-type-badge" :class="`type-${venue.type}`">
            <text>{{ typeLabel(venue.type) }}</text>
          </view>
          <text class="venue-time" v-if="venue.arrival_time">{{ venue.arrival_time }}</text>
        </view>
        <text class="venue-name">{{ venue.name }}</text>
        <text class="venue-address">{{ venue.address }}</text>
        <view class="venue-actions">
          <button class="venue-btn" @click.stop="callPhone(venue.contact_phone)" v-if="venue.contact_phone">
            <text>📞 电话</text>
          </button>
          <button class="venue-btn primary" @click.stop="navigateTo(venue)">
            <text>🧭 导航</text>
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
    iconPath: '/static/icons/venue.png',
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
    color: '#C41E3A',
    width: 4,
    dottedLine: false
  }]
})

function typeLabel(type) {
  const map = {
    home: '家',
    hotel: '酒店',
    venue: '场地',
    hotel_guest: '住宿',
    photo: '摄影'
  }
  return map[type] || '场地'
}

function selectVenue(venue) {
  selectedVenue.value = venue
  if (venue.coordinate) {
    center.value = {
      latitude: venue.coordinate.latitude,
      longitude: venue.coordinate.longitude
    }
    scale.value = 16
  }
}

function onMarkerTap(e) {
  const idx = e.detail.markerId
  if (venues.value[idx]) {
    selectVenue(venues.value[idx])
  }
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
      // 设置地图中心为第一个场地
      const first = venues.value[0]
      if (first?.coordinate) {
        center.value = {
          latitude: first.coordinate.latitude,
          longitude: first.coordinate.longitude
        }
      }
    } catch (err) {
      console.error('加载路书失败:', err)
    }
  }
})
</script>

<style lang="scss" scoped>
/* ========== 路书页面 ========== */
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
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-light;
  transition: all 0.3s $ease-out;
  position: relative;
  overflow: hidden;
}
.venue-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6rpx;
  height: 100%;
  background: linear-gradient(to bottom, $color-gold, $color-gold-light);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.venue-card.active {
  border-color: rgba(196, 30, 58, 0.2);
  box-shadow: $shadow-md;
}
.venue-card.active::before {
  opacity: 1;
}

.venue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.venue-type-badge {
  padding: 6rpx 18rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-weight: 500;
}
.venue-type-badge.type-venue {
  background: rgba(196, 30, 58, 0.08);
  color: $color-primary;
}
.venue-type-badge.type-hotel {
  background: rgba(107, 142, 159, 0.08);
  color: $color-info;
}
.venue-time {
  font-size: 24rpx;
  color: $text-muted;
  font-weight: 500;
}

.venue-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 10rpx;
  letter-spacing: 1rpx;
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
.venue-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  border-radius: 16rpx;
  background: $bg-muted;
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 500;
  transition: all 0.2s ease;
}
.venue-btn.primary {
  background: $gradient-primary;
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(196, 30, 58, 0.2);
}
.venue-btn:active {
  transform: scale(0.97);
}
.venue-btn::after {
  border: none;
}
</style>
