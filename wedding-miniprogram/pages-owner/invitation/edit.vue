<template>
  <PageShell
    class="page invitation-edit-page"
    kicker="INVITATION"
    title="婚书编辑"
    desc="场景方案负责预填内容，情绪色只改变强调处；保存后同步宾客端婚书。"
  >

    <!-- 场景方案 -->
    <view class="section">
      <SectionHeader title="场景方案" kicker="SCENARIO" desc="只预填文案、礼序和路书，不改变纸墨金视觉骨架。" compact />
      <view class="scenario-list">
        <view
          class="scenario-row"
          v-for="tpl in templates"
          :key="tpl.id"
          :class="{ active: form.scenarioPreset === tpl.id, disabled: saving }"
          @click="selectTemplate(tpl)"
        >
          <view class="scenario-copy">
            <text class="scenario-name">{{ tpl.name }}</text>
            <text class="scenario-desc">{{ tpl.plan?.scenario }} · {{ tpl.copy }}</text>
          </view>
          <text class="scenario-state">{{ form.scenarioPreset === tpl.id ? '已选' : '选择' }}</text>
        </view>
      </view>
      <view class="template-panel">
        <view class="template-panel-head">
          <view>
            <text class="template-panel-kicker">{{ activeTemplate.kicker }}</text>
            <text class="template-panel-title">{{ activeTemplate.name }}</text>
          </view>
          <view class="template-panel-badges">
            <text class="template-panel-tier">场景方案</text>
            <text class="template-panel-status">当前选择</text>
          </view>
        </view>
        <text class="template-panel-copy">{{ activeTemplate.copy }}</text>
        <text class="template-panel-hint">{{ activeTemplateHint }}</text>
        <view class="template-panel-actions">
          <button class="template-panel-btn primary" :class="{ 'is-disabled': saving }" :disabled="saving" @click="previewTemplate">预览此方案</button>
          <button class="template-panel-btn" :class="{ 'is-disabled': saving }" :disabled="saving" @click="applyTemplatePreset">套用预设文案</button>
        </view>
      </view>
    </view>

    <view class="section">
      <SectionHeader title="视觉叙事" kicker="VISUAL STORY" desc="决定照片构图、相册节奏与分享海报；不会修改原片颜色。" compact />
      <scroll-view class="visual-scroll" scroll-x enhanced :show-scrollbar="false">
        <view class="visual-track">
          <view
            class="visual-option"
            v-for="visual in visualOptions"
            :key="visual.id"
            :class="[visual.className, { active: form.visualPreset === visual.id, disabled: saving }]"
            @click="selectVisualPreset(visual)"
          >
            <text class="visual-kicker">{{ visual.kicker }}</text>
            <text class="visual-name">{{ visual.name }}</text>
            <text class="visual-desc">{{ visual.desc }}</text>
            <text class="visual-tier">{{ visual.premium ? '高级叙事' : '免费基础' }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="section">
      <SectionHeader title="情绪色" kicker="INK COLOR" desc="酒红免费；朱砂、黛蓝、松绿为高级色。" compact />
      <view class="mood-grid">
        <view
          class="mood-option"
          v-for="mood in moodOptions"
          :key="mood.key"
          :class="{ active: form.theme === mood.key, locked: mood.locked }"
          :style="{ '--mood-accent': mood.accent }"
          @click="selectTheme(mood)"
        >
          <view class="mood-swatch" />
          <view class="mood-copy"><text>{{ mood.name }}</text><text>{{ mood.locked ? '高级色' : '可用' }}</text></view>
        </view>
      </view>
    </view>

    <!-- 笔墨 -->
    <view class="section">
      <SectionHeader title="笔墨" kicker="PHOTO TONE" desc="默认保留原片；银盐和淡彩需主动选择。" compact />
      <view class="photo-tone-row">
        <text
          class="photo-tone-pill"
          v-for="item in photoToneOptions"
          :key="item.value"
          :class="{ active: form.photoTreatment === item.value, disabled: saving }"
          @click="selectPhotoTreatment(item.value)"
        >
          {{ item.label }}
        </text>
      </view>
    </view>

    <!-- 邀请文案 -->
    <view class="section">
      <SectionHeader title="邀请文案" kicker="COPY" desc="建议保持真诚克制，长辈和朋友都能一眼读懂。" compact />
      <view class="ai-tone-row">
        <text
          class="ai-tone-pill"
          v-for="tone in aiToneOptions"
          :key="tone.value"
          :class="{ active: aiTone === tone.value, disabled: aiLoading || saving }"
          @click="selectAiTone(tone.value)"
        >
          {{ tone.label }}
        </text>
      </view>
      <AiSuggestionPanel
        title="AI 邀请文案"
        desc="按当前模板、新人、婚期和场地生成候选；应用后仍需点击保存。"
        generate-text="生成文案"
        empty-text="选择语气后生成 3 版邀请文案。"
        :suggestions="aiSuggestions"
        :warnings="aiWarnings"
        :error="aiError"
        :loading="aiLoading"
        :disabled="saving"
        @generate="generateInvitationCopy"
        @apply="applyInvitationCopy"
      />
      <textarea
        class="form-textarea"
        v-model="form.content"
        :disabled="saving"
        placeholder="请输入邀请文案"
        maxlength="500"
      />
    </view>

    <!-- 新人信息 -->
    <view class="section">
      <SectionHeader title="新人信息" kicker="COUPLE" desc="姓名会出现在首页、分享卡片和海报中。" compact />
      <view class="form-row">
        <view class="form-col">
          <text class="form-sub-label">新郎</text>
          <input class="form-input" v-model="form.groomName" :disabled="saving" maxlength="20" placeholder="姓名" />
        </view>
        <view class="form-col">
          <text class="form-sub-label">新娘</text>
          <input class="form-input" v-model="form.brideName" :disabled="saving" maxlength="20" placeholder="姓名" />
        </view>
      </view>
    </view>

    <!-- 婚礼信息 -->
    <view class="section">
      <SectionHeader title="婚礼信息" kicker="DATE & VENUE" desc="日期、时间和主场地会影响首页行动台与回执提示。" compact />
      <view class="form-group">
        <text class="form-sub-label">日期</text>
        <picker mode="date" :value="form.date" :disabled="saving" @change="onDateChange">
          <view class="picker-value">{{ form.date || '请选择日期' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-sub-label">时间</text>
        <picker mode="time" :value="form.time" :disabled="saving" @change="onTimeChange">
          <view class="picker-value">{{ form.time || '请选择时间' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-sub-label">场地</text>
        <input class="form-input" v-model="form.venueName" :disabled="saving" maxlength="40" placeholder="场地名称" />
      </view>
    </view>

    <!-- 功能开关 -->
    <view class="section">
      <SectionHeader title="显示设置" kicker="MODULES" desc="控制宾客端首页、回执、祝福墙和流程模块是否展示。" compact />
      <view class="switch-list">
        <view class="switch-item">
          <text class="switch-label">显示倒计时</text>
          <switch :checked="form.showCountdown" :disabled="saving" :color="nativeAccentColor" @change="form.showCountdown = $event.detail.value" />
        </view>
        <view class="switch-item">
          <text class="switch-label">显示RSVP</text>
          <switch :checked="form.showRsvp" :disabled="saving" :color="nativeAccentColor" @change="form.showRsvp = $event.detail.value" />
        </view>
        <view class="switch-item sub" v-if="form.showRsvp">
          <text class="switch-label">RSVP联系电话必填</text>
          <switch :checked="form.rsvpPhoneRequired" :disabled="saving" :color="nativeAccentColor" @change="form.rsvpPhoneRequired = $event.detail.value" />
        </view>
        <view class="switch-item sub" v-if="form.showRsvp">
          <text class="switch-label">允许宾客修改回执</text>
          <switch :checked="form.allowRsvpUpdate" :disabled="saving" :color="nativeAccentColor" @change="form.allowRsvpUpdate = $event.detail.value" />
        </view>
        <view class="switch-item">
          <text class="switch-label">显示祝福墙</text>
          <switch :checked="form.showBlessing" :disabled="saving" :color="nativeAccentColor" @change="form.showBlessing = $event.detail.value" />
        </view>
        <view class="switch-item sub" v-if="form.showBlessing">
          <text class="switch-label">祝福公开展示</text>
          <switch :checked="form.blessingPublic" :disabled="saving" :color="nativeAccentColor" @change="form.blessingPublic = $event.detail.value" />
        </view>
        <view class="switch-item sub" v-if="form.showBlessing">
          <text class="switch-label">允许匿名祝福</text>
          <switch :checked="form.allowAnonymousBlessing" :disabled="saving" :color="nativeAccentColor" @change="form.allowAnonymousBlessing = $event.detail.value" />
        </view>
        <view class="switch-item">
          <text class="switch-label">显示流程</text>
          <switch :checked="form.showTimeline" :disabled="saving" :color="nativeAccentColor" @change="form.showTimeline = $event.detail.value" />
        </view>
      </view>
    </view>

    <!-- 背景音乐 -->
    <view class="section">
      <SectionHeader title="背景音乐" kicker="MUSIC" desc="开启后会随首页互动播放，仍遵守小程序音频触发限制。" compact />
      <view class="switch-item">
        <text class="switch-label">开启背景音乐</text>
        <switch :checked="form.bgMusicEnabled" :disabled="saving" :color="nativeAccentColor" @change="form.bgMusicEnabled = $event.detail.value" />
      </view>
      <view class="music-presets" v-if="form.bgMusicEnabled">
        <view
          class="music-item"
          v-for="music in musicPresets"
          :key="music.id"
          :class="{ active: form.bgMusicId === music.id, disabled: saving }"
          @click="selectMusic(music)"
        >
          <image
            class="visual-icon-sm music-icon"
            :src="form.bgMusicId === music.id ? '/static/visuals/icon-speaker.svg' : '/static/visuals/icon-music.svg'"
            mode="aspectFit"
          />
          <text class="music-name">{{ music.name }}</text>
        </view>
      </view>
      <view class="music-tip" v-if="form.bgMusicEnabled">
        <text>提示：宾客进入首页后，需点击页面任意位置后音乐才会自动播放</text>
      </view>
    </view>

    <BottomActionBar
      primary-text="保存"
      secondary-text="预览"
      :loading="saving"
      :disabled="saving"
      @primary="saveInvitation"
      @secondary="previewInvitation"
    />
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess, showError } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { generateAiSuggestions, updateWedding } from '@/composables/useCloud.js'
import { WEDDING_SCENARIOS, getWeddingScenario, getWeddingTemplate, normalizeTemplateId } from '@/utils/templates.js'
import { buildThemeCommercialState, canUseTheme } from '@/utils/commercial.js'
import { getThemeTokens, isPremiumTheme, resolveTheme } from '@/utils/legacy-theme-map.js'
import { VISUAL_PRESETS, getVisualPreset, resolveVisualPreset } from '@/utils/visual-presets.js'
import PageShell from '@/components/ui/PageShell.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import AiSuggestionPanel from '@/components/ui/AiSuggestionPanel.vue'

const store = useWeddingStore()
const userStore = useUserStore()
const saving = ref(false)

const templates = WEDDING_SCENARIOS
const visualOptions = VISUAL_PRESETS
const activeTemplate = computed(() => getWeddingScenario(form.value.scenarioPreset))
const activeTemplateHint = computed(() => '场景方案只会替换你主动套用的文案，不会改变当前情绪色。')
const nativeAccentColor = computed(() => getThemeTokens(form.value.theme).accent)
const moodOptions = computed(() => [
  { key: 'wine', name: '酒红 · 信笺' },
  { key: 'cinnabar', name: '朱砂 · 囍宴' },
  { key: 'indigo', name: '黛蓝 · 远书' },
  { key: 'pine', name: '松绿 · 庭园' }
].map(item => ({
  ...item,
  accent: getThemeTokens(item.key).accent,
  locked: isPremiumTheme(item.key) && !canUseTheme(item.key, userStore.entitlements)
})))
const aiLoading = ref(false)
const aiError = ref('')
const aiWarnings = ref([])
const aiSuggestions = ref([])
const aiTone = ref('luxury_refined')
const aiToneOptions = [
  { label: '高级礼宴', value: 'luxury_refined' },
  { label: '长辈正式', value: 'elder_friendly' },
  { label: '朋友温柔', value: 'friends_warm' }
]
const photoToneOptions = [
  { label: '原片', value: 'original' },
  { label: '银盐黑白', value: 'silver' },
  { label: '淡彩', value: 'tint' }
]

const musicPresets = [
  { id: 'piano-dream', name: '梦中的钢琴', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'gentle-love', name: '温柔爱意', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'eternal-vow', name: '永恒誓言', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
]

const form = ref({
  scenarioPreset: 'rose-couture',
  visualPreset: 'cinematic-documentary',
  theme: 'wine',
  content: '',
  groomName: '',
  brideName: '',
  date: '',
  time: '',
  venueName: '',
  showCountdown: true,
  showRsvp: true,
  rsvpPhoneRequired: false,
  allowRsvpUpdate: true,
  showBlessing: true,
  blessingPublic: true,
  allowAnonymousBlessing: true,
  showTimeline: true,
  bgMusicEnabled: false,
  bgMusicId: '',
  bgMusicUrl: '',
  photoTreatment: 'original'
})

function loadFromStore() {
  const inv = store.invitation || {}
  const wedding = store.wedding || {}
  form.value = {
    scenarioPreset: normalizeTemplateId(inv.scenario_preset || inv.template),
    visualPreset: resolveVisualPreset(inv.visual_preset, inv.scenario_preset || inv.template),
    theme: resolveTheme(inv.theme || wedding.basic_info?.theme),
    content: inv.content?.main_text || '',
    groomName: inv.couple?.groom?.name || '',
    brideName: inv.couple?.bride?.name || '',
    date: wedding.basic_info?.date || '',
    time: wedding.basic_info?.time || '',
    venueName: inv.wedding?.venue_name || '',
    showCountdown: inv.features?.show_countdown !== false,
    showRsvp: inv.features?.show_rsvp !== false,
    rsvpPhoneRequired: inv.features?.rsvp_phone_required === true,
    allowRsvpUpdate: inv.features?.allow_rsvp_update !== false,
    showBlessing: inv.features?.show_blessing !== false,
    blessingPublic: inv.features?.blessing_public !== false,
    allowAnonymousBlessing: inv.features?.allow_anonymous_blessing !== false,
    showTimeline: inv.features?.show_timeline !== false,
    bgMusicEnabled: inv.features?.bg_music_enabled || false,
    bgMusicId: inv.features?.bg_music_id || '',
    bgMusicUrl: inv.features?.bg_music_url || '',
    photoTreatment: inv.photo_treatment || 'original'
  }
}

function selectMusic(music) {
  if (guardInvitationSaving()) return
  form.value.bgMusicId = music.id
  form.value.bgMusicUrl = music.url
}

function selectTemplate(tpl) {
  if (guardInvitationSaving()) return
  form.value.scenarioPreset = normalizeTemplateId(tpl.id)
}

function selectVisualPreset(visual) {
  if (guardInvitationSaving()) return
  form.value.visualPreset = visual.id
  applyLocalPreviewData()
  if (visual.premium && !userStore.entitlements?.premium_templates) {
    uni.showToast({ title: '高级视觉体验中', icon: 'none' })
  }
}

function selectTheme(mood) {
  if (guardInvitationSaving()) return
  form.value.theme = mood.key
  applyLocalPreviewData()
  if (mood.locked) uni.showToast({ title: '高级色体验中', icon: 'none' })
}

function onDateChange(e) { form.value.date = e.detail.value }
function onTimeChange(e) { form.value.time = e.detail.value }

function selectAiTone(value) {
  if (aiLoading.value || saving.value) return
  aiTone.value = value
}

function selectPhotoTreatment(value) {
  if (guardInvitationSaving()) return
  form.value.photoTreatment = value || 'original'
  applyLocalPreviewData()
}

async function generateInvitationCopy() {
  if (aiLoading.value || saving.value) return
  aiLoading.value = true
  aiError.value = ''
  aiWarnings.value = []
  try {
    const res = await generateAiSuggestions('invitation_copy', {
      tone: aiTone.value,
      context: buildAiInvitationContext()
    })
    aiSuggestions.value = res.suggestions || []
    aiWarnings.value = res.warnings || []
  } catch (err) {
    aiError.value = err?.message || 'AI 文案生成失败，请稍后重试'
  } finally {
    aiLoading.value = false
  }
}

function applyInvitationCopy(item) {
  if (saving.value) return
  const content = String(item?.content || '').trim()
  if (!content) {
    showError('候选文案为空')
    return
  }
  form.value.content = content
  applyLocalPreviewData()
  showSuccess('已应用到文案，请保存')
}

function buildAiInvitationContext() {
  return {
    template: activeTemplate.value?.name,
    templateScenario: activeTemplate.value?.plan?.scenario,
    templateCopyRule: activeTemplate.value?.plan?.invitationCopy,
    groomName: form.value.groomName,
    brideName: form.value.brideName,
    weddingDate: form.value.date,
    weddingTime: form.value.time,
    venueName: form.value.venueName,
    venueAddress: store.invitation?.wedding?.venue_address || '',
    currentCopy: form.value.content
  }
}

function buildInvitationData() {
  const commercial = buildThemeCommercialState(form.value.theme, userStore.entitlements)
  const theme = resolveTheme(form.value.theme)
  const visual = getVisualPreset(form.value.visualPreset, form.value.scenarioPreset)
  return {
    scenario_preset: form.value.scenarioPreset,
    template: form.value.scenarioPreset,
    visual_preset: visual.id,
    theme,
    commercial: {
      ...commercial,
      visual_preset: visual.id,
      visual_tier: visual.premium ? 'premium' : 'free',
      visual_entitlement: visual.premium ? 'premium_templates' : '',
      visual_access: !visual.premium || userStore.entitlements?.premium_templates ? 'included' : 'preview'
    },
    photo_treatment: form.value.photoTreatment || 'original',
    album_layout: visual.albumLayout,
    content: {
      title: '婚礼请柬',
      main_text: form.value.content,
      sub_text: '',
      story: ''
    },
    couple: {
      groom: { name: form.value.groomName, phone: store.invitation?.couple?.groom?.phone || '', photo: '' },
      bride: { name: form.value.brideName, phone: store.invitation?.couple?.bride?.phone || '', photo: '' }
    },
    wedding: {
      date: form.value.date,
      time: form.value.time,
      venue_name: form.value.venueName,
      venue_address: store.invitation?.wedding?.venue_address || ''
    },
    features: {
      show_countdown: form.value.showCountdown,
      show_rsvp: form.value.showRsvp,
      rsvp_phone_required: form.value.rsvpPhoneRequired,
      allow_rsvp_update: form.value.allowRsvpUpdate,
      show_blessing: form.value.showBlessing,
      blessing_public: form.value.blessingPublic,
      allow_anonymous_blessing: form.value.allowAnonymousBlessing,
      show_timeline: form.value.showTimeline,
      bg_music_enabled: form.value.bgMusicEnabled,
      bg_music_id: form.value.bgMusicId,
      bg_music_url: form.value.bgMusicUrl
    }
  }
}

function buildWeddingData() {
  const theme = resolveTheme(form.value.theme)
  return {
    basic_info: {
      ...(store.wedding?.basic_info || {}),
      date: form.value.date,
      time: form.value.time,
      theme
    },
    commercial: {
      ...(store.wedding?.commercial || {}),
      plan: userStore.plan || store.wedding?.commercial?.plan || 'free',
      scenario_preset: form.value.scenarioPreset,
      template_id: form.value.scenarioPreset,
      visual_preset: form.value.visualPreset,
      theme_key: theme,
      ...buildThemeCommercialState(theme, userStore.entitlements)
    }
  }
}

function applyLocalPreviewData() {
  const weddingData = buildWeddingData()
  store.updateInvitation(buildInvitationData())
  store.updateWeddingField('basic_info', weddingData.basic_info)
  store.updateWeddingField('commercial', weddingData.commercial)
}

function applyTemplatePreset() {
  if (guardInvitationSaving()) return
  uni.showModal({
    title: '套用预设文案',
    content: '会替换邀请文案，并在场地为空时填入示例场景；不会修改新人姓名、日期和已上传照片。',
    confirmText: '套用',
    success: (res) => {
      if (!res.confirm) return
      form.value.content = activeTemplate.value.preset?.mainText || form.value.content
      if (!form.value.venueName) {
        form.value.venueName = activeTemplate.value.preset?.venueName || ''
      }
      applyLocalPreviewData()
      uni.showToast({ title: '已套用，可预览', icon: 'success' })
    }
  })
}

async function saveInvitation() {
  if (saving.value) return
  if (!validateInvitationForm()) return
  try {
    saving.value = true
    uni.showLoading({ title: '保存中...', mask: true })
    const invitationData = buildInvitationData()
    const weddingData = buildWeddingData()

    // 逐个同步云端，避免 Promise.all 部分成功导致状态不一致
    let invitationOk = true
    let weddingOk = true
    try { await updateWedding(userStore.weddingId, 'invitations', invitationData) }
    catch (err) { console.error('invitations 保存失败:', err); invitationOk = false }
    try { await updateWedding(userStore.weddingId, 'weddings', weddingData) }
    catch (err) { console.error('weddings 保存失败:', err); weddingOk = false }

    if (!invitationOk && !weddingOk) {
      throw new Error('请柬和婚礼信息均保存失败')
    }

    // 更新本地 store + 缓存（只更新云端成功的部分）
    if (invitationOk) {
      applyLocalPreviewData()
    }
    const weddings = uni.getStorageSync('weddings') || {}
    if (weddings[userStore.weddingId]) {
      if (invitationOk) {
        weddings[userStore.weddingId].invitation = { ...weddings[userStore.weddingId].invitation, ...invitationData }
      }
      weddings[userStore.weddingId] = { ...weddings[userStore.weddingId], ...weddingData }
      uni.setStorageSync('weddings', weddings)
    }
    showSuccess(invitationOk && weddingOk ? '已同步云端'
      : invitationOk ? '请柬已同步，日期信息保存失败请重试'
      : '日期已同步，请柬样式保存失败请重试')
  } catch (err) {
    console.error('保存请柬失败:', err)
    showError(err.message || '保存失败')
  } finally {
    saving.value = false
    uni.hideLoading()
  }
}

function previewInvitation() {
  if (guardInvitationSaving()) return
  if (!validateInvitationForm({ preview: true })) return
  applyLocalPreviewData()
  uni.switchTab({
    url: '/pages/index/index',
    fail: (err) => {
      console.warn('预览请柬失败:', err)
      showError('预览页打开失败，请稍后重试')
    }
  })
}

function previewTemplate() {
  if (guardInvitationSaving()) return
  uni.navigateTo({
    url: `/pages-owner/template/preview?id=${encodeURIComponent(form.value.scenarioPreset)}&visual=${encodeURIComponent(form.value.visualPreset)}&theme=${encodeURIComponent(form.value.theme)}`,
    fail: (err) => {
      console.warn('打开模板预览失败:', err)
      showError('模板预览打开失败，请稍后重试')
    }
  })
}

function guardInvitationSaving() {
  if (!saving.value) return false
  showError('婚书正在保存，请稍候')
  return true
}

function validateInvitationForm(options = {}) {
  if (!form.value.scenarioPreset) {
    showError('请选择场景方案')
    return false
  }
  if (!form.value.groomName.trim() || !form.value.brideName.trim()) {
    showError('请填写新人姓名')
    return false
  }
  if (form.value.groomName.trim().length > 20 || form.value.brideName.trim().length > 20) {
    showError('新人姓名请控制在 20 字内')
    return false
  }
  if (!form.value.date) {
    showError('请选择婚礼日期')
    return false
  }
  if (!isValidDateString(form.value.date)) {
    showError('婚礼日期格式有误')
    return false
  }
  if (!form.value.time) {
    showError('请选择婚礼时间')
    return false
  }
  if (!isValidTimeString(form.value.time)) {
    showError('婚礼时间格式有误')
    return false
  }
  if (!form.value.venueName.trim()) {
    showError('请填写婚礼场地')
    return false
  }
  if (form.value.venueName.trim().length > 40) {
    showError('场地名称请控制在 40 字内')
    return false
  }
  if (!options.preview && !userStore.weddingId) {
    showError('未找到婚礼信息，请重新进入')
    return false
  }
  return true
}

function isValidDateString(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function isValidTimeString(value) {
  const match = String(value || '').match(/^(\d{2}):(\d{2})$/)
  if (!match) return false
  const hour = Number(match[1])
  const minute = Number(match[2])
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function applyPendingTemplate() {
  const pendingTemplateId = uni.getStorageSync('pending_template_id')
  const pendingVisualPresetId = uni.getStorageSync('pending_visual_preset_id')
  if (pendingTemplateId) {
    uni.removeStorageSync('pending_template_id')
    const tpl = getWeddingTemplate(pendingTemplateId)
    form.value.scenarioPreset = normalizeTemplateId(tpl.id)
    form.value.visualPreset = resolveVisualPreset(pendingVisualPresetId, tpl.id)
    if (!form.value.content) {
      form.value.content = tpl.preset?.mainText || ''
    }
    if (!form.value.venueName) {
      form.value.venueName = tpl.preset?.venueName || ''
    }
    applyLocalPreviewData()
  }
  if (pendingVisualPresetId) uni.removeStorageSync('pending_visual_preset_id')
}

onShow(async () => {
  if (!(await useOwnerGuard())) return
  loadFromStore()
  applyPendingTemplate()
})
</script>

<style lang="scss" scoped>
.page {
  background:
    linear-gradient(180deg, rgba(255,248,245,0.98) 0%, $ink-inverse 46%, rgba(255,248,245,1) 100%);
  min-height: 100vh;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

/* 区块 */
.section {
  padding: 0 $page-gutter;
  margin-bottom: 48rpx;
}
.section :deep(.ui-section-header) {
  padding: 0;
  margin-bottom: 20rpx;
}
.section :deep(.ai-panel) {
  margin-left: 0;
  margin-right: 0;
}
.visual-scroll {
  width: 100%;
  white-space: nowrap;
}
.visual-track {
  display: inline-flex;
  align-items: stretch;
  gap: $sp-3;
  padding: 0 $page-gutter $sp-2 0;
}
.visual-option {
  width: 360rpx;
  min-height: 244rpx;
  padding: $sp-3;
  box-sizing: border-box;
  white-space: normal;
  background: $paper-card;
  border: 1rpx solid $line;
  border-top: 5rpx solid $line;
}
.visual-option.active {
  border-color: var(--theme-accent, var(--accent));
  background: var(--theme-accent-soft, var(--accent-soft));
}
.visual-kicker,
.visual-name,
.visual-desc,
.visual-tier {
  display: block;
}
.visual-kicker {
  color: $gold;
  font-size: $fs-cap;
  letter-spacing: $ls-wide;
}
.visual-name {
  margin-top: $sp-2;
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
  color: $gold-ink;
  font-size: $fs-note;
}
.ai-tone-row,
.photo-tone-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-bottom: 18rpx;
}
.ai-tone-pill,
.photo-tone-pill {
  min-height: 56rpx;
  line-height: 56rpx;
  padding: 0 22rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 24rpx;
}
.ai-tone-pill.active,
.photo-tone-pill.active {
  background: var(--theme-accent, $text-primary);
  color: var(--theme-on-accent, $ink-inverse);
}
.ai-tone-pill.disabled,
.photo-tone-pill.disabled {
  opacity: 0.58;
}

.template-card-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18rpx;
}
.scenario-list {
  display: flex;
  flex-direction: column;
  gap: $sp-2;
}
.scenario-row {
  min-height: 104rpx;
  display: flex;
  align-items: center;
  gap: $sp-3;
  padding: $sp-3;
  border-left: 4rpx solid transparent;
  background: $paper-card;
  border-bottom: 1rpx solid $line;
}
.scenario-row.active { border-left-color: var(--accent); background: var(--accent-soft); }
.scenario-row.disabled { opacity: 0.56; }
.scenario-copy { flex: 1; min-width: 0; }
.scenario-name { display: block; color: $ink; font-size: $fs-body; }
.scenario-desc { display: block; margin-top: $sp-1; color: $ink-soft; font-size: $fs-note; line-height: 1.45; }
.scenario-state { flex-shrink: 0; color: var(--accent); font-size: $fs-note; }

/* 模板选择 */
.template-scroll {
  white-space: nowrap;
}
.template-item {
  display: inline-block;
  margin-right: 20rpx;
  width: 220rpx;
  vertical-align: top;
  border-radius: $card-radius;
  border: 3rpx solid transparent;
  padding: 10rpx;
  transition: all 0.2s ease;
}
.template-item.active {
  border-color: $text-primary;
  background: $bg-surface;
  box-shadow: $shadow-sm;
}
.template-preview {
  width: 200rpx;
  height: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: $card-radius;
  overflow: hidden;
  padding: 20rpx;
  box-sizing: border-box;
  position: relative;
}
.template-hero-thumb,
.template-preview-shade {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
.template-hero-thumb {
  z-index: 0;
}
.template-preview-shade {
  z-index: 1;
  background: linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.58));
}
.template-kicker {
  position: relative;
  z-index: 2;
  display: block;
  font-size: 20rpx;
  color: rgba(255,255,255,0.72);
  letter-spacing: 0;
  text-align: center;
  margin-bottom: 18rpx;
  white-space: normal;
}
.template-text {
  position: relative;
  z-index: 2;
  font-size: 30rpx;
  font-weight: 600;
  color: $ink-inverse;
  text-align: center;
}
.template-tier {
  position: absolute;
  z-index: 2;
  left: 18rpx;
  bottom: 18rpx;
  padding: 5rpx 12rpx;
  border-radius: $radius-full;
  background: rgba(255,255,255,0.86);
  color: $color-success;
  font-size: 24rpx;
  line-height: 1.2;
}
.template-tier.premium {
  color: $gold;
}
.template-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $text-muted;
  line-height: 1.45;
  white-space: normal;
}
.template-panel {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: $card-radius;
  background: $text-primary;
  color: $ink-inverse;
  box-shadow: $shadow-sm;
}
.template-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 18rpx;
}
.template-panel-kicker {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.52);
  letter-spacing: 0;
  margin-bottom: 8rpx;
}
.template-panel-title {
  display: block;
  font-size: 34rpx;
  color: $ink-inverse;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.template-panel-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
}
.template-panel-tier {
  padding: 8rpx 16rpx;
  border-radius: $radius-full;
  background: rgba(52,168,83,0.16);
  color: $ink-inverse;
  font-size: 24rpx;
  line-height: 1.2;
}
.template-panel-tier.premium {
  background: rgba(201,169,110,0.18);
  color: $gold;
}
.template-panel-status {
  padding: 8rpx 16rpx;
  border-radius: $radius-full;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.72);
  font-size: 24rpx;
}
.template-panel-copy {
  display: block;
  font-size: 24rpx;
  line-height: 1.55;
  color: rgba(255,255,255,0.72);
  margin-bottom: 14rpx;
}
.template-panel-hint {
  display: block;
  padding: 18rpx 20rpx;
  margin-bottom: 24rpx;
  border-radius: $radius-md;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
  font-size: 24rpx;
  line-height: 1.45;
}
.template-panel-actions {
  display: flex;
  gap: 16rpx;
}
.template-panel-btn {
  flex: 1;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: rgba(255,255,255,0.1);
  color: $ink-inverse;
  font-size: 26rpx;
  padding: 0;
}
.template-panel-btn.primary {
  background: $ink-inverse;
  color: $text-primary;
}
.template-panel-btn::after {
  border: none;
}
.template-panel-btn.is-disabled {
  opacity: 0.56;
}

/* 表单 */
.form-textarea {
  width: 100%;
  height: 200rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid $border-color;
  font-size: 28rpx;
  background: transparent;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 24rpx;
}
.form-col {
  flex: 1;
}
.form-sub-label {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-bottom: 12rpx;
}
.form-input {
  width: 100%;
  height: $control-height;
  padding: 0 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 30rpx;
  background: transparent;
  box-sizing: border-box;
}
.picker-value {
  width: 100%;
  height: $control-height;
  line-height: $control-height;
  font-size: 30rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
}

.form-group {
  margin-bottom: 24rpx;
}
.form-group:last-child {
  margin-bottom: 0;
}

/* 开关列表 */
.switch-list {
  background: $bg-surface;
  border-radius: $card-radius;
  overflow: hidden;
}
.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
}
.switch-item.sub {
  padding-left: 56rpx;
  background: $bg-muted;
}
.switch-item + .switch-item {
  border-top: 1rpx solid $border-color;
}
.switch-item.sub .switch-label {
  color: $text-secondary;
  font-size: 26rpx;
}
.switch-label {
  font-size: 28rpx;
  color: $text-primary;
}

/* 底部按钮 */
.bottom-actions {
  position: fixed;
  bottom: calc(40rpx + constant(safe-area-inset-bottom));
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: $page-gutter;
  right: $page-gutter;
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
  color: $ink-inverse;
}

/* 音乐预设 */
.music-presets {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 20rpx;
}
.music-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 28rpx;
  background: $bg-surface;
  border-radius: $card-radius;
  border: 2rpx solid $border-color;
  transition: all 0.2s ease;
}
.music-item.active {
  border-color: $text-primary;
  background: $text-primary;
}
.music-item.active .music-name { color: $ink-inverse; }
.music-item.disabled {
  opacity: 0.62;
  pointer-events: none;
}
.music-item:active { transform: scale(0.98); }
.music-icon {
  width: 40rpx;
  height: 40rpx;
}
.music-name {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
}
.music-tip {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: $text-muted;
  line-height: 1.5;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $sp-2;
}
.mood-option {
  min-height: 88rpx;
  display: flex;
  align-items: center;
  gap: $sp-2;
  padding: $sp-2;
  border: 1rpx solid $line;
  border-radius: $r-sm;
  background: $paper-card;
}
.mood-option.active { border-color: var(--mood-accent); }
.mood-swatch {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
  border-radius: $r-full;
  background: var(--mood-accent);
}
.mood-copy { min-width: 0; }
.mood-copy text { display: block; }
.mood-copy text:first-child { color: $ink; font-size: $fs-note; }
.mood-copy text:last-child { margin-top: 4rpx; color: $ink-soft; font-size: $fs-note; }
.mood-option.locked .mood-swatch { box-shadow: 0 0 0 3rpx $gold-soft; }
</style>
