const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const automaticOnly = process.argv.includes('--automatic')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertIncludes(file, text, message) {
  assert(read(file).includes(text), `${file}: ${message}`)
}

function walk(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['dist', 'node_modules', 'unpackage'].includes(entry.name)) continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(abs))
    else result.push(abs)
  }
  return result
}

function vueFiles() {
  return walk(root).filter(file => file.endsWith('.vue'))
}

function checkNoVueColorOrLegacyThemeLeaks() {
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/
  const oldThemePattern = /\btheme-(?:red-classic|sakura-pink|champagne|minimal-white|ocean-blue|violet-dream|garden-green|rose|noir|heritage|shandong|travel)\b/
  const oldTemplateClassPattern = /\.tpl-(?:rose|champagne|noir|garden)\b/
  for (const abs of vueFiles()) {
    const rel = path.relative(root, abs)
    const source = read(rel)
    assert(!hexPattern.test(source), `${rel}: .vue files must not contain hardcoded hex colors`)
    assert(!oldThemePattern.test(source), `${rel}: .vue files must not contain old theme class names`)
    assert(!oldTemplateClassPattern.test(source), `${rel}: .vue files must not contain legacy tpl-* selectors`)
  }
}

function checkThemeConstitution() {
  const pagesJson = readJson('pages.json')
  assert(pagesJson.globalStyle.navigationBarBackgroundColor === '#F7F2E9', 'pages.json: navigation bar must use paper background')
  assert(pagesJson.globalStyle.backgroundColor === '#F7F2E9', 'pages.json: global background must use paper background')
  assert(pagesJson.tabBar.selectedColor === '#8A3B45', 'pages.json: selected tab must use the free wine accent')

  const theme = read('styles/theme.scss')
  for (const name of ['wine', 'cinnabar', 'indigo', 'pine']) {
    assert(theme.includes(`theme-${name}`), `styles/theme.scss: must define theme-${name}`)
  }
  for (const variable of ['--accent', '--accent-ink', '--accent-soft', '--accent-line', '--accent-glow', '--on-accent']) {
    assert(theme.includes(variable), `styles/theme.scss: must define ${variable}`)
  }
  assert(theme.includes('--theme-hero-filter: none'), 'styles/theme.scss: photos must be unfiltered by default')

  const uni = read('uni.scss')
  for (const token of ['$paper-bg', '$ink', '$ink-soft', '$gold', '$photo-matte', '@mixin photo-mount', '@mixin photo-hero-scrim']) {
    assert(uni.includes(token), `uni.scss: missing v2 token ${token}`)
  }
}

function checkLegacyThemeNormalization() {
  assertIncludes('utils/legacy-theme-map.js', "'sakura-pink': 'wine'", 'sakura-pink must normalize to wine')
  assertIncludes('utils/legacy-theme-map.js', "VALID_THEMES = ['wine', 'cinnabar', 'indigo', 'pine']", 'valid themes must be the four v2 moods')
  assertIncludes('utils/legacy-theme-map.js', 'resolveTheme(key)', 'theme resolver must be the single JS entrypoint')
  assertIncludes('stores/wedding.js', 'resolveTheme', 'store must normalize fetched wedding theme data')
  assertIncludes('cloudfunctions/createWedding/index.js', "'sakura-pink': 'wine'", 'createWedding must normalize old persisted themes')
  assertIncludes('cloudfunctions/updateWedding/index.js', "'sakura-pink': 'wine'", 'updateWedding must normalize old persisted themes')
  assertIncludes('cloudfunctions/createWedding/index.js', 'resolveTheme(', 'createWedding must call resolveTheme')
  assertIncludes('cloudfunctions/updateWedding/index.js', 'resolveTheme(', 'updateWedding must call resolveTheme')
}

function checkPhotoSystem() {
  assertIncludes('pages/index/index.vue', '@include photo-hero-scrim', 'guest cover must have the paper hero scrim')
  assertIncludes('pages/index/index.vue', 'photoTreatmentClass', 'guest cover and previews must only apply opt-in photo treatments')
  assertIncludes('pages/index/index.vue', 'filter: var(--theme-hero-filter, none)', 'guest photos must not be filtered by default')
  assertIncludes('pages/index/index.vue', 'lux-footer-section', 'guest scroll must have a designed closing section')
  assertIncludes('pages/album/index.vue', 'MAX_ALBUM_PHOTOS = 9', 'album page must cap the curated story at nine photos')
  assertIncludes('pages/album/index.vue', '.slice(0, MAX_ALBUM_PHOTOS)', 'album page must enforce the nine-photo limit')
  assertIncludes('pages/album/index.vue', '@include photo-mount', 'album photos must use mounted photo styling')
  assertIncludes('pages/album/index.vue', 'photoCaption(photo, index)', 'album photos must render exhibition-style captions')
  assertIncludes('pages-owner/album/manage.vue', 'MAX_ALBUM_PHOTOS = 9', 'owner album manager must cap uploaded photos at nine')
  assertIncludes('pages-owner/template/preview.vue', '@include photo-mount', 'template preview photos must use mounted photo styling')
  assertIncludes('components/t-photo/t-photo.vue', '@include photo-mount', 'shared t-photo component must use mounted photo styling')
}

function checkFourActWizard() {
  const wizard = read('pages-owner/wizard/index.vue')
  for (const label of ['具名', '择地', '选照', '定色']) {
    assert(wizard.includes(label), `pages-owner/wizard/index.vue: wizard must include act ${label}`)
  }
  assert(wizard.indexOf('具名') < wizard.indexOf('择地'), 'pages-owner/wizard/index.vue: act order must start with naming')
  assert(wizard.indexOf('择地') < wizard.indexOf('选照'), 'pages-owner/wizard/index.vue: venue act must precede photo act')
  assert(wizard.indexOf('选照') < wizard.indexOf('定色'), 'pages-owner/wizard/index.vue: photo act must precede mood act')
  for (const text of [
    'MAX_ALBUM_PHOTOS = 9',
    'remainingPhotoSlots',
    'chooseWizardImages',
    'pickedPhotos',
    '@include photo-mount',
    '@include photo-hero-scrim',
    'persistWizardPhotos',
    "updateWedding(weddingId, 'albums'",
    'photo_treatment: \'original\''
  ]) {
    assert(wizard.includes(text), `pages-owner/wizard/index.vue: missing wizard acceptance hook ${text}`)
  }
}

function checkPremiumThemeEntitlements() {
  assertIncludes('utils/legacy-theme-map.js', 'isPremiumTheme(key)', 'premium theme helper must exist')
  assertIncludes('utils/commercial.js', 'canUseTheme', 'commercial helper must expose theme entitlement checks')
  assertIncludes('utils/commercial.js', 'billing_state', 'commercial state must record locked premium usage')
  assertIncludes('pages-owner/wizard/index.vue', 'locked: premium && !canUseTheme', 'wizard mood switch must compute locked premium theme states')
  assertIncludes('pages-owner/wizard/index.vue', '高级色体验中', 'wizard must surface premium mood state when selected')
  assertIncludes('pages-owner/invitation/edit.vue', 'moodOptions', 'invitation editor must expose independent mood choices')
  assertIncludes('pages-owner/invitation/edit.vue', 'buildThemeCommercialState', 'invitation editor must persist theme premium state')
  assertIncludes('pages-owner/invitation/edit.vue', ':color="nativeAccentColor"', 'native switches must receive JS-resolved theme color')
  assertIncludes('pages-owner/timeline/edit.vue', ':color="nativeAccentColor"', 'native checkboxes must receive JS-resolved theme color')
  assertIncludes('pages/guide/index.vue', 'mapInk', 'native map callouts must receive JS-resolved theme color')
}

function checkTemplateRuntimeClasses() {
  assertIncludes('stores/wedding.js', 'getThemeClass(resolveTheme(invitation.value?.theme))', 'runtime visual class must come from the independent mood theme')
  assertIncludes('utils/templates.js', 'export const WEDDING_SCENARIOS', 'content scenarios must have a v2 export')
  assertIncludes('utils/templates.js', 'scenarioPreset: template.id', 'content scenarios must expose scenario_preset identity')
  assert(!read('utils/templates.js').includes('return [template.className'), 'utils/templates.js: must not emit legacy tpl-* classes at runtime')
  const templatesSource = read('utils/templates.js')
  const mixedKicker = templatesSource.match(/kicker:\s*'[^']*[\u4e00-\u9fff][^']*'/)
  assert(!mixedKicker, `utils/templates.js: template kickers must be pure English, found ${mixedKicker?.[0] || ''}`)
  for (const page of ['pages/index/index.vue', 'pages/album/index.vue', 'pages/rsvp/index.vue', 'pages/guide/index.vue', 'pages/timeline/index.vue', 'pages/blessing/index.vue', 'pages/more/index.vue']) {
    const source = read(page)
    assert(source.includes('templateClass'), `${page}: guest pages must bind the resolved v2 mood class`)
    assert(
      source.includes(':class="templateClass"') || source.includes(':theme-class="templateClass"'),
      `${page}: guest pages must apply the resolved v2 mood class at runtime`
    )
  }
}

function checkGuestToneAndAccentDiscipline() {
  const guestPages = [
    'pages/index/index.vue',
    'pages/album/index.vue',
    'pages/rsvp/index.vue',
    'pages/guide/index.vue',
    'pages/timeline/index.vue',
    'pages/blessing/index.vue',
    'pages/more/index.vue',
    'pages/poster/index.vue'
  ]
  const forbiddenGuestCopy = [
    '请在主人端',
    '请从有效婚礼邀请进入',
    '当前没有关联的婚礼信息',
    '新人暂未开放',
    '待主人匹配地图',
    '待匹配',
    '建议使用竖版主封面',
    '主人正在',
    '主人尚未',
    '管理后台',
    'API Key',
    '缺少婚礼 ID',
    '无小程序码模式',
    '婚礼信息加载失败',
    '相册加载失败',
    '祝福加载失败',
    '流程加载失败',
    '加载失败，下拉重试'
  ]

  for (const page of guestPages) {
    const source = read(page)
    for (const copy of forbiddenGuestCopy) {
      assert(!source.includes(copy), `${page}: guest-facing pages must not leak backend/admin copy: ${copy}`)
    }
  }

  const home = read('pages/index/index.vue')
  for (const text of ['GUEST ACTIONS', '宾客行动', 'lux-float-actions', 'lux-rsvp-chip', 'lux-mini-grid', '待回执', '最近流程', 'lux-action-panel', 'lux-panel-btn', 'lux-preview', 'activeTemplate.photoMood']) {
    assert(!home.includes(text), `pages/index/index.vue: home must not keep dashboard/action residue: ${text}`)
  }
  assert(home.includes('kicker="INVITATION"'), 'pages/index/index.vue: invitation section must use a pure English gold kicker')
  assert(home.includes('lux-couple-amp'), 'pages/index/index.vue: couple names must be joined by a gold ampersand')
  assert(home.includes('THE WEDDING OF'), 'pages/index/index.vue: cover must use a pure English gold wedding kicker')
  assert(home.includes('lux-detail-section'), 'pages/index/index.vue: home must include the wedding details chapter')
  assert(home.includes('lux-rsvp-section'), 'pages/index/index.vue: home must end the guest action as an RSVP chapter')
  assert(!read('stores/wedding.js').includes('请在主人端填写婚礼地址'), 'stores/wedding.js: fallback data must not leak admin copy into guest pages')

  const preview = read('pages-owner/template/preview.vue')
  for (const text of ['GUEST PACK', '宾客行动台', 'preview.template.shortName }} ARRIVAL PACK', 'preview.template.shortName }} RSVP CARD', 'theme-strong-bg']) {
    assert(!preview.includes(text), `pages-owner/template/preview.vue: template preview must not preserve old dashboard mock: ${text}`)
  }

  const guide = read('pages/guide/index.vue')
  assert(guide.includes('suggestedArrivalTime'), 'pages/guide/index.vue: suggested arrival must be derived or hidden')
  assert(read('stores/wedding.js').includes('suggestedArrivalTime'), 'stores/wedding.js: suggested arrival must be centralized in the wedding store')
  assert(guide.includes("return '以当日为准'"), 'pages/guide/index.vue: weather fallback must be guest-facing')
  assert(guide.includes('v-if="hasCoordinate(primaryVenue)"'), 'pages/guide/index.vue: navigation button must not render as a disabled pseudo button')

  const more = read('pages/more/index.vue')
  assert(more.includes('more-seal'), 'pages/more/index.vue: share feature must use the paper card plus small seal treatment')
  assert(more.includes('more-contact-inline'), 'pages/more/index.vue: contact service must be downgraded to footer copy')
  assert(!more.includes('tone="primary"'), 'pages/more/index.vue: guide action must not be a large accent card')
  for (const duplicate of ['goToAlbum', 'goToTimeline', 'goToGuide', 'goToRSVP']) {
    assert(!more.includes(duplicate), `pages/more/index.vue: more page must not repeat primary navigation action ${duplicate}`)
  }

  const poster = read('pages/poster/index.vue')
  assert(!poster.includes('rgba(249,171'), 'pages/poster/index.vue: poster notices must not introduce a yellow fifth-color label')
  assert(poster.includes('$gold-soft'), 'pages/poster/index.vue: poster notices should use the paper/gold system')
  assert(poster.includes('background: var(--theme-accent, $color-primary)'), 'pages/poster/index.vue: primary poster action should use the mood accent')
  assert(poster.includes('guestStore.hydrate(weddingId)'), 'pages/poster/index.vue: poster deep links must render the last valid guest snapshot first')
  assert(poster.includes('isDevToolsRuntime()'), 'pages/poster/index.vue: poster preview must not call the QR cloud function in DevTools')
  assert(poster.includes('generateWeddingShareCard({ instance, store })'), 'pages/poster/index.vue: poster shares must use the composed wedding card')
  assert(read('pages/more/index.vue').includes('generateWeddingShareCard({ instance, store })'), 'pages/more/index.vue: more-page shares must use the composed wedding card')
  assert(poster.includes('destWidth: POSTER_CANVAS_WIDTH * POSTER_CANVAS_DPR'), 'pages/poster/index.vue: poster export must retain its 2x canvas resolution')
  assert(poster.includes('previewScale.value / POSTER_CANVAS_DPR'), 'pages/poster/index.vue: poster preview must downscale the real 2x canvas without clipping')
  assert(read('utils/posterCanvas.js').includes('POSTER_CANVAS_WIDTH * POSTER_CANVAS_DPR'), 'utils/posterCanvas.js: legacy canvas must allocate its real 2x drawing size')
}

function checkManualAcceptanceArtifacts() {
  assert(fs.existsSync(path.join(root, 'docs', 'v2-real-device-acceptance.md')), 'docs/v2-real-device-acceptance.md: manual acceptance checklist must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'create-v2-acceptance-record.js')), 'scripts/create-v2-acceptance-record.js: release acceptance record generator must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'record-v2-automatic-evidence.js')), 'scripts/record-v2-automatic-evidence.js: automatic evidence recorder must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'record-v2-manual-evidence.js')), 'scripts/record-v2-manual-evidence.js: manual evidence recorder must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'check-v2-real-device-record.js')), 'scripts/check-v2-real-device-record.js: final real-device record checker must exist')
  assert(fs.existsSync(path.join(root, 'scripts', 'find-legacy-sakura-wedding.js')), 'scripts/find-legacy-sakura-wedding.js: legacy sakura-pink query helper must exist')
  assert(fs.existsSync(path.join(root, 'preview.mjs')), 'preview.mjs: real-device preview QR generator must exist')
  assertIncludes('docs/v2-real-device-acceptance.md', '朋友第一反应', 'manual checklist must capture the uninformed friend reaction')
  assertIncludes('docs/v2-real-device-acceptance.md', '--friend-evidence', 'manual checklist must require friend feedback evidence')
  assertIncludes('docs/v2-real-device-acceptance.md', 'theme=sakura-pink', 'manual checklist must capture old sakura-pink data validation')
  assertIncludes('docs/v2-real-device-acceptance.md', '.release/v2-evidence-<version>/', 'manual checklist must require local evidence files')
  assertIncludes('docs/v2-real-device-acceptance.md', 'npm run preview:mp-weixin', 'manual checklist must document preview QR generation')
  assertIncludes('docs/v2-real-device-acceptance.md', 'npm run record:v2-manual-evidence', 'manual checklist must document manual evidence recording')
  assertIncludes('docs/v2-real-device-acceptance.md', 'npm run record:v2-automatic-evidence', 'manual checklist must document automatic evidence recording')
  assertIncludes('docs/v2-real-device-acceptance.md', 'npm run find:legacy-sakura', 'manual checklist must document the old-data query command')
  assertIncludes('package.json', 'preview:mp-weixin', 'package scripts must expose the real-device preview command')
  assertIncludes('scripts/create-v2-acceptance-record.js', 'v2-real-device-acceptance-', 'record generator must write versioned release evidence')
  assertIncludes('scripts/record-v2-automatic-evidence.js', 'Automatic v2 evidence recorded', 'automatic evidence recorder must update the release record')
  assertIncludes('scripts/record-v2-manual-evidence.js', 'Manual v2 evidence recorded', 'manual evidence recorder must update the release record')
  assertIncludes('scripts/record-v2-manual-evidence.js', 'friend-quote', 'manual evidence recorder must capture friend feedback')
  assertIncludes('scripts/record-v2-manual-evidence.js', 'friend-evidence', 'manual evidence recorder must require friend feedback evidence')
  assertIncludes('scripts/check-v2-real-device-record.js', 'v2 real-device acceptance is not complete', 'final real-device checker must fail while evidence is pending')
  assertIncludes('scripts/check-v2-real-device-record.js', '证据文件不存在', 'final real-device checker must verify local evidence files')
  assertIncludes('scripts/check-v2-real-device-record.js', '必须填写朋友反馈原话', 'final real-device checker must verify friend feedback text')
  assertIncludes('scripts/find-legacy-sakura-wedding.js', "'sakura-pink'", 'legacy query helper must search for sakura-pink')
  assertIncludes('preview.mjs', 'preview-${version}.png', 'preview QR generator must write a versioned QR image')
  assertIncludes('preview.mjs', "npm', ['run', 'build:mp-weixin']", 'preview QR generator must build before preview by default')
  assertIncludes('preview.mjs', 'outputContainsCliError', 'preview QR generator must fail on WeChat CLI error output')
  assertIncludes('preview.mjs', 'MINIPROGRAM_PREVIEW_SETTLE_MS', 'preview QR generator must allow delayed cleanup after DevTools preview')
  assertIncludes('preview.mjs', 'stagePreviewProject', 'preview QR generator must isolate the watched WeChat project from the clean build output')
  assertIncludes('preview.mjs', "path.join('/tmp', `wedding-miniprogram-preview-${version}`)", 'preview QR generator must stage previews outside the repository')
}

function checkVisualStorySystem() {
  const presets = read('utils/visual-presets.js')
  const wizard = read('pages-owner/wizard/index.vue')
  const home = read('pages/index/index.vue')
  const album = read('pages/album/index.vue')
  const shareCard = read('utils/shareCard.js')
  for (const preset of ['cinematic-documentary', 'new-chinese-ceremony', 'garden-film', 'editorial-couture', 'night-banquet']) {
    assert(presets.includes(preset), `utils/visual-presets.js: missing ${preset}`)
  }
  assert(wizard.includes('visualOptions') && wizard.includes('heroPreviewImage'), 'wizard must preview visual stories with the selected photo')
  assert(wizard.includes('photoQualityLabel') && wizard.includes('focusOptions'), 'wizard must expose photo direction feedback')
  assert(home.includes('activeVisualPreset') && home.includes('lux-story-beat'), 'guest home must vary visual rhythm by preset')
  for (const layout of ['contact-sheet', 'editorial-spread', 'ceremony-scroll', 'night-sequence']) {
    assert(album.includes(`layout-${layout}`), `album must implement ${layout}`)
  }
  assert(shareCard.includes('generateWeddingShareCard') && shareCard.includes('SHARE_CARD_WIDTH = 500'), 'share card must be a composed 5:4 cover')
  assert(read('utils/posterCanvas.js').includes('getVisualPreset'), 'poster canvas must use the visual preset')
}

function runAutomaticChecks() {
  checkNoVueColorOrLegacyThemeLeaks()
  checkThemeConstitution()
  checkLegacyThemeNormalization()
  checkPhotoSystem()
  checkFourActWizard()
  checkPremiumThemeEntitlements()
  checkTemplateRuntimeClasses()
  checkGuestToneAndAccentDiscipline()
  checkVisualStorySystem()
  checkManualAcceptanceArtifacts()
  console.log('v2 automatic acceptance checks passed')
}

function printManualChecklist() {
  if (automaticOnly) return
  console.log('')
  console.log('Manual evidence still required before marking v2.0 complete:')
  console.log('- Scan the latest preview on a real phone, switch wine/cinnabar/indigo/pine, and inspect every guest screen for fifth-color leaks.')
  console.log('- Scroll the guest invitation from cover to footer on device and confirm the impression is an invitation, not an app dashboard.')
  console.log('- Use a real wedding record with theme=sakura-pink and confirm it opens as wine without console/runtime errors.')
  console.log('- Run the four-act owner wizard on device, pick photos in act 3, and confirm mounted previews appear immediately.')
  console.log('- Ask an uninformed person to look at any guest screenshot and record whether their first reaction is invitation/card.')
}

runAutomaticChecks()
printManualChecklist()
