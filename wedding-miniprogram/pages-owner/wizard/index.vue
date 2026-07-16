<template>
  <view class="page" :class="themeClass">
    <view class="step-bar">
      <view class="seal-steps">
        <view
          class="seal-step"
          v-for="step in steps"
          :key="step.key"
          :class="{ active: currentStep >= step.index }"
        >
          <text>{{ step.index }}</text>
        </view>
      </view>
      <view class="step-labels">
        <text class="step-label" v-for="step in steps" :key="step.key">{{ step.label }}</text>
      </view>
    </view>

    <view class="step-content" v-if="currentStep === 1">
      <view class="step-header">
        <text class="step-kicker">OPENING LINE</text>
        <text class="step-title">具名</text>
        <text class="step-sub">先写下两个人的名字和婚礼日期，这封信才真正有了落款。</text>
      </view>
      <view class="form-grid two">
        <view class="form-group">
          <text class="form-label">新郎</text>
          <input class="form-input" v-model="form.groomName" maxlength="20" placeholder="姓名" />
        </view>
        <view class="form-group">
          <text class="form-label">新娘</text>
          <input class="form-input" v-model="form.brideName" maxlength="20" placeholder="姓名" />
        </view>
      </view>
      <view class="form-group">
        <text class="form-label">婚礼日期</text>
        <picker mode="date" :value="form.date || suggestedDate" @change="onDateChange">
          <view class="picker-value">{{ form.date || '请选择日期' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-label">婚礼时间</text>
        <picker mode="time" :value="form.time || suggestedTime" @change="onTimeChange">
          <view class="picker-value">{{ form.time || '请选择时间' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-label">写给宾客的话</text>
        <textarea class="form-textarea" v-model="form.invitationText" maxlength="300" placeholder="亲手写下这封邀请的卷首语" />
      </view>
    </view>

    <view class="step-content" v-if="currentStep === 2">
      <view class="step-header">
        <text class="step-kicker">THE VENUE</text>
        <text class="step-title">择地</text>
        <text class="step-sub">主场地会进入宾客端的请柬详情、地图导航和到场提示。</text>
      </view>
      <view class="form-group">
        <text class="form-label">场地名称</text>
        <input class="form-input" v-model="form.venueName" maxlength="40" placeholder="例如：某某酒店宴会厅" />
      </view>
      <view class="form-group">
        <text class="form-label">详细地址</text>
        <input class="form-input" v-model="form.venueAddress" maxlength="80" placeholder="请输入详细地址" />
      </view>
      <view class="venue-card">
        <text class="venue-card-label">建议到达</text>
        <text class="venue-card-time">{{ form.time || '以请柬为准' }}</text>
        <text class="venue-card-copy">创建后仍可在主人端继续补充地图坐标、停车信息和住宿推荐。</text>
      </view>
      <view class="scenario-block">
        <text class="form-label">婚礼实际场景</text>
        <scroll-view class="scenario-scroll" scroll-x enhanced :show-scrollbar="false">
          <view class="scenario-track">
            <view
              class="scenario-item"
              v-for="scenario in scenarioOptions"
              :key="scenario.id"
              :class="{ active: form.scenarioPreset === scenario.id }"
              @click="selectScenario(scenario)"
            >
              <text class="scenario-name">{{ scenario.shortName }}</text>
              <text class="scenario-desc">{{ scenario.plan?.scenario }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="step-content" v-if="currentStep === 3">
      <view class="step-header">
        <text class="step-kicker">PHOTO MOUNT</text>
        <text class="step-title">选照</text>
        <text class="step-sub">第一张作为扉页照片，其余进入银盐相册；最多九张，默认保留原片。</text>
      </view>
      <view class="upload-mount" :class="{ disabled: !remainingPhotoSlots }" @click="chooseWizardImages">
        <text class="upload-title">{{ pickedPhotos.length ? '继续选照' : '上传照片' }}</text>
        <text class="upload-sub">还可选择 {{ remainingPhotoSlots }} 张</text>
      </view>
      <scroll-view class="photo-strip" scroll-x enhanced :show-scrollbar="false" v-if="pickedPhotos.length">
        <view class="photo-mount" v-for="(photo, index) in pickedPhotos" :key="photo.id">
          <view class="photo-frame">
            <image class="photo-img" :src="photo.localPath" mode="aspectFill" />
          </view>
          <text class="photo-caption">{{ index === 0 ? '扉页照片' : `银盐相册 ${index}` }}</text>
          <text class="photo-meta">{{ photo.orientation }} · {{ photo.recommendation }}</text>
          <text class="photo-quality" :class="photo.quality">{{ photoQualityLabel(photo) }}</text>
          <text class="photo-remove" @click.stop="removePickedPhoto(photo.id)">移除</text>
        </view>
      </scroll-view>
      <view class="hero-preview" :class="selectedVisualPreset.className">
        <image class="hero-preview-img" :src="heroPreviewImage" mode="aspectFill" :style="heroPreviewStyle" />
        <view class="hero-preview-scrim" />
        <view class="hero-preview-copy">
          <text class="hero-kicker">THE WEDDING OF</text>
          <text class="hero-names">{{ couplePreview }}</text>
          <text class="hero-date">{{ form.date || 'DATE TO BE SET' }}</text>
        </view>
      </view>
      <view class="focus-control" v-if="pickedPhotos.length">
        <text class="form-label">扉页人物位置</text>
        <view class="focus-segments">
          <view
            class="focus-option"
            v-for="focus in focusOptions"
            :key="focus.key"
            :class="{ active: form.coverFocus === focus.key }"
            @click="form.coverFocus = focus.key"
          >{{ focus.label }}</view>
        </view>
        <text class="focus-hint">只调整裁切焦点，不修改原图。</text>
      </view>
    </view>

    <view class="step-content" v-if="currentStep === 4">
      <view class="step-header">
        <text class="step-kicker">VISUAL STORY</text>
        <text class="step-title">定色成书</text>
        <text class="step-sub">先决定照片怎样讲故事，再选择整封婚书的情绪色。</text>
      </view>
      <scroll-view class="visual-scroll" scroll-x enhanced :show-scrollbar="false">
        <view class="visual-track">
          <view
            class="visual-option"
            v-for="visual in visualOptions"
            :key="visual.id"
            :class="[visual.className, { active: form.visualPreset === visual.id }]"
            @click="selectVisualPreset(visual)"
          >
            <view class="visual-photo-stage">
              <image class="visual-photo" :src="heroPreviewImage" mode="aspectFill" :style="heroPreviewStyle" />
              <view class="visual-photo-overlay" />
              <text class="visual-kicker">{{ visual.kicker }}</text>
              <text class="visual-names">{{ couplePreview }}</text>
            </view>
            <view class="visual-copy">
              <text class="visual-name">{{ visual.name }}</text>
              <text class="visual-desc">{{ visual.desc }}</text>
              <text class="visual-tier">{{ visual.premium ? '高级叙事' : '免费基础' }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
      <text class="choice-label">情绪色</text>
      <view class="mood-list">
        <view
          class="mood-item"
          v-for="mood in moodOptions"
          :key="mood.key"
          :class="{ active: form.theme === mood.key, premium: mood.premium, locked: mood.locked }"
          :style="{ '--mood-accent': mood.token.accent }"
          @click="selectMood(mood)"
        >
          <view class="mood-dot" />
          <view class="mood-copy">
            <text class="mood-name">{{ mood.name }}</text>
            <text class="mood-desc">{{ mood.desc }}</text>
          </view>
          <text class="mood-tier">{{ mood.locked ? '高级' : '可用' }}</text>
        </view>
      </view>
      <view class="theme-preview" :class="selectedVisualPreset.className">
        <image class="theme-preview-photo" :src="heroPreviewImage" mode="aspectFill" :style="heroPreviewStyle" />
        <view class="theme-preview-photo-scrim" />
        <text class="theme-preview-kicker">THE WEDDING OF</text>
        <text class="theme-preview-title">{{ couplePreview }}</text>
        <text class="theme-preview-body">{{ selectedTemplate.preset?.mainText }}</text>
        <view class="theme-preview-seal"><text>囍</text></view>
        <button class="theme-preview-link" @click="previewTemplate">查看完整预览</button>
      </view>
      <text class="theme-hint">{{ selectedMoodHint }}</text>
    </view>

    <BottomActionBar
      :primary-text="currentStep < 4 ? '下一幕' : '生成婚书'"
      :secondary-text="currentStep > 1 ? '上一幕' : ''"
      :loading="creating"
      :disabled="creating"
      :primary-disabled="!canContinue"
      @primary="handleStepPrimary"
      @secondary="prevStep"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { createWedding, updateWedding, uploadFile } from '@/composables/useCloud.js'
import { generateId, getWeekDay, showError, showSuccess } from '@/utils/index.js'
import { chooseAlbumImages, isAlbumPickerCancel } from '@/utils/albumPicker.js'
import { buildTemplateGuide, buildTemplateTimeline, getWeddingTemplate, WEDDING_SCENARIOS } from '@/utils/templates.js'
import { buildThemeCommercialState, canUseTheme } from '@/utils/commercial.js'
import { getThemeClass, getThemeTokens, isPremiumTheme, resolveTheme } from '@/utils/legacy-theme-map.js'
import { VISUAL_PRESETS, getVisualPreset, resolveVisualPreset } from '@/utils/visual-presets.js'
import { analyzeWeddingPhoto, focusPositionValue, photoQualityLabel } from '@/utils/photoDirector.js'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'

const userStore = useUserStore()
const weddingStore = useWeddingStore()

const MAX_ALBUM_PHOTOS = 9
const steps = [
  { index: 1, key: 'names', label: '具名' },
  { index: 2, key: 'venue', label: '择地' },
  { index: 3, key: 'photos', label: '选照' },
  { index: 4, key: 'theme', label: '定色' }
]

const currentStep = ref(1)
const creating = ref(false)
const pickedPhotos = ref([])

const form = ref({
  groomName: '',
  brideName: '',
  date: '',
  time: '',
  invitationText: '',
  venueName: '',
  venueAddress: '',
  theme: 'wine',
  scenarioPreset: 'rose-couture',
  visualPreset: 'cinematic-documentary',
  coverFocus: 'center'
})

const normalizedTheme = computed(() => resolveTheme(form.value.theme))
const suggestedDate = getSuggestedDate()
const suggestedTime = '12:00'
const themeClass = computed(() => getThemeClass(normalizedTheme.value))
const scenarioOptions = WEDDING_SCENARIOS
const visualOptions = VISUAL_PRESETS
const focusOptions = [
  { key: 'top', label: '偏上' },
  { key: 'center', label: '居中' },
  { key: 'bottom', label: '偏下' }
]
const selectedTemplate = computed(() => getWeddingTemplate(form.value.scenarioPreset))
const selectedVisualPreset = computed(() => getVisualPreset(form.value.visualPreset, form.value.scenarioPreset))
const heroPreviewStyle = computed(() => ({ objectPosition: focusPositionValue(form.value.coverFocus) }))
const selectedMoodHint = computed(() => isPremiumTheme(normalizedTheme.value)
  ? (canUseTheme(normalizedTheme.value, userStore.entitlements) ? '高级色情绪已解锁' : '高级色情绪体验中')
  : '酒红 · 信笺为免费默认色')
const canContinue = computed(() => {
  if (currentStep.value === 1) {
    return Boolean(
      form.value.groomName.trim() &&
      form.value.brideName.trim() &&
      form.value.date &&
      form.value.time &&
      form.value.invitationText.trim()
    )
  }
  if (currentStep.value === 2) {
    const venueName = form.value.venueName.trim()
    const venueAddress = form.value.venueAddress.trim()
    return Boolean(venueName && venueName.length <= 40 && venueAddress.length <= 80)
  }
  return true
})
const remainingPhotoSlots = computed(() => Math.max(0, MAX_ALBUM_PHOTOS - pickedPhotos.value.length))
const heroPreviewImage = computed(() => pickedPhotos.value[0]?.localPath || '/static/visuals/default-cover.png')
const couplePreview = computed(() => {
  const groom = form.value.groomName || '新郎'
  const bride = form.value.brideName || '新娘'
  return `${groom} & ${bride}`
})
const moodOptions = computed(() => {
  return [
    { key: 'wine', name: '酒红 · 信笺', desc: '免费默认，深情克制' },
    { key: 'cinnabar', name: '朱砂 · 囍宴', desc: '高级，热闹庄重' },
    { key: 'indigo', name: '黛蓝 · 远书', desc: '高级，夜色与远书感' },
    { key: 'pine', name: '松绿 · 庭园', desc: '高级，户外与自然光' }
  ].map(item => {
    const premium = isPremiumTheme(item.key)
    return {
      ...item,
      premium,
      locked: premium && !canUseTheme(item.key, userStore.entitlements),
      token: getThemeTokens(item.key)
    }
  })
})

function onDateChange(e) { form.value.date = e.detail.value }
function onTimeChange(e) { form.value.time = e.detail.value }
function getSuggestedDate() {
  const date = new Date()
  date.setDate(date.getDate() + 90)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function prevStep() {
  if (creating.value) return
  currentStep.value = Math.max(1, currentStep.value - 1)
}
function handleStepPrimary() {
  if (currentStep.value < 4) nextStep()
  else createWeddingAction()
}
function nextStep() {
  if (!validateStep()) return
  currentStep.value = Math.min(4, currentStep.value + 1)
}
function selectMood(mood) {
  if (creating.value) return
  form.value.theme = mood.key
  if (mood.locked) {
    uni.showToast({ title: '高级色体验中', icon: 'none' })
  }
}
function previewTemplate() {
  uni.navigateTo({
    url: `/pages-owner/template/preview?id=${encodeURIComponent(selectedTemplate.value.id)}&visual=${encodeURIComponent(form.value.visualPreset)}&theme=${encodeURIComponent(form.value.theme)}`,
    fail: (err) => {
      console.warn('创建向导打开模板预览失败:', err)
      showError('模板预览打开失败，请稍后重试')
    }
  })
}

function selectScenario(scenario) {
  form.value.scenarioPreset = scenario.id
  if (!form.value.invitationText.trim()) form.value.invitationText = scenario.preset?.mainText || ''
}

function selectVisualPreset(visual) {
  form.value.visualPreset = visual.id
  if (!pickedPhotos.value.length) form.value.coverFocus = visual.coverFocus || 'center'
}

async function chooseWizardImages() {
  if (creating.value) return
  if (!remainingPhotoSlots.value) {
    showError('精选相册最多 9 张')
    return
  }
  try {
    const filePaths = await chooseAlbumImages(remainingPhotoSlots.value, {
      maxCount: MAX_ALBUM_PHOTOS,
      sizeType: ['compressed']
    })
    for (const localPath of filePaths) {
      if (!remainingPhotoSlots.value) break
      const analysis = await analyzeWeddingPhoto(localPath)
      pickedPhotos.value.push({ id: generateId(), localPath, ...analysis })
    }
  } catch (err) {
    if (isAlbumPickerCancel(err)) return
    console.warn('向导选照失败:', err)
    showWizardPickerError(err)
  }
}
function removePickedPhoto(id) {
  pickedPhotos.value = pickedPhotos.value.filter(item => item.id !== id)
}
function showWizardPickerError(err) {
  const message = err?.message || '选照失败，请稍后重试'
  if (message.includes('微信公众平台')) {
    uni.showModal({
      title: '需完成平台声明',
      content: `${message}。用途建议填写：用于新人上传婚礼照片并制作婚礼相册、请柬封面与分享海报。`,
      showCancel: false,
      confirmText: '知道了'
    })
    return
  }
  showError(message)
}

function validateStep() {
  if (currentStep.value === 1) {
    if (!form.value.groomName.trim() || !form.value.brideName.trim()) {
      showError('请输入新人姓名')
      return false
    }
    if (!form.value.date) {
      showError('请选择婚礼日期')
      return false
    }
    if (!form.value.time) {
      showError('请选择婚礼时间')
      return false
    }
    if (!form.value.invitationText.trim()) {
      showError('请亲手写一句邀请的话')
      return false
    }
  }
  if (currentStep.value === 2) {
    if (!form.value.venueName.trim()) {
      showError('请输入场地名称')
      return false
    }
    if (form.value.venueName.trim().length > 40 || form.value.venueAddress.trim().length > 80) {
      showError('场地信息过长，请稍作精简')
      return false
    }
  }
  return true
}

async function createWeddingAction() {
  if (creating.value) return
  if (!validateStep()) return
  try {
    creating.value = true
    uni.showLoading({ title: '生成婚书中...', mask: true })
    const tpl = selectedTemplate.value
    const theme = normalizedTheme.value
    const commercialState = buildCommercialState(theme)
    const weddingPayload = buildWeddingPayload(tpl, theme, commercialState)
    const invitationPayload = buildInvitationPayload(tpl, theme, commercialState)
    const mainVenueId = 'main-venue'
    const venuesPayload = buildTemplateGuide(tpl.id, {
      mainVenueId,
      venueName: form.value.venueName || tpl?.preset?.venueName || '',
      venueAddress: form.value.venueAddress,
      time: form.value.time
    })
    const timelinePayload = buildTemplateTimeline(tpl.id, mainVenueId)

    const res = await createWedding({
      wedding: weddingPayload,
      invitation: invitationPayload,
      venues: venuesPayload,
      timeline: timelinePayload
    })
    if (!res?.success) throw new Error(res?.message || '云端创建失败')

    const weddingId = res.weddingId
    const albumPayload = await persistWizardPhotos(weddingId)
    if (albumPayload.photos[0]?.url) {
      weddingPayload.share_config.cover_image = albumPayload.photos[0].url
      await updateWedding(weddingId, 'weddings', weddingPayload).catch((err) => {
        console.warn('向导封面写回失败:', err)
      })
    }

    cacheWeddingData(weddingId, weddingPayload, invitationPayload, albumPayload, venuesPayload, timelinePayload)
    userStore.setWeddingId(weddingId)
    userStore.verifyOwner(true)
    showSuccess('婚书已生成')
    uni.reLaunch({
      url: '/pages-owner/manage/index',
      fail: (navErr) => {
        console.warn('创建后打开管理后台失败:', navErr)
        showError('婚礼已创建，但管理后台打开失败')
      }
    })
  } catch (err) {
    console.error('创建婚礼失败:', err)
    showError(err.message || '创建失败，请检查云开发环境')
  } finally {
    creating.value = false
    uni.hideLoading()
  }
}
function buildCommercialState(theme) {
  const state = buildThemeCommercialState(theme, userStore.entitlements)
  const visual = selectedVisualPreset.value
  const visualUnlocked = !visual.premium || Boolean(userStore.entitlements?.premium_templates)
  return {
    ...state,
    visual_preset: visual.id,
    visual_tier: visual.premium ? 'premium' : 'free',
    visual_entitlement: visual.premium ? 'premium_templates' : '',
    visual_access: visualUnlocked ? 'included' : 'preview',
    billing_state: state.billing_state === 'locked' || !visualUnlocked ? 'preview' : state.billing_state
  }
}
function buildWeddingPayload(tpl, theme, commercialState) {
  return {
    basic_info: { date: form.value.date, time: form.value.time, week_day: getWeekDay(form.value.date), theme },
    status: 'published',
    stats: { views: 0, shares: 0, rsvp_count: 0, blessing_count: 0, unique_viewers: 0 },
    commercial: {
      plan: userStore.plan || 'free',
      scenario_preset: tpl.id,
      template_id: tpl.id,
      visual_preset: form.value.visualPreset,
      theme_key: theme,
      ...commercialState
    },
    workspace: {
      plan: userStore.plan || 'free',
      scenario_preset: tpl.id,
      template_id: tpl.id,
      visual_preset: form.value.visualPreset,
      theme_key: theme,
      commercial_status: commercialState.billing_state || 'included'
    },
    share_config: {
      title: `${form.value.groomName} & ${form.value.brideName}的婚礼邀请`,
      description: `${form.value.date}，我们结婚啦！诚邀您的见证`,
      cover_image: ''
    }
  }
}
function buildInvitationPayload(tpl, theme, commercialState) {
  return {
    scenario_preset: tpl.id,
    template: tpl.id,
    visual_preset: resolveVisualPreset(form.value.visualPreset, tpl.id),
    theme,
    photo_treatment: 'original',
    cover_focus: form.value.coverFocus,
    album_layout: selectedVisualPreset.value.albumLayout,
    commercial: commercialState,
    content: {
      title: '婚礼请柬',
      main_text: form.value.invitationText.trim(),
      sub_text: '',
      story: ''
    },
    couple: {
      groom: { name: form.value.groomName, phone: '', photo: '' },
      bride: { name: form.value.brideName, phone: '', photo: '' }
    },
    wedding: {
      date: form.value.date,
      time: form.value.time,
      venue_name: form.value.venueName || tpl?.preset?.venueName || '',
      venue_address: form.value.venueAddress
    },
    features: {
      show_countdown: true,
      show_rsvp: true,
      show_blessing: true,
      show_timeline: true,
      rsvp_phone_required: false,
      allow_rsvp_update: true,
      blessing_public: true,
      allow_anonymous_blessing: true
    }
  }
}
async function persistWizardPhotos(weddingId) {
  if (!pickedPhotos.value.length) return { photos: [] }
  const uploaded = []
  uni.showLoading({ title: '上传照片中...', mask: true })
  for (const [index, photo] of pickedPhotos.value.entries()) {
    const cloudPath = buildAlbumCloudPath(weddingId, photo.localPath, photo.id)
    const cloudRes = await uploadFile(photo.localPath, cloudPath)
    if (!cloudRes?.fileID) throw new Error('云存储未返回照片地址')
    uploaded.push({
      id: photo.id,
      url: cloudRes.fileID,
      type: index === 0 ? 'cover' : 'normal',
      caption: index === 0 ? '扉页照片' : `银盐相册 ${index}`,
      width: photo.width,
      height: photo.height,
      orientation: photo.orientation,
      quality_state: photo.quality,
      focus_position: index === 0 ? form.value.coverFocus : 'center',
      upload_time: new Date().toISOString()
    })
  }
  const albumPayload = { photos: uploaded, updated_at: new Date().toISOString() }
  await updateWedding(weddingId, 'albums', albumPayload)
  return albumPayload
}
function buildAlbumCloudPath(weddingId, localPath, id) {
  const cleanPath = String(localPath || '').split('?')[0]
  const extMatch = cleanPath.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg'
  return `weddings/${weddingId}/albums/${id}.${ext}`
}
function cacheWeddingData(weddingId, weddingPayload, invitationPayload, albumPayload, venuesPayload, timelinePayload) {
  const weddings = uni.getStorageSync('weddings') || {}
  weddings[weddingId] = { wedding_id: weddingId, ...weddingPayload }
  uni.setStorageSync('weddings', weddings)
  uni.setStorageSync(`invitation_${weddingId}`, { wedding_id: weddingId, ...invitationPayload })
  weddingStore.setWeddingData({
    wedding: { wedding_id: weddingId, ...weddingPayload },
    invitation: { wedding_id: weddingId, ...invitationPayload },
    album: albumPayload,
    venues: venuesPayload,
    timeline: timelinePayload,
    guests: { guests: [] },
    blessings: { blessings: [] }
  })
}

onShow(() => {
  const pendingTemplateId = uni.getStorageSync('pending_template_id')
  const pendingVisualPresetId = uni.getStorageSync('pending_visual_preset_id')
  if (pendingTemplateId) {
    uni.removeStorageSync('pending_template_id')
    const pendingTemplate = getWeddingTemplate(pendingTemplateId)
    form.value.scenarioPreset = pendingTemplate.id
    form.value.visualPreset = resolveVisualPreset(pendingVisualPresetId, pendingTemplate.id)
    form.value.theme = pendingTemplate.theme || 'wine'
  }
  if (pendingVisualPresetId) uni.removeStorageSync('pending_visual_preset_id')
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  background: $paper-bg;
  color: $ink;
}
.step-bar {
  padding: $sp-5 $sp-5 0;
}
.seal-steps,
.step-labels,
.form-grid.two,
.mood-item {
  display: flex;
}
.seal-steps {
  justify-content: space-between;
  position: relative;
}
.seal-steps::before {
  content: "";
  position: absolute;
  left: $sp-4;
  right: $sp-4;
  top: 31rpx;
  height: 1rpx;
  background: $line;
}
.seal-step {
  position: relative;
  z-index: 1;
  width: 64rpx;
  height: 64rpx;
  border-radius: $r-full;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $paper-card;
  border: 1rpx solid $line;
  color: $ink-faint;
  font-family: $font-num;
  font-size: $fs-note;
}
.seal-step.active {
  background: var(--accent);
  border-color: var(--accent-ink);
  color: var(--on-accent);
  box-shadow: 0 6rpx 24rpx var(--accent-glow);
}
.step-labels {
  justify-content: space-between;
  margin-top: $sp-2;
}
.step-label {
  width: 64rpx;
  text-align: center;
  color: $ink-soft;
  font-size: $fs-note;
}
.step-content {
  padding: $sp-6 $sp-5 calc(132rpx + env(safe-area-inset-bottom));
}
.step-header {
  margin-bottom: $sp-5;
}
.step-kicker {
  display: block;
  @include eyebrow;
}
.step-title {
  display: block;
  margin-top: $sp-1;
  color: $ink;
  font-family: $font-serif;
  font-size: $fs-title;
  letter-spacing: $ls-cn;
  line-height: $lh-title;
}
.step-sub {
  display: block;
  margin-top: $sp-2;
  color: $ink-soft;
  font-size: $fs-body;
  line-height: $lh-body;
}
.form-grid.two {
  gap: $sp-4;
}
.form-grid.two .form-group {
  flex: 1;
}
.form-group {
  margin-bottom: $sp-5;
}
.form-label {
  display: block;
  margin-bottom: $sp-2;
  color: $ink-soft;
  font-size: $fs-note;
}
.form-input,
.picker-value {
  width: 100%;
  height: $sp-6;
  line-height: $sp-6;
  border-bottom: 1rpx solid $line;
  background: transparent;
  color: $ink;
  font-size: $fs-body;
  box-sizing: border-box;
}
.form-textarea {
  width: 100%;
  min-height: 176rpx;
  padding: $sp-2 0;
  border-bottom: 1rpx solid $line;
  background: transparent;
  color: $ink;
  font-size: $fs-body;
  line-height: $lh-body;
}
.venue-card,
.theme-preview {
  @include card;
  padding: $sp-4;
}
.scenario-block {
  margin-top: $sp-5;
}
.scenario-scroll,
.visual-scroll {
  width: 100%;
  white-space: nowrap;
}
.scenario-track,
.visual-track {
  display: inline-flex;
  align-items: stretch;
  gap: $sp-3;
  padding: 0 $sp-5 $sp-3 0;
}
.scenario-item {
  width: 240rpx;
  min-height: 120rpx;
  padding: $sp-3;
  box-sizing: border-box;
  background: $paper-card;
  border: 1rpx solid $line;
  border-left: 4rpx solid transparent;
}
.scenario-item.active {
  border-color: var(--accent-line);
  border-left-color: var(--accent);
  background: var(--accent-soft);
}
.scenario-name,
.scenario-desc {
  display: block;
  white-space: normal;
}
.scenario-name {
  color: $ink;
  font-family: $font-serif;
  font-size: $fs-body;
}
.scenario-desc {
  margin-top: $sp-1;
  color: $ink-soft;
  font-size: $fs-note;
  line-height: 1.5;
}
.venue-card-label,
.theme-preview-kicker {
  display: block;
  @include eyebrow;
}
.venue-card-time,
.theme-preview-title {
  display: block;
  margin-top: $sp-2;
  color: var(--accent);
  font-family: $font-num;
  font-size: $fs-title;
  line-height: $lh-title;
}
.venue-card-copy,
.theme-preview-body,
.theme-hint {
  display: block;
  margin-top: $sp-3;
  color: $ink-soft;
  font-size: $fs-note;
  line-height: $lh-body;
}
.upload-mount {
  @include card;
  padding: $sp-5;
  margin-bottom: $sp-4;
  text-align: center;
  border-style: dashed;
}
.upload-mount.disabled {
  opacity: 0.56;
}
.upload-title,
.upload-sub {
  display: block;
}
.upload-title {
  color: var(--accent);
  font-family: $font-serif;
  font-size: $fs-title;
}
.upload-sub {
  margin-top: $sp-2;
  color: $ink-soft;
  font-size: $fs-note;
}
.photo-strip {
  width: 100%;
  white-space: nowrap;
  margin-bottom: $sp-5;
}
.photo-mount {
  display: inline-block;
  width: 280rpx;
  margin-right: $sp-3;
  vertical-align: top;
  @include photo-mount;
  box-sizing: border-box;
}
.photo-frame {
  position: relative;
  width: 100%;
  padding-top: $photo-ratio;
  overflow: hidden;
  background: $paper-deep;
}
.photo-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.photo-caption,
.photo-remove {
  display: block;
  margin-top: $sp-2;
  text-align: center;
  font-size: $fs-cap;
}
.photo-meta,
.photo-quality {
  display: block;
  margin-top: $sp-1;
  text-align: center;
  white-space: normal;
  font-size: $fs-note;
  line-height: 1.5;
}
.photo-meta {
  color: $ink-soft;
}
.photo-quality {
  color: var(--accent);
}
.photo-quality.low {
  color: $ink-soft;
}
.photo-caption {
  color: $ink-soft;
  font-family: $font-num;
}
.photo-remove {
  color: var(--accent);
}
.hero-preview {
  position: relative;
  height: 760rpx;
  overflow: hidden;
  background: $paper-deep;
}
.hero-preview-img,
.hero-preview-scrim {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.hero-preview-scrim {
  @include photo-hero-scrim;
}
.hero-preview-copy {
  position: absolute;
  left: $sp-5;
  right: $sp-5;
  bottom: $sp-6;
  text-align: center;
}
.hero-kicker,
.hero-names,
.hero-date {
  display: block;
}
.focus-control {
  margin-top: $sp-4;
  margin-bottom: $sp-5;
}
.focus-segments {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1rpx solid $line;
  background: $paper-card;
}
.focus-option {
  height: $sp-6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $ink-soft;
  font-size: $fs-note;
  border-right: 1rpx solid $line;
}
.focus-option:last-child {
  border-right: 0;
}
.focus-option.active {
  color: var(--accent);
  background: var(--accent-soft);
}
.focus-hint {
  display: block;
  margin-top: $sp-2;
  color: $ink-faint;
  font-size: $fs-note;
}
.visual-scroll {
  margin-bottom: $sp-5;
}
.visual-option {
  width: 400rpx;
  overflow: hidden;
  box-sizing: border-box;
  background: $paper-card;
  border: 1rpx solid $line;
  vertical-align: top;
}
.visual-option.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2rpx var(--accent-line);
}
.visual-photo-stage {
  position: relative;
  height: 480rpx;
  overflow: hidden;
  background: $paper-deep;
}
.visual-photo,
.visual-photo-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.visual-photo-overlay {
  background: linear-gradient(to bottom, rgba(42, 35, 29, 0.02) 36%, rgba(42, 35, 29, 0.7) 100%);
}
.visual-kicker,
.visual-names {
  position: absolute;
  z-index: 1;
  left: $sp-3;
  right: $sp-3;
  display: block;
  color: $ink-inverse;
  white-space: normal;
}
.visual-kicker {
  bottom: 88rpx;
  font-family: $font-num;
  font-size: $fs-cap;
  letter-spacing: $ls-wide;
}
.visual-names {
  bottom: $sp-3;
  font-family: $font-serif;
  font-size: $fs-title;
  line-height: 1.3;
}
.visual-copy {
  min-height: 192rpx;
  padding: $sp-3;
  white-space: normal;
  box-sizing: border-box;
}
.visual-name,
.visual-desc,
.visual-tier {
  display: block;
}
.visual-name {
  color: $ink;
  font-family: $font-serif;
  font-size: $fs-body;
}
.visual-desc {
  margin-top: $sp-1;
  color: $ink-soft;
  font-size: $fs-note;
  line-height: 1.5;
}
.visual-tier {
  margin-top: $sp-2;
  color: $gold;
  font-size: $fs-note;
}
.visual-heritage .visual-photo {
  inset: $sp-3;
  width: calc(100% - #{$sp-6});
  height: calc(100% - #{$sp-6});
}
.visual-heritage .visual-photo-stage {
  background: $paper-card;
}
.visual-heritage .visual-photo-overlay {
  background: linear-gradient(to bottom, rgba(42, 35, 29, 0) 40%, rgba(158, 51, 34, 0.68) 100%);
}
.visual-garden .visual-photo-stage {
  border: $photo-border solid $photo-matte;
  box-sizing: border-box;
}
.visual-editorial .visual-kicker {
  top: $sp-3;
  bottom: auto;
}
.visual-editorial .visual-names {
  text-align: right;
}
.visual-night .visual-photo-overlay {
  background: linear-gradient(to bottom, rgba(20, 24, 28, 0.18) 20%, rgba(20, 24, 28, 0.84) 100%);
}
.choice-label {
  display: block;
  margin-bottom: $sp-3;
  color: $ink;
  font-family: $font-serif;
  font-size: $fs-body;
}
.hero-kicker {
  @include eyebrow;
}
.hero-names {
  margin-top: $sp-2;
  color: $ink;
  font-family: $font-serif;
  font-size: $fs-hero;
  line-height: $lh-title;
}
.hero-date {
  margin-top: $sp-2;
  color: var(--accent);
  font-family: $font-num;
  font-size: $fs-note;
}
.mood-list {
  display: flex;
  flex-direction: column;
  gap: $sp-3;
  margin-bottom: $sp-5;
}
.mood-item {
  align-items: center;
  gap: $sp-3;
  padding: $sp-3;
  border: 1rpx solid $line;
  background: $paper-card;
}
.mood-item.active {
  border-color: var(--mood-accent);
  background: $paper-card;
}
.mood-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: $r-full;
  background: var(--mood-accent);
}
.mood-copy {
  flex: 1;
  min-width: 0;
}
.mood-name,
.mood-desc {
  display: block;
}
.mood-name {
  color: $ink;
  font-family: $font-serif;
  font-size: $fs-body;
}
.mood-desc {
  margin-top: $sp-1;
  color: $ink-soft;
  font-size: $fs-cap;
}
.mood-tier {
  color: $gold;
  font-size: $fs-cap;
}
.theme-preview-seal {
  width: 88rpx;
  height: 88rpx;
  margin: $sp-4 auto 0;
  border-radius: $r-full;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  border: 4rpx solid var(--accent-ink);
  color: var(--on-accent);
  font-family: $font-serif;
  font-size: $fs-title;
  box-shadow: 0 6rpx 24rpx var(--accent-glow);
}
.theme-preview {
  position: relative;
  overflow: hidden;
  padding-top: 392rpx;
}
.theme-preview-photo,
.theme-preview-photo-scrim {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 360rpx;
}
.theme-preview-photo-scrim {
  background: linear-gradient(to bottom, rgba(247, 242, 233, 0) 28%, $paper-card 100%);
}
.theme-preview-kicker,
.theme-preview-title,
.theme-preview-body,
.theme-preview-seal,
.theme-preview-link {
  position: relative;
  z-index: 1;
}
.theme-preview-link {
  margin-top: $sp-4;
  height: $sp-6;
  line-height: $sp-6;
  border-radius: $r-sm;
  background: var(--accent);
  color: var(--on-accent);
  font-size: $fs-note;
}
.theme-preview-link::after {
  border: none;
}
</style>
