<template>
  <PageShell
    title="发布作战台"
    kicker="OWNER DASHBOARD"
    :desc="`${coupleName || '新人婚礼'} · ${formatDate(weddingDate) || '婚期未定'} · ${statusText}`"
  >
    <view class="owner-hero">
      <image class="owner-hero-media" src="/static/visuals/hero/hero-signature-rose.jpg" mode="aspectFill" />
      <view class="owner-hero-scrim" />
      <view class="owner-hero-copy">
        <text class="owner-hero-kicker">PUBLISH READY</text>
        <text class="owner-hero-score">{{ checklist.percent }}%</text>
        <text class="owner-hero-desc">{{ readinessSummary }}</text>
      </view>
      <view class="owner-status-tag" :class="{ ready: checklist.ready, draft: !checklist.ready }">
        <text>{{ checklist.ready ? '可分享' : '需补齐' }}</text>
      </view>
      <view class="owner-readiness-bar">
        <view class="owner-readiness-fill" :style="{ width: checklist.percent + '%' }" />
      </view>
    </view>

    <view class="owner-alert" v-if="loadError">
      <view class="owner-alert-copy">
        <text class="owner-alert-title">后台数据未完成刷新</text>
        <text class="owner-alert-desc">{{ loadError }}</text>
      </view>
      <button class="owner-alert-btn" :loading="loading" :disabled="loading" @click="refreshDashboard(true)">重试</button>
    </view>

    <MetricStrip :items="metricItems" />

    <SectionHeader title="发布清单" kicker="CHECKLIST" desc="先补齐会影响宾客体验的关键项" />
    <view class="owner-action-list">
      <ActionCard
        v-for="item in checklist.items"
        :key="item.key"
        :title="item.title"
        :desc="item.desc"
        :status="item.done ? '已完成' : '待补齐'"
        :tone="item.done ? 'default' : 'gold'"
        @click="goToRoute(item.route)"
      />
    </view>

    <SectionHeader title="内容与到场" kicker="CONTENT" desc="婚书、相册、路书和流程构成宾客第一体验" />
    <view class="owner-action-grid">
      <ActionCard title="婚书编辑" desc="模板、文案、新人、开关和背景音乐" icon="/static/visuals/icon-date.svg" @click="goTo('invitation/edit')" />
      <ActionCard title="相册管理" desc="上传照片，设置首页封面和相册顺序" icon="/static/visuals/icon-album.svg" @click="goTo('album/manage')" />
      <ActionCard title="路书设置" desc="场地、地图坐标、停车、住宿和天气" icon="/static/visuals/icon-guide.svg" tone="primary" status="核心" @click="goTo('guide/edit')" />
      <ActionCard title="流程编辑" desc="婚礼当天节点、角色和场地绑定" icon="/static/visuals/icon-timeline.svg" @click="goTo('timeline/edit')" />
    </view>

    <SectionHeader title="宾客与传播" kicker="GUESTS" desc="回执、祝福、分享和统计集中管理" />
    <view class="owner-action-grid">
      <ActionCard title="宾客管理" desc="查看 RSVP、关系、人数和到达信息" icon="/static/visuals/icon-person.svg" @click="goTo('guests/manage')" />
      <ActionCard title="祝福管理" desc="查看、置顶或删除宾客祝福" icon="/static/visuals/icon-blessing.svg" @click="goTo('blessing/manage')" />
      <ActionCard title="分享设置" desc="分享标题、海报、小程序路径和二维码" icon="/static/visuals/icon-poster.svg" @click="goTo('share/index')" />
      <ActionCard title="数据统计" desc="浏览、分享、回执和祝福趋势" icon="/static/visuals/icon-manage.svg" @click="goTo('stats/index')" />
    </view>

    <SectionHeader title="发布与权益" kicker="OPS" desc="上线前检查和账号权益边界" />
    <view class="owner-action-list">
      <ActionCard
        title="发布诊断"
        desc="检查云环境、地图天气、隐私、海报和模板权益"
        icon="/static/visuals/icon-warning.svg"
        :status="checklist.ready ? '可发布' : '需补齐'"
        :tone="checklist.ready ? 'default' : 'gold'"
        @click="goTo('diagnostics/index')"
      />
      <ActionCard
        title="账号与权益"
        desc="查看免费版/高级版/商家版边界和工作区"
        icon="/static/visuals/icon-manage.svg"
        :status="userStore.planTier.label"
        @click="goTo('profile/index')"
      />
    </view>

    <view class="danger-zone owner-danger-zone">
      <text class="danger-kicker">DANGER ZONE</text>
      <text class="danger-title">删除婚礼邀请</text>
      <text class="danger-desc">删除后当前邀请链接将失效，婚书、相册记录、路书、流程、宾客回执、祝福和统计数据都会移除。</text>
      <button class="danger-btn" :loading="deleting" :disabled="deleting" @click="confirmDeleteWedding">删除婚礼邀请</button>
    </view>

    <BottomActionBar
      primary-text="预览效果"
      secondary-text="分享邀请"
      :disabled="deleting"
      @primary="previewWedding"
      @secondary="shareWedding"
    />
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate, showError, showSuccess } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { deleteWedding, fetchWedding, getStats, syncOwnerProfile } from '@/composables/useCloud.js'
import PageShell from '@/components/ui/PageShell.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import ActionCard from '@/components/ui/ActionCard.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import MetricStrip from '@/components/ui/MetricStrip.vue'

const store = useWeddingStore()
const userStore = useUserStore()
const deleting = ref(false)
const loading = ref(false)
const loadError = ref('')

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)
const weddingStatus = computed(() => store.wedding?.status || 'draft')
const checklist = computed(() => store.publishChecklist)
const readinessSummary = computed(() => {
  const left = checklist.value.total - checklist.value.doneCount
  if (checklist.value.ready) return '发布项已齐，可以放心分享给宾客'
  return `还差 ${left} 项，补齐后首页、回执、路线和分享链路会更完整`
})

const statusText = computed(() => {
  const map = { draft: '草稿', published: '已发布', ended: '已结束' }
  return map[weddingStatus.value] || '草稿'
})

const stats = computed(() => {
  const s = store.wedding?.stats || {}
  return {
    views: s.views || 0,
    shares: s.shares || 0,
    rsvp: s.rsvp_count || 0,
    blessings: s.blessing_count || 0
  }
})
const metricItems = computed(() => [
  { label: '浏览', value: stats.value.views },
  { label: '分享', value: stats.value.shares },
  { label: 'RSVP', value: stats.value.rsvp },
  { label: '祝福', value: stats.value.blessings }
])

function goTo(path) {
  uni.navigateTo({
    url: `/pages-owner/${path}`,
    fail: (err) => {
      console.warn('打开后台页面失败:', err)
      showError('页面打开失败，请稍后重试')
    }
  })
}
function goToRoute(route) {
  uni.navigateTo({
    url: route,
    fail: (err) => {
      console.warn('打开发布清单页面失败:', err)
      showError('页面打开失败，请稍后重试')
    }
  })
}
function previewWedding() {
  uni.switchTab({
    url: '/pages/index/index',
    fail: (err) => {
      console.warn('打开预览首页失败:', err)
      showError('预览页打开失败，请稍后重试')
    }
  })
}
function shareWedding() {
  uni.navigateTo({
    url: '/pages-owner/share/index',
    fail: (err) => {
      console.warn('打开分享设置失败:', err)
      showError('分享设置打开失败，请稍后重试')
    }
  })
}

async function refreshDashboard(force = false) {
  if (!(await useOwnerGuard())) return
  if (!userStore.weddingId) {
    loadError.value = '当前没有婚礼 ID，请先创建婚礼后再进入后台'
    return
  }
  if (loading.value) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchWedding(userStore.weddingId, force)
    const profileRes = await syncOwnerProfile().catch((err) => {
      console.warn('主人账号同步失败:', err)
      return null
    })
    if (profileRes?.success) {
      userStore.setOwnerProfile(profileRes)
    }
    const res = await getStats(userStore.weddingId)
    if (res?.stats) {
      store.wedding.stats = {
        views: res.stats.views || 0,
        shares: res.stats.shares || 0,
        rsvp_count: res.stats.rsvp?.total || 0,
        blessing_count: res.stats.blessings || 0,
        unique_viewers: res.stats.unique_viewers || 0
      }
    }
  } catch (err) {
    console.warn('管理后台数据加载失败:', err)
    loadError.value = err?.message || '后台数据加载失败，请稍后重试'
    showError(loadError.value)
  } finally {
    loading.value = false
  }
}

async function confirmDeleteWedding() {
  if (deleting.value) return
  if (!userStore.weddingId) {
    showError('当前没有可删除的婚礼邀请')
    return
  }
  const first = await showDeleteModal(
    '删除婚礼邀请',
    '这会删除婚礼资料、请柬、相册记录、路书、流程、宾客回执、祝福和统计数据。此操作不可恢复。',
    '继续删除'
  )
  if (!first) return

  const second = await showDeleteModal(
    '再次确认',
    '删除后宾客打开旧邀请链接将看不到这场婚礼。确认继续删除吗？',
    '确认删除'
  )
  if (!second) return

  const weddingId = userStore.weddingId
  try {
    deleting.value = true
    uni.showLoading({ title: '删除中...', mask: true })
    await deleteWedding(weddingId, 'DELETE')
    clearLocalWedding(weddingId)
    showSuccess('已删除婚礼邀请')
    uni.reLaunch({
      url: '/pages-owner/wizard/index',
      fail: (navErr) => {
        console.warn('删除后返回创建向导失败:', navErr)
        showError('已删除，但创建向导打开失败')
      }
    })
  } catch (err) {
    console.error('删除婚礼邀请失败:', err)
    showError(err.message || '删除失败，请稍后重试')
  } finally {
    deleting.value = false
    uni.hideLoading()
  }
}

function showDeleteModal(title, content, confirmText) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      confirmText,
      confirmColor: '#EA4335',
      cancelText: '取消',
      success: (res) => resolve(Boolean(res.confirm)),
      fail: () => resolve(false)
    })
  })
}

function clearLocalWedding(weddingId) {
  if (weddingId) {
    const weddings = uni.getStorageSync('weddings') || {}
    if (weddings[weddingId]) {
      delete weddings[weddingId]
      uni.setStorageSync('weddings', weddings)
    }
    uni.removeStorageSync(`invitation_${weddingId}`)
  }
  store.setWeddingData({})
  userStore.logout()
}

onShow(() => refreshDashboard(false))
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

/* 顶部标题 */
.page-header {
  padding: $page-header-top $page-gutter 24rpx;
}
.page-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
  margin-bottom: 12rpx;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
}

/* 婚礼信息 */
.couple-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx $page-gutter 40rpx;
  gap: 24rpx;
}
.couple-bar > view { min-width: 0; }
.couple-name {
  display: block;
  font-size: $font-h2;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.couple-date {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}
.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-weight: 500;
}
.status-tag.published {
  background: $color-success;
  color: #fff;
}

/* 发布准备 */
.readiness-card {
  margin: 0 $page-gutter 40rpx;
  padding: 32rpx;
  border-radius: $card-radius;
  background: $text-primary;
  color: #fff;
}
.readiness-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 24rpx;
}
.readiness-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0;
  margin-bottom: 8rpx;
}
.readiness-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
}
.readiness-score {
  font-size: 48rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.readiness-bar {
  height: 8rpx;
  border-radius: 4rpx;
  background: rgba(255,255,255,0.16);
  overflow: hidden;
  margin-bottom: 22rpx;
}
.readiness-fill {
  height: 100%;
  border-radius: 4rpx;
  background: $color-primary-light;
  transition: width 0.45s ease;
}
.readiness-summary {
  padding: 18rpx 22rpx;
  margin-bottom: 14rpx;
  border-radius: $card-radius;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.78);
  font-size: 24rpx;
  line-height: 1.45;
}
.readiness-list {
  display: flex;
  flex-direction: column;
}
.readiness-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(255,255,255,0.08);
}
.readiness-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255,255,255,0.36);
  flex-shrink: 0;
}
.readiness-dot.done {
  background: $color-success;
  border-color: $color-success;
}
.readiness-meta {
  flex: 1;
  min-width: 0;
}
.readiness-item-title {
  display: block;
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
  margin-bottom: 4rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.readiness-item-desc {
  display: block;
  font-size: 22rpx;
  color: rgba(255,255,255,0.62);
  line-height: 1.4;
}
.readiness-arrow {
  color: rgba(255,255,255,0.45);
  font-size: 34rpx;
}

/* 数据概览 */
.stats-row {
  display: flex;
  padding: 0 $page-gutter;
  margin-bottom: 48rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
}
.stat-num {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
  margin-bottom: 8rpx;
}
.stat-label {
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
}

/* 功能菜单 */
.menu-group {
  margin: 0 $page-gutter;
  background: $bg-surface;
  border-radius: $card-radius;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  min-height: $tap-min-height;
  padding: 28rpx;
}
.menu-item:active {
  background: $bg-muted;
}
.menu-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.menu-badge {
  flex-shrink: 0;
  margin-right: 12rpx;
  padding: 7rpx 14rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 22rpx;
  line-height: 1.2;
}
.menu-badge.danger {
  background: rgba(234,67,53,0.1);
  color: $color-error;
}
.menu-arrow {
  font-size: 28rpx;
  color: $text-muted;
}

.divider {
  height: 1rpx;
  background: $border-color;
  margin: 0 28rpx;
}

/* 底部操作 */
.bottom-actions {
  padding: 40rpx $page-gutter calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 16rpx;
}
.action-btn {
  flex: 1;
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.action-btn::after { border: none; }
.action-btn:active { opacity: 0.8; }
.action-btn.primary {
  background: $text-primary;
  color: #fff;
}

.danger-zone {
  margin: 0 $page-gutter 48rpx;
  padding: 30rpx;
  border-radius: $card-radius;
  border: 1rpx solid rgba(234,67,53,0.24);
  background: rgba(234,67,53,0.045);
}
.danger-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(234,67,53,0.72);
  letter-spacing: 0;
  margin-bottom: 10rpx;
}
.danger-title {
  display: block;
  font-size: 30rpx;
  color: #9F2D26;
  font-weight: 600;
  margin-bottom: 10rpx;
}
.danger-desc {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.55;
  margin-bottom: 24rpx;
}
.danger-btn {
  height: 82rpx;
  line-height: 82rpx;
  border-radius: $radius-full;
  background: #EA4335;
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
}
.danger-btn::after { border: none; }
.danger-btn[disabled] {
  opacity: 0.62;
}

.owner-hero {
  position: relative;
  margin: 0 $page-gutter 30rpx;
  min-height: 306rpx;
  padding: 34rpx;
  border-radius: $card-radius;
  overflow: hidden;
  background:
    linear-gradient(135deg, #1A1A1A 0%, #4B111E 72%, #6B1829 100%);
  color: #fff;
  box-shadow: $shadow-lg;
}
.owner-hero-media,
.owner-hero-scrim {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.owner-hero-media {
  opacity: 0.48;
  filter: saturate(0.98) contrast(1.04);
}
.owner-hero-scrim {
  background:
    linear-gradient(90deg, rgba(7,3,5,0.94) 0%, rgba(24,7,12,0.80) 48%, rgba(75,17,30,0.56) 100%),
    linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.52));
}
.owner-hero::after {
  content: "";
  position: absolute;
  right: -96rpx;
  bottom: -118rpx;
  width: 310rpx;
  height: 310rpx;
  border: 1rpx solid rgba(201,169,110,0.24);
  border-radius: 50%;
}
.owner-hero-copy {
  position: relative;
  z-index: 2;
}
.owner-hero-kicker {
  display: block;
  color: rgba(255,255,255,0.56);
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: 0;
}
.owner-hero-score {
  display: block;
  margin-top: 12rpx;
  color: #fff;
  font-size: 72rpx;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.owner-hero-desc {
  display: block;
  margin-top: 16rpx;
  max-width: 520rpx;
  color: rgba(255,255,255,0.76);
  font-size: 26rpx;
  line-height: 1.48;
}
.owner-status-tag {
  position: absolute;
  z-index: 3;
  top: 32rpx;
  right: 32rpx;
  padding: 9rpx 16rpx;
  border-radius: $radius-sm;
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.82);
  font-size: 22rpx;
  font-weight: 600;
}
.owner-status-tag.ready {
  background: rgba(52,168,83,0.20);
  color: #B9E8C7;
}
.owner-readiness-bar {
  position: relative;
  z-index: 2;
  height: 8rpx;
  margin-top: 30rpx;
  border-radius: 4rpx;
  background: rgba(255,255,255,0.14);
  overflow: hidden;
}
.owner-readiness-fill {
  height: 100%;
  border-radius: 4rpx;
  background: $color-gold;
  transition: width 0.45s ease;
}
.owner-alert {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 0 $page-gutter 28rpx;
  padding: 22rpx 24rpx;
  border-radius: $card-radius;
  border: 1rpx solid rgba(249,171,0,0.24);
  background: rgba(249,171,0,0.10);
  box-sizing: border-box;
}
.owner-alert-copy {
  flex: 1;
  min-width: 0;
}
.owner-alert-title {
  display: block;
  color: #8F6100;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.35;
}
.owner-alert-desc {
  display: block;
  margin-top: 6rpx;
  color: $text-secondary;
  font-size: 23rpx;
  line-height: 1.45;
  word-break: break-word;
}
.owner-alert-btn {
  flex-shrink: 0;
  width: 132rpx;
  height: 62rpx;
  line-height: 62rpx;
  border-radius: $radius-sm;
  background: $text-primary;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}
.owner-alert-btn::after { border: none; }
.owner-alert-btn[disabled] { opacity: 0.56; }
.owner-action-list,
.owner-action-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 0 $page-gutter;
  margin-bottom: 42rpx;
}
.owner-action-grid {
  display: grid;
  grid-template-columns: 1fr;
}
.owner-danger-zone {
  margin-bottom: calc(150rpx + env(safe-area-inset-bottom));
}
</style>
