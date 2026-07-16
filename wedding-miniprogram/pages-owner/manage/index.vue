<template>
  <PageShell
    title="我的书案"
    kicker="OWNER DESK"
    :desc="`${coupleName || '未具名婚书'} · ${formatDate(weddingDate) || '婚期未定'}`"
    :theme-class="store.templateClass"
  >
    <view class="owner-alert" v-if="loadError">
      <view class="owner-alert-copy">
        <text class="owner-alert-title">书案暂未更新</text>
        <text class="owner-alert-desc">{{ loadError }}</text>
      </view>
      <view class="owner-alert-actions">
        <button class="owner-alert-btn" :class="{ 'is-disabled': loading }" :loading="loading" :disabled="loading" @click="refreshDashboard(true)">重试</button>
        <button class="owner-alert-btn" :disabled="loading" @click="goTo('profile/index')">切换婚书</button>
      </view>
    </view>

    <view class="owner-loading" v-if="loading && !dashboardReady">
      <text class="owner-loading-title">正在整理书案</text>
      <text class="owner-loading-desc">核验婚书与主人工作区，请稍候。</text>
    </view>

    <template v-if="workspaceReady">
    <view class="letter-preview">
      <view class="letter-preview-head">
        <view class="letter-preview-copy">
          <text class="letter-preview-kicker">MY WEDDING LETTER</text>
          <text class="letter-preview-name">{{ coupleName || '写下两个人的名字' }}</text>
          <text class="letter-preview-date">{{ formatDate(weddingDate) || 'DATE TO BE SET' }}</text>
        </view>
        <view class="letter-preview-seal"><text>囍</text></view>
      </view>
      <view class="letter-preview-photo" v-if="coverImage">
        <image class="letter-preview-photo-image" :src="coverImage" mode="aspectFill" />
      </view>
      <view class="letter-preview-status">
        <view class="letter-progress"><view class="letter-progress-fill" :style="{ width: checklist.percent + '%' }" /></view>
        <text>{{ readinessSummary }}</text>
      </view>
      <button class="preview-btn" @click="previewWedding">预览宾客看到的婚书</button>
    </view>

    <view class="rsvp-summary">
      <view class="rsvp-primary">
        <text class="rsvp-number">{{ stats.attendingPeople }}</text>
        <text class="rsvp-label">位宾客确认赴约</text>
      </view>
      <view class="rsvp-secondary">
        <view><text>{{ stats.rsvp }}</text><text>回执</text></view>
        <view><text>{{ stats.blessings }}</text><text>祝福</text></view>
        <view><text>{{ stats.views }}</text><text>浏览</text></view>
      </view>
    </view>

    <SectionHeader title="书案四事" kicker="THE DESK" desc="从落笔到寄出，都在这里完成" compact />
    <view class="desk-list">
      <view class="desk-row" @click="goTo('guests/manage')">
        <view class="desk-mark">回</view>
        <view class="desk-copy"><text class="desk-title">回执</text><text class="desk-desc">宾客名单、赴约人数与到达信息</text></view>
        <image class="desk-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
      </view>
      <view class="desk-row" @click="goTo('invitation/edit')">
        <view class="desk-mark">墨</view>
        <view class="desk-copy"><text class="desk-title">笔墨</text><text class="desk-desc">邀请正文、四色心情与场景方案</text></view>
        <image class="desk-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
      </view>
      <view class="desk-row" @click="goTo('album/manage')">
        <view class="desk-mark">修</view>
        <view class="desk-copy"><text class="desk-title">修书</text><text class="desk-desc">照片装裱、路书和婚礼礼序</text></view>
        <image class="desk-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
      </view>
      <view class="desk-row" @click="shareWedding">
        <view class="desk-mark accent">寄</view>
        <view class="desk-copy"><text class="desk-title">寄信</text><text class="desk-desc">分享卡片、海报与小程序码</text></view>
        <image class="desk-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
      </view>
    </view>

    <view class="desk-shortcuts">
      <button @click="goTo('guide/edit')">路书</button>
      <button @click="goTo('timeline/edit')">流程</button>
      <button @click="goTo('blessing/manage')">祝福</button>
      <button @click="goTo('stats/index')">统计</button>
      <button @click="goTo('diagnostics/index')">发布诊断</button>
      <button @click="goTo('profile/index')">账号权益</button>
    </view>

    <view class="danger-zone">
      <text class="danger-title">删除这封婚书</text>
      <text class="danger-desc">删除后旧邀请链接会失效，相关回执与祝福也将移除。</text>
      <button class="danger-btn" :class="{ 'is-disabled': deleting }" :loading="deleting" :disabled="deleting" @click="confirmDeleteWedding">删除婚礼邀请</button>
    </view>
    </template>
  </PageShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate, showError, showSuccess } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { deleteWedding, fetchWedding, getStats } from '@/composables/useCloud.js'
import { getThemeTokens } from '@/utils/legacy-theme-map.js'
import PageShell from '@/components/ui/PageShell.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'

const store = useWeddingStore()
const userStore = useUserStore()
const deleting = ref(false)
const loading = ref(false)
const loadError = ref('')
const dashboardReady = ref(false)

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)
const checklist = computed(() => store.publishChecklist)
const coverImage = computed(() => {
  const photos = store.album?.photos || []
  return photos.find(item => item.type === 'cover')?.url || photos[0]?.url || ''
})
const deleteConfirmColor = computed(() => getThemeTokens(store.invitation?.theme).accentInk)
const workspaceReady = computed(() => Boolean(
  dashboardReady.value &&
  !loading.value &&
  !loadError.value &&
  userStore.ownerActiveWeddingId &&
  store.cachedWeddingId === userStore.ownerActiveWeddingId
))
const readinessSummary = computed(() => checklist.value.ready
  ? '婚书已经写好，可以寄出'
  : `还差 ${checklist.value.total - checklist.value.doneCount} 项待落笔`)
const stats = computed(() => {
  const weddingStats = store.wedding?.stats || {}
  return {
    views: Number(weddingStats.views || 0),
    rsvp: Number(weddingStats.rsvp_count || 0),
    blessings: Number(weddingStats.blessing_count || 0),
    attendingPeople: Number(store.rsvpStats?.attending_people || 0)
  }
})

function goTo(path) {
  if (path !== 'profile/index' && !workspaceReady.value) {
    showError('请先等待书案核验完成')
    return
  }
  uni.navigateTo({
    url: `/pages-owner/${path}`,
    fail: (err) => {
      console.warn('打开书案页面失败:', err)
      showError('页面打开失败，请稍后重试')
    }
  })
}

function previewWedding() {
  if (!workspaceReady.value) {
    showError('请先等待书案核验完成')
    return
  }
  uni.setStorageSync('guestPreviewInvitationId', userStore.ownerActiveWeddingId)
  uni.switchTab({
    url: '/pages/index/index',
    fail: (err) => {
      console.warn('打开婚书预览失败:', err)
      showError('预览页打开失败，请稍后重试')
    }
  })
}

function shareWedding() { goTo('share/index') }

async function refreshDashboard(force = false) {
  if (loading.value) return
  loading.value = true
  dashboardReady.value = false
  loadError.value = ''
  try {
    const allowed = await useOwnerGuard({
      forceWorkspaceSync: force,
      forceWeddingRefresh: force
    })
    if (!allowed) return

    const weddingId = userStore.ownerActiveWeddingId
    if (!weddingId) throw new Error('请先完成四幕向导，再回到书案。')
    if (store.cachedWeddingId !== weddingId) await fetchWedding(weddingId, true)
    const res = await getStats(weddingId)
    if (res?.stats) {
      store.wedding.stats = {
        views: res.stats.views || 0,
        shares: res.stats.shares || 0,
        rsvp_count: res.stats.rsvp?.total || 0,
        blessing_count: res.stats.blessings || 0,
        unique_viewers: res.stats.unique_viewers || 0
      }
    }
    dashboardReady.value = true
  } catch (err) {
    console.warn('书案数据加载失败:', err)
    loadError.value = err?.message || '书案暂时无法更新，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function confirmDeleteWedding() {
  if (deleting.value || !userStore.ownerActiveWeddingId) return
  const first = await showDeleteModal('删除婚礼邀请', '婚书、照片记录、回执和祝福都会一并移除。', '继续删除')
  if (!first) return
  const confirmed = await showDeleteModal('再次确认', '删除后无法恢复，确认继续吗？', '确认删除')
  if (!confirmed) return

  const weddingId = userStore.ownerActiveWeddingId
  try {
    deleting.value = true
    uni.showLoading({ title: '删除中...', mask: true })
    await deleteWedding(weddingId, 'DELETE')
    clearLocalWedding(weddingId)
    showSuccess('已删除婚礼邀请')
    uni.reLaunch({ url: '/pages-owner/wizard/index' })
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
      confirmColor: deleteConfirmColor.value,
      cancelText: '取消',
      success: (res) => resolve(Boolean(res.confirm)),
      fail: () => resolve(false)
    })
  })
}

function clearLocalWedding(weddingId) {
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[weddingId]) {
    delete weddings[weddingId]
    uni.setStorageSync('weddings', weddings)
  }
  uni.removeStorageSync(`invitation_${weddingId}`)
  store.setWeddingData({})
  userStore.setOwnerActiveWeddingId('')
}

onShow(() => refreshDashboard(false))
</script>

<style lang="scss" scoped>
.owner-alert {
  display: flex;
  align-items: center;
  gap: $sp-2;
  margin: 0 $page-gutter $sp-3;
  padding: $sp-3;
  border-left: 4rpx solid var(--accent);
  background: var(--accent-soft);
}
.owner-alert-copy { flex: 1; min-width: 0; }
.owner-alert-title { display: block; color: $ink; font-size: $fs-body; }
.owner-alert-desc { display: block; margin-top: $sp-1; color: $ink-soft; font-size: $fs-note; line-height: 1.5; }
.owner-alert-btn {
  width: 120rpx;
  height: 64rpx;
  border: 1rpx solid var(--accent-line);
  background: transparent;
  color: var(--accent);
  font-size: $fs-note;
  line-height: 62rpx;
}
.owner-alert-btn::after { border: 0; }
.owner-alert-btn.is-disabled { opacity: 0.56; }
.owner-alert-actions { display: flex; flex-direction: column; gap: $sp-1; flex-shrink: 0; }
.owner-loading {
  margin: 0 $page-gutter $sp-6;
  padding: $sp-5 0;
  border-top: 1rpx solid $line;
  border-bottom: 1rpx solid $line;
  text-align: center;
}
.owner-loading-title { display: block; color: $ink; font-size: $fs-body; }
.owner-loading-desc { display: block; margin-top: $sp-2; color: $ink-soft; font-size: $fs-note; }

.letter-preview {
  @include card;
  margin: 0 $page-gutter $sp-6;
  padding: $sp-4;
}
.letter-preview-head { display: flex; align-items: flex-start; gap: $sp-3; }
.letter-preview-copy { flex: 1; min-width: 0; }
.letter-preview-kicker { @include eyebrow; display: block; color: $gold-ink; }
.letter-preview-name {
  display: block;
  margin-top: $sp-2;
  color: $ink;
  font-size: $fs-title;
  line-height: $lh-title;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.letter-preview-date { display: block; margin-top: $sp-1; color: $ink-soft; font-family: $font-num; font-size: $fs-note; }
.letter-preview-seal {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 4rpx solid var(--accent-ink);
  border-radius: $r-full;
  background: var(--accent);
  color: var(--on-accent);
  font-size: $fs-note;
}
.letter-preview-photo { @include photo-mount; margin-top: $sp-4; }
.letter-preview-photo-image { width: 100%; height: 360rpx; display: block; }
.letter-preview-status { margin-top: $sp-4; color: $ink-soft; font-size: $fs-note; }
.letter-progress { height: 4rpx; margin-bottom: $sp-2; overflow: hidden; background: $line; }
.letter-progress-fill { height: 100%; background: var(--accent); transition: width 0.45s ease-out; }
.preview-btn {
  height: 80rpx;
  margin-top: $sp-4;
  border: 1rpx solid var(--accent-line);
  border-radius: $r-sm;
  background: transparent;
  color: var(--accent);
  font-size: $fs-note;
  line-height: 78rpx;
}
.preview-btn::after { border: 0; }

.rsvp-summary { margin: 0 $page-gutter $sp-6; }
.rsvp-number { display: block; color: $ink; font-family: $font-num; font-size: $fs-hero; line-height: 1; }
.rsvp-label { display: block; margin-top: $sp-1; color: $ink-soft; font-size: $fs-note; }
.rsvp-secondary { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: $sp-4; border-top: 1rpx solid $line; }
.rsvp-secondary view { padding-top: $sp-3; }
.rsvp-secondary text { display: block; }
.rsvp-secondary text:first-child { color: $ink; font-family: $font-num; font-size: $fs-title; }
.rsvp-secondary text:last-child { margin-top: $sp-1; color: $ink-soft; font-size: $fs-note; }

.desk-list { margin: 0 $page-gutter $sp-5; border-top: 1rpx solid $line; }
.desk-row { min-height: 112rpx; display: flex; align-items: center; gap: $sp-3; border-bottom: 1rpx solid $line; }
.desk-mark {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: $r-full;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: $fs-note;
}
.desk-mark.accent { background: var(--accent); color: var(--on-accent); }
.desk-copy { flex: 1; min-width: 0; }
.desk-title { display: block; color: $ink; font-size: $fs-body; }
.desk-desc { display: block; margin-top: $sp-1; color: $ink-soft; font-size: $fs-note; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.desk-arrow { width: 28rpx; height: 28rpx; opacity: 0.42; }

.desk-shortcuts { display: flex; flex-wrap: wrap; gap: $sp-2; margin: 0 $page-gutter $sp-7; }
.desk-shortcuts button {
  min-width: 136rpx;
  height: 64rpx;
  padding: 0 $sp-2;
  border: 1rpx solid $line;
  border-radius: $r-sm;
  background: transparent;
  color: $ink-soft;
  font-size: $fs-note;
  line-height: 62rpx;
}
.desk-shortcuts button::after { border: 0; }

.danger-zone { margin: 0 $page-gutter $sp-7; padding-top: $sp-4; border-top: 1rpx solid $line; }
.danger-title { display: block; color: $ink; font-size: $fs-body; }
.danger-desc { display: block; margin-top: $sp-1; color: $ink-soft; font-size: $fs-note; line-height: 1.5; }
.danger-btn {
  height: 72rpx;
  margin-top: $sp-3;
  border: 1rpx solid $line;
  border-radius: $r-sm;
  background: transparent;
  color: $ink-soft;
  font-size: $fs-note;
  line-height: 70rpx;
}
.danger-btn::after { border: 0; }
.danger-btn.is-disabled { opacity: 0.56; }
</style>
